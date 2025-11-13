import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService, RedisService } from '../services/serviceFactory';
import { authenticateAdmin, requirePermission } from '../middleware/adminAuth';
import { adminCsrfProtection } from '../middleware/adminCsrf';
import { StatusService, ActiveIncident, IncidentSeverity } from '../services/status';
import { AnalyticsService } from '../services/analytics';
import { createLogger } from '../utils/logger';
import type { AnalyticsFilterParams } from '../types/services';

const router: Router = Router();
const log = createLogger('admin-routes');

const ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_LOGIN_RATE_LIMIT_MAX_PER_IDENTIFIER = 10;
const ADMIN_LOGIN_RATE_LIMIT_MAX_PER_IP = 20;

const ADMIN_SESSION_DEFAULT_TTL_SECONDS = 12 * 60 * 60; // 12 hours
const ADMIN_SESSION_MIN_TTL_SECONDS = 5 * 60; // 5 minutes
const ADMIN_SESSION_MAX_TTL_SECONDS = 24 * 60 * 60; // 24 hours

if (!process.env.OWNER_ADMIN_EMAIL) {
  process.env.OWNER_ADMIN_EMAIL = 'saurabhshukla1966@gmail.com';
}

const OWNER_SUPER_ADMIN_EMAIL = process.env.OWNER_ADMIN_EMAIL.trim().toLowerCase();
const OWNER_SUPER_ADMIN_PASSWORD = process.env.OWNER_ADMIN_PASSWORD?.trim();
const OWNER_SUPER_ADMIN_PASSWORD_HASH = process.env.OWNER_ADMIN_PASSWORD_HASH?.trim();

type MaybeUserRecord = {
  role?: string;
  tier?: string;
  verificationStatus?: string;
  subscriptionLevel?: string;
  isVerified?: boolean;
};

const normalizeRole = (value?: string) => (typeof value === 'string' ? value.trim().toLowerCase() : undefined);

const resolveUserRole = (user?: MaybeUserRecord): 'guest' | 'user' | 'admin' | 'super_admin' => {
  const role = normalizeRole(user?.role);
  const tier = normalizeRole(user?.tier);
  if (role === 'super_admin' || tier === 'super_admin') return 'super_admin';
  if (role === 'admin' || tier === 'admin') return 'admin';
  if (role === 'guest' || tier === 'guest') return 'guest';
  return 'user';
};

const resolveVerificationStatus = (user?: MaybeUserRecord): 'guest' | 'verified' => {
  if (user?.verificationStatus === 'verified') return 'verified';
  if (user?.verificationStatus === 'guest') return 'guest';
  return user?.isVerified ? 'verified' : 'guest';
};

const resolveSubscriptionLevel = (user?: MaybeUserRecord): 'normal' | 'premium' => {
  return user?.subscriptionLevel === 'premium' ? 'premium' : 'normal';
};

type OwnerPasswordCheckResult = {
  matches: boolean;
  matchedSource: 'plain' | 'hash' | null;
  hashFromEnv?: string;
  hasPlainEnv: boolean;
  hasHashEnv: boolean;
};

const checkOwnerPassword = async (candidate: string): Promise<OwnerPasswordCheckResult> => {
  if (!candidate) {
    return {
      matches: false,
      matchedSource: null,
      hasPlainEnv: Boolean(OWNER_SUPER_ADMIN_PASSWORD),
      hasHashEnv: Boolean(OWNER_SUPER_ADMIN_PASSWORD_HASH)
    };
  }

  const hasPlainEnv = Boolean(OWNER_SUPER_ADMIN_PASSWORD);
  const hasHashEnv = Boolean(OWNER_SUPER_ADMIN_PASSWORD_HASH);

  if (OWNER_SUPER_ADMIN_PASSWORD && candidate === OWNER_SUPER_ADMIN_PASSWORD) {
    return {
      matches: true,
      matchedSource: 'plain',
      hasPlainEnv,
      hasHashEnv
    };
  }

  if (OWNER_SUPER_ADMIN_PASSWORD_HASH) {
    try {
      const hash = OWNER_SUPER_ADMIN_PASSWORD_HASH;
      if (hash.startsWith('$2') && (await bcrypt.compare(candidate, hash))) {
        return {
          matches: true,
          matchedSource: 'hash',
          hashFromEnv: hash,
          hasPlainEnv,
          hasHashEnv
        };
      }
    } catch (err) {
      log.warn('Owner admin env hash comparison failed', {
        error: err instanceof Error ? err.message : err
      });
    }
  }

  return {
    matches: false,
    matchedSource: null,
    hasPlainEnv,
    hasHashEnv
  };
};


const parseDurationToSeconds = (value: string | number | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }

    const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
    if (match) {
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 's':
          return amount;
        case 'm':
          return amount * 60;
        case 'h':
          return amount * 60 * 60;
        case 'd':
          return amount * 60 * 60 * 24;
        default:
          break;
      }
    }
  }

  return ADMIN_SESSION_DEFAULT_TTL_SECONDS;
};

const getAdminLoginIdentifierKey = (identifier: string) => {
  const safeIdentifier = identifier?.toLowerCase().replace(/[^a-z0-9._-]/gi, '') || 'unknown';
  return `admin-login:identifier:${safeIdentifier}`;
};

const getAdminLoginIpKey = (ip: string) => {
  const safeIp = ip?.replace(/[^a-z0-9:._-]/gi, '') || 'unknown';
  return `admin-login:ip:${safeIp}`;
};

const ANALYTICS_MAX_DAYS = 60;
const ANALYTICS_DAY_MS = 24 * 60 * 60 * 1000;

type ParsedAnalyticsQuery = {
  windowStart: Date;
  windowEnd: Date;
  windowDays: number;
  filters: AnalyticsFilterParams;
  appliedFilters: {
    genders: string[];
    platforms: string[];
    signupSources: string[];
    campaigns: string[];
  };
};

const collectFilterValues = (...candidates: Array<unknown>): string[] => {
  const values: string[] = [];

  candidates.forEach((candidate) => {
    if (!candidate) {
      return;
    }

    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => {
        if (typeof entry === 'string') {
          entry
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .forEach((value) => values.push(value));
        }
      });
      return;
    }

    if (typeof candidate === 'string') {
      candidate
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => values.push(value));
    }
  });

  return Array.from(new Set(values));
};

const parseAnalyticsQueryParams = (req: Request): ParsedAnalyticsQuery => {
  const rawStart = typeof req.query.start === 'string' ? req.query.start : undefined;
  const rawEnd = typeof req.query.end === 'string' ? req.query.end : undefined;
  const rawDays = typeof req.query.days === 'string' ? req.query.days : undefined;
  const daysParam = rawDays ? Number.parseInt(rawDays, 10) : NaN;

  const genders = collectFilterValues(req.query.gender, req.query['gender[]']);
  const platforms = collectFilterValues(req.query.platform, req.query['platform[]']);
  const signupSources = collectFilterValues(req.query.signupSource, req.query['signupSource[]'], req.query.source, req.query['source[]']);
  const campaigns = collectFilterValues(req.query.campaign, req.query['campaign[]'], req.query.campaignId, req.query['campaignId[]']);

  const filters: AnalyticsFilterParams = {
    genders: genders.length ? genders : undefined,
    platforms: platforms.length ? platforms : undefined,
    signupSources: signupSources.length ? signupSources : undefined,
    campaigns: campaigns.length ? campaigns : undefined
  };

  let windowStart: Date;
  let windowEnd: Date;
  let windowDays: number;

  if (rawStart && rawEnd) {
    const parsedStart = new Date(rawStart);
    const parsedEnd = new Date(rawEnd);

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      throw new Error('INVALID_RANGE:Invalid custom date range provided.');
    }

    windowStart = new Date(parsedStart.getTime());
    windowStart.setUTCHours(0, 0, 0, 0);
    windowEnd = new Date(parsedEnd.getTime());
    windowEnd.setUTCHours(0, 0, 0, 0);

    if (windowStart > windowEnd) {
      throw new Error('INVALID_RANGE:Start date must be before end date.');
    }

    windowDays = Math.floor((windowEnd.getTime() - windowStart.getTime()) / ANALYTICS_DAY_MS) + 1;
    if (windowDays > ANALYTICS_MAX_DAYS) {
      throw new Error(`INVALID_RANGE:Date range cannot exceed ${ANALYTICS_MAX_DAYS} days.`);
    }
  } else {
    const boundedDays = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= ANALYTICS_MAX_DAYS ? daysParam : 14;
    windowDays = boundedDays;

    windowEnd = new Date();
    windowEnd.setUTCHours(0, 0, 0, 0);
    windowStart = new Date(windowEnd.getTime() - (windowDays - 1) * ANALYTICS_DAY_MS);
  }

  return {
    windowStart,
    windowEnd,
    windowDays,
    filters,
    appliedFilters: {
      genders: filters.genders ?? [],
      platforms: filters.platforms ?? [],
      signupSources: filters.signupSources ?? [],
      campaigns: filters.campaigns ?? []
    }
  };
};

/* ---------- Public Routes (No Auth Required) ---------- */

/**
 * Admin Login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    log.debug('Admin login attempt received');

    const { username, password } = req.body;

    if (!username || !password) {
      log.warn('Admin login rejected: missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    const forwardedFor = (req.headers['x-forwarded-for'] as string) || '';
    const clientIp = forwardedFor.split(',')[0]?.trim() || req.ip || 'unknown';
    const identifierKey = getAdminLoginIdentifierKey(username);
    const ipKey = getAdminLoginIpKey(clientIp);

    const [identifierAllowed, ipAllowed] = await Promise.all([
      RedisService.checkRateLimit(identifierKey, ADMIN_LOGIN_RATE_LIMIT_MAX_PER_IDENTIFIER, ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS),
      RedisService.checkRateLimit(ipKey, ADMIN_LOGIN_RATE_LIMIT_MAX_PER_IP, ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS)
    ]);

    if (!identifierAllowed || !ipAllowed) {
      log.warn('Admin login rate limit triggered', {
        clientIp,
        identifierAllowed,
        ipAllowed
      });
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please wait a few minutes and try again.',
        code: 'ADMIN_LOGIN_RATE_LIMIT'
      });
    }

    const identifierRaw = String(username).trim();
    const normalizedIdentifier = identifierRaw.toLowerCase();

    const bcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const resolvedRounds = Number.isFinite(bcryptRounds) && bcryptRounds >= 4 ? bcryptRounds : 12;
    const ownerPasswordCheck = await checkOwnerPassword(password);
    const isOwnerEnvLoginAttempt = normalizedIdentifier === OWNER_SUPER_ADMIN_EMAIL && ownerPasswordCheck.matches;

    if (normalizedIdentifier === OWNER_SUPER_ADMIN_EMAIL && !ownerPasswordCheck.matches) {
      log.warn('Owner admin login password mismatch', {
        hasPlainEnv: ownerPasswordCheck.hasPlainEnv,
        hasHashEnv: ownerPasswordCheck.hasHashEnv
      });
    }

    let admin = await DatabaseService.findAdminByUsername(identifierRaw);
    if (!admin && normalizedIdentifier !== identifierRaw) {
      admin = await DatabaseService.findAdminByUsername(normalizedIdentifier);
    }
    if (!admin) {
      admin = await DatabaseService.findAdminByEmail(normalizedIdentifier);
    }

    let linkedUser: any = null;

    const adminEmail = typeof admin?.email === 'string' ? admin.email.trim().toLowerCase() : undefined;
    if (adminEmail) {
      linkedUser = await DatabaseService.getUserByEmail(adminEmail);
    }

    if (!linkedUser && identifierRaw.includes('@')) {
      linkedUser = await DatabaseService.getUserByEmail(normalizedIdentifier);
    }

    if (!linkedUser && admin?.userId) {
      linkedUser = await DatabaseService.getUserById(admin.userId);
    }

    const allowedAdminRoles = new Set(['admin', 'super_admin']);
    const linkedUserRole = linkedUser ? resolveUserRole(linkedUser) : 'guest';

    if (linkedUser && !allowedAdminRoles.has(linkedUserRole) && !isOwnerEnvLoginAttempt) {
      log.warn('Admin login rejected: user lacks admin privileges', {
        userId: linkedUser.id,
        role: linkedUserRole
      });
      return res.status(403).json({
        success: false,
        error: 'Admin access not granted for this account'
      });
    }

    if (!admin && linkedUser && (allowedAdminRoles.has(linkedUserRole) || isOwnerEnvLoginAttempt)) {
      const targetRole = isOwnerEnvLoginAttempt ? 'super_admin' : (linkedUserRole as 'admin' | 'super_admin');
      if (!allowedAdminRoles.has(linkedUserRole) && isOwnerEnvLoginAttempt) {
        try {
          await DatabaseService.updateUserRole(linkedUser.id, 'super_admin');
          linkedUser.role = 'super_admin';
        } catch (promoteError) {
          log.warn('Failed to promote linked user to super_admin during owner login', {
            error: promoteError,
            userId: linkedUser.id
          });
        }
      }

      admin = await DatabaseService.syncAdminAccessForRole(
        linkedUser.id,
        targetRole
      );
    }

    if ((!admin || !admin.isActive) && isOwnerEnvLoginAttempt) {
      try {
        let ownerPasswordHash = ownerPasswordCheck.hashFromEnv;
        if (!ownerPasswordHash) {
          ownerPasswordHash = await bcrypt.hash(password, resolvedRounds);
        }

        if (!admin) {
          admin = await DatabaseService.createAdmin({
            username: identifierRaw.includes('@') ? identifierRaw.split('@')[0] : identifierRaw,
            email: normalizedIdentifier,
            passwordHash: ownerPasswordHash,
            role: 'super_admin',
            permissions: ['all'],
            isOwner: true,
            isActive: true
          } as any) || await DatabaseService.findAdminByEmail(normalizedIdentifier);
        } else if (!admin.passwordHash || (ownerPasswordCheck.hashFromEnv && admin.passwordHash !== ownerPasswordCheck.hashFromEnv)) {
          await DatabaseService.updateAdminPassword(admin.id || admin.email || normalizedIdentifier, ownerPasswordHash, {
            removeLegacyPassword: true
          });
          admin.passwordHash = ownerPasswordHash;
        }

        if (admin) {
          admin.isActive = true;
          admin.role = 'super_admin';
          admin.permissions = Array.isArray(admin.permissions) && admin.permissions.length > 0 ? admin.permissions : ['all'];
          admin.isOwner = true;
        }
      } catch (ownerBootstrapError) {
        log.error('Owner admin bootstrap failed', { error: ownerBootstrapError });
      }
    }

    if (!admin || !admin.isActive) {
      log.warn('Admin login rejected: inactive or missing account');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    let adminId = String(admin.id || admin._id || '').trim();
    if (!adminId && linkedUser && allowedAdminRoles.has(linkedUserRole)) {
      const synced = await DatabaseService.syncAdminAccessForRole(
        linkedUser.id,
        linkedUserRole as 'admin' | 'super_admin'
      );
      if (synced) {
        admin = synced;
        adminId = String(synced.id || synced._id || '').trim();
      }
    }

    if (!adminId) {
      log.error('Admin login failed: admin record missing identifier');
      return res.status(500).json({
        success: false,
        error: 'Admin configuration error'
      });
    }

    const adminNormalizedRole = normalizeRole(admin.role);

    let effectiveRole: 'admin' | 'super_admin';
    if (isOwnerEnvLoginAttempt) {
      effectiveRole = 'super_admin';
    } else if (linkedUser && allowedAdminRoles.has(linkedUserRole)) {
      effectiveRole = linkedUserRole as 'admin' | 'super_admin';
    } else if (adminNormalizedRole && allowedAdminRoles.has(adminNormalizedRole)) {
      effectiveRole = adminNormalizedRole as 'admin' | 'super_admin';
    } else {
      log.warn('Admin login rejected: insufficient admin role', { adminId, role: admin.role });
      return res.status(403).json({
        success: false,
        error: 'Admin role not permitted'
      });
    }

    const storedHashes: Array<{ hash: string; source: 'admin' | 'user' }> = [];
    const legacyPassword = typeof admin?.password === 'string' ? admin.password.trim() : undefined;

    if (typeof admin?.passwordHash === 'string' && admin.passwordHash.trim().length > 0) {
      storedHashes.push({ hash: admin.passwordHash.trim(), source: 'admin' });
    }
    if (linkedUser?.passwordHash) {
      storedHashes.push({ hash: linkedUser.passwordHash, source: 'user' });
    }
    const attemptCompare = async (hash: string): Promise<boolean> => {
      try {
        return await bcrypt.compare(password, hash);
      } catch (err) {
        log.error('Admin login bcrypt comparison failed', { error: err });
        return false;
      }
    };

    let isValidPassword = false;
    let needsUpgrade = false;

    const seenHashes = new Set<string>();
    for (const entry of storedHashes) {
      const normalizedHash = entry.hash?.trim();
      if (!normalizedHash || seenHashes.has(normalizedHash)) {
        continue;
      }
      seenHashes.add(normalizedHash);

      if (normalizedHash.startsWith('$2')) {
        if (await attemptCompare(normalizedHash)) {
          isValidPassword = true;
          break;
        }
      } else if (normalizedHash === password) {
        isValidPassword = true;
        if (entry.source === 'admin') {
          needsUpgrade = true;
        }
        break;
      }
    }

    if (!isValidPassword && legacyPassword && legacyPassword === password) {
      isValidPassword = true;
      needsUpgrade = true;
    }

    if (!isValidPassword && isOwnerEnvLoginAttempt) {
      isValidPassword = true;
      if (!ownerPasswordCheck.hashFromEnv) {
        needsUpgrade = true;
      } else if (!admin?.passwordHash || admin.passwordHash !== ownerPasswordCheck.hashFromEnv) {
        needsUpgrade = true;
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (linkedUser && (allowedAdminRoles.has(linkedUserRole) || isOwnerEnvLoginAttempt)) {
      const refreshedAdmin = await DatabaseService.syncAdminAccessForRole(
        linkedUser.id,
        effectiveRole
      );
      if (refreshedAdmin) {
        admin = refreshedAdmin;
      } else {
        admin.role = effectiveRole;
        admin.email = linkedUser.email || admin.email;
      }
    } else if (isOwnerEnvLoginAttempt && admin?.userId) {
      try {
        await DatabaseService.updateUserRole(admin.userId, 'super_admin');
      } catch (syncRoleError) {
        log.warn('Failed to sync user role for owner login', {
          error: syncRoleError,
          adminId
        });
      }
    }

    adminId = String(admin.id || admin._id || adminId).trim();
    if (!adminId) {
      log.error('Admin login failed: admin identifier missing after synchronization');
      return res.status(500).json({
        success: false,
        error: 'Admin configuration error'
      });
    }

    const adminPermissions: string[] = Array.isArray(admin.permissions) && admin.permissions.length > 0
      ? admin.permissions
      : effectiveRole === 'super_admin'
        ? ['all']
        : ['view_users', 'ban_users', 'view_reports', 'resolve_reports', 'view_stats', 'view_analytics', 'manage_status'];

    admin.role = effectiveRole;
    admin.permissions = adminPermissions;

    if (needsUpgrade) {
      try {
        const newHash = ownerPasswordCheck.hashFromEnv || (await bcrypt.hash(password, resolvedRounds));
        await DatabaseService.updateAdminPassword(adminId, newHash, {
          removeLegacyPassword: true
        });
        admin.passwordHash = newHash;
      } catch (upgradeError) {
        log.warn('Failed to upgrade legacy admin password hash', { error: upgradeError, adminId });
      }
    }

    // Generate JWT token
    const jwtSecret = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret');
    const jwtExpire = (process.env.ADMIN_JWT_EXPIRE || '12h');
    const rawSessionTtlSeconds = parseDurationToSeconds(jwtExpire);
    const sessionTtlSeconds = Math.min(
      ADMIN_SESSION_MAX_TTL_SECONDS,
      Math.max(ADMIN_SESSION_MIN_TTL_SECONDS, rawSessionTtlSeconds)
    );
    
    // @ts-expect-error - JWT typing issue with environment variables
    const token: string = jwt.sign(
      {
        adminId,
        username: String(admin.username),
        role: String(admin.role),
        permissions: admin.permissions
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    // Create admin session + CSRF token
    if (typeof RedisService.storeAdminSession !== 'function') {
      log.error('Admin login failed: Redis session service unavailable');
      return res.status(500).json({
        success: false,
        error: 'Admin session service unavailable'
      });
    }

    const sessionId = randomBytes(24).toString('hex');
    const csrfToken = randomBytes(24).toString('hex');
    const nowMs = Date.now();
    const sessionRecord = {
      adminId,
      csrfToken,
      createdAt: nowMs,
      expiresAt: nowMs + sessionTtlSeconds * 1000,
      ip: clientIp,
      userAgent: req.get('user-agent') || undefined
    };
    try {
      await RedisService.storeAdminSession(sessionId, sessionRecord, sessionTtlSeconds);
    } catch (sessionError) {
      log.error('Admin login failed: session persistence error', { error: sessionError, adminId });
      return res.status(500).json({
        success: false,
        error: 'Failed to start admin session'
      });
    }

    // Update last login
    await DatabaseService.updateAdminLastLogin(adminId);

    try {
      await Promise.all([
        RedisService.del(identifierKey),
        RedisService.del(ipKey)
      ]);
    } catch (clearError) {
      log.warn('Failed to clear admin login rate limit counters', { error: clearError });
    }

    log.debug('Admin login successful', { adminId, role: admin.role });

    return res.json({
      success: true,
      token,
      session: {
        id: sessionId,
        csrfToken,
        expiresAt: new Date(sessionRecord.expiresAt).toISOString(),
        ttlSeconds: sessionTtlSeconds
      },
      admin: {
        id: admin.id || adminId,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isOwner: admin.isOwner || false,
        permissions: admin.permissions
      }
    });
  } catch (error: any) {
    log.error('Admin login error', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Create first admin (only if no admins exist)
 */
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password required'
      });
    }

    // Check if any admin exists
    const existingAdmins = await DatabaseService.getAllAdmins();
    
    if (existingAdmins.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Admin setup already completed'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create super admin
    const admin = await DatabaseService.createAdmin({
      username,
      email,
      passwordHash,
      role: 'super_admin'
    });

    if (!admin) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create admin'
      });
    }

    res.json({
      success: true,
      message: 'Super admin created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error: any) {
    log.error('Admin setup error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Setup failed'
    });
  }
});

/* ---------- Protected Routes (Admin Auth Required) ---------- */

/**
 * Get platform statistics
 */
router.get('/stats', authenticateAdmin, requirePermission('view_stats'), async (req: Request, res: Response) => {
  try {
    const stats = await DatabaseService.getPlatformStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    log.error('Admin stats error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stats'
    });
  }
});

/**
 * Platform status summary (live sockets, queues, incidents)
 */
router.get('/status/summary', authenticateAdmin, requirePermission('view_stats'), async (_req: Request, res: Response) => {
  try {
    const summary = await StatusService.getSummary();

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    log.error('Admin status summary error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch status summary'
    });
  }
});

/**
 * Update or create an active incident banner
 */
router.put('/status/incident', authenticateAdmin, adminCsrfProtection, requirePermission('manage_status'), async (req: Request, res: Response) => {
  const parseIsoDate = (value: unknown): string | undefined => {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'number') {
      const dateFromNumber = new Date(value);
      if (!Number.isNaN(dateFromNumber.getTime())) {
        return dateFromNumber.toISOString();
      }
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      const dateFromString = new Date(trimmed);
      if (!Number.isNaN(dateFromString.getTime())) {
        return dateFromString.toISOString();
      }
    }

    return undefined;
  };

  try {
    const payload = (req.body?.incident ?? req.body ?? {}) as Partial<ActiveIncident> & {
      publishAt?: string | number;
      expiresAt?: string | number;
      requiresAck?: boolean;
      audience?: string;
    };

    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Incident message required'
      });
    }

    const severityCandidate = payload.severity as IncidentSeverity | undefined;
    const allowedSeverities: IncidentSeverity[] = ['info', 'warning', 'critical'];
    const severity: IncidentSeverity = severityCandidate && allowedSeverities.includes(severityCandidate)
      ? severityCandidate
      : 'info';

    const fallbackUrl = typeof payload.fallbackUrl === 'string' && payload.fallbackUrl.trim().length > 0
      ? payload.fallbackUrl.trim()
      : undefined;

    const publishAtIso = parseIsoDate(payload.publishAt);
    const expiresAtIso = parseIsoDate(payload.expiresAt);

    if (publishAtIso && expiresAtIso && new Date(publishAtIso).getTime() >= new Date(expiresAtIso).getTime()) {
      return res.status(400).json({
        success: false,
        error: 'expiresAt must be later than publishAt'
      });
    }

    const audienceCandidate = typeof payload.audience === 'string' ? payload.audience.trim().toLowerCase() : undefined;
    const allowedAudiences: Array<'all' | 'web' | 'mobile'> = ['all', 'web', 'mobile'];
    const audience = audienceCandidate && (allowedAudiences as string[]).includes(audienceCandidate)
      ? (audienceCandidate as 'all' | 'web' | 'mobile')
      : 'all';

    const summary = await StatusService.getSummary();
    const existingIncident = summary.activeIncident || summary.upcomingIncident || null;
    const nowIso = new Date().toISOString();

    const incident: ActiveIncident = {
      message,
      severity,
      fallbackUrl,
      publishAt: publishAtIso,
      expiresAt: expiresAtIso,
      requiresAck: Boolean(payload.requiresAck),
      audience,
      startedAt: existingIncident && existingIncident.message === message
        ? existingIncident.startedAt
        : (publishAtIso ?? nowIso),
      updatedAt: nowIso
    };

    if (!existingIncident || existingIncident.message !== message) {
      incident.startedAt = publishAtIso ?? nowIso;
    }

    await StatusService.setActiveIncident(incident);

    log.info('Admin incident banner updated', {
      admin: req.admin?.username,
      severity: incident.severity,
      publishAt: incident.publishAt,
      expiresAt: incident.expiresAt,
      audience: incident.audience,
      requiresAck: incident.requiresAck
    });

    res.json({
      success: true,
      incident
    });
  } catch (error: any) {
    log.error('Admin incident update error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update incident'
    });
  }
});

/**
 * Clear active incident banner
 */
router.delete('/status/incident', authenticateAdmin, adminCsrfProtection, requirePermission('manage_status'), async (req: Request, res: Response) => {
  try {
    await StatusService.setActiveIncident(null);

    log.info('Admin incident banner cleared', {
      admin: req.admin?.username
    });

    res.json({ success: true });
  } catch (error: any) {
    log.error('Admin incident clear error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear incident'
    });
  }
});

/**
 * Analytics summary (aggregated tracked events)
 */
router.get('/analytics/summary', authenticateAdmin, requirePermission('view_analytics'), async (req: Request, res: Response) => {
  try {
    const parsed = parseAnalyticsQueryParams(req);

    const analyticsWindowDays = Math.min(parsed.windowDays, ANALYTICS_MAX_DAYS);
    const summary = await AnalyticsService.getSummary(analyticsWindowDays, parsed.filters);
    const userGrowth = await DatabaseService.getUserGrowthMetrics(parsed.windowStart, parsed.windowEnd, parsed.filters);

    const filterOptions = typeof DatabaseService.getAnalyticsFilterOptions === 'function'
      ? await DatabaseService.getAnalyticsFilterOptions()
      : { genders: [], platforms: [], signupSources: [], campaigns: [] };

    res.json({
      success: true,
      summary,
      windowDays: parsed.windowDays,
      range: {
        start: parsed.windowStart.toISOString().split('T')[0],
        end: parsed.windowEnd.toISOString().split('T')[0]
      },
      userGrowth,
      filters: {
        applied: parsed.appliedFilters,
        options: filterOptions
      }
    });
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('INVALID_RANGE:')) {
      const [, message] = error.message.split(':');
      return res.status(400).json({
        success: false,
        error: message || 'Invalid analytics date range.'
      });
    }

    log.error('Admin analytics summary error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics summary'
    });
  }
});

/**
 * Analytics retention cohorts
 */
router.get('/analytics/retention', authenticateAdmin, requirePermission('view_analytics'), async (req: Request, res: Response) => {
  try {
    const parsed = parseAnalyticsQueryParams(req);
    const retention = await DatabaseService.getUserRetentionMetrics(parsed.windowStart, parsed.windowEnd, parsed.filters);

    res.json({
      success: true,
      retention,
      windowDays: parsed.windowDays,
      range: {
        start: parsed.windowStart.toISOString().split('T')[0],
        end: parsed.windowEnd.toISOString().split('T')[0]
      },
      filters: {
        applied: parsed.appliedFilters
      }
    });
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('INVALID_RANGE:')) {
      const [, message] = error.message.split(':');
      return res.status(400).json({
        success: false,
        error: message || 'Invalid analytics date range.'
      });
    }

    log.error('Admin analytics retention error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch retention analytics'
    });
  }
});

/**
 * Analytics funnel overview
 */
router.get('/analytics/funnels', authenticateAdmin, requirePermission('view_analytics'), async (req: Request, res: Response) => {
  try {
    const parsed = parseAnalyticsQueryParams(req);
    const funnelSummary = await DatabaseService.getFunnelMetrics(parsed.windowStart, parsed.windowEnd, parsed.filters);

    res.json({
      success: true,
      funnelSummary,
      windowDays: parsed.windowDays,
      range: {
        start: parsed.windowStart.toISOString().split('T')[0],
        end: parsed.windowEnd.toISOString().split('T')[0]
      },
      filters: {
        applied: parsed.appliedFilters
      }
    });
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('INVALID_RANGE:')) {
      const [, message] = error.message.split(':');
      return res.status(400).json({
        success: false,
        error: message || 'Invalid analytics date range.'
      });
    }

    log.error('Admin analytics funnels error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch funnel analytics'
    });
  }
});

router.get('/analytics/acquisition/map', authenticateAdmin, requirePermission('view_analytics'), async (req: Request, res: Response) => {
  try {
    const parsed = parseAnalyticsQueryParams(req);

    if (typeof DatabaseService.getAcquisitionMapMetrics !== 'function') {
      return res.status(501).json({
        success: false,
        error: 'Acquisition map analytics are not supported in this environment.'
      });
    }

    const mapSummary = await DatabaseService.getAcquisitionMapMetrics(parsed.windowStart, parsed.windowEnd, parsed.filters);

    res.json({
      success: true,
      map: mapSummary,
      windowDays: parsed.windowDays,
      range: {
        start: parsed.windowStart.toISOString().split('T')[0],
        end: parsed.windowEnd.toISOString().split('T')[0]
      },
      filters: {
        applied: parsed.appliedFilters
      }
    });
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('INVALID_RANGE:')) {
      const [, message] = error.message.split(':');
      return res.status(400).json({
        success: false,
        error: message || 'Invalid analytics date range.'
      });
    }

    log.error('Admin acquisition map analytics error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch acquisition map analytics'
    });
  }
});

router.get('/analytics/acquisition/sources', authenticateAdmin, requirePermission('view_analytics'), async (req: Request, res: Response) => {
  try {
    const parsed = parseAnalyticsQueryParams(req);

    if (typeof DatabaseService.getAcquisitionSourceMetrics !== 'function') {
      return res.status(501).json({
        success: false,
        error: 'Acquisition source analytics are not supported in this environment.'
      });
    }

    const sourcesSummary = await DatabaseService.getAcquisitionSourceMetrics(parsed.windowStart, parsed.windowEnd, parsed.filters);

    res.json({
      success: true,
      sources: sourcesSummary,
      windowDays: parsed.windowDays,
      range: {
        start: parsed.windowStart.toISOString().split('T')[0],
        end: parsed.windowEnd.toISOString().split('T')[0]
      },
      filters: {
        applied: parsed.appliedFilters
      }
    });
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('INVALID_RANGE:')) {
      const [, message] = error.message.split(':');
      return res.status(400).json({
        success: false,
        error: message || 'Invalid analytics date range.'
      });
    }

    log.error('Admin acquisition source analytics error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch acquisition source analytics'
    });
  }
});

/**
 * Get all pending reports
 */
router.get('/reports', authenticateAdmin, requirePermission('view_reports'), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const statusParam = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : undefined;
    const allowedStatuses = new Set(['pending', 'reviewed', 'resolved']);
    const status = statusParam && allowedStatuses.has(statusParam) ? statusParam : undefined;

    let reports;
    if (status === 'pending') {
      reports = await DatabaseService.getPendingReports(limit);
    } else if (status) {
      reports = await DatabaseService.getReportsByStatus(status, limit);
    } else {
      reports = await DatabaseService.getAllReports(limit);
    }

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        try {
          const [reportedUser, reporterUser] = await Promise.all([
            DatabaseService.getUserById(report.reportedUserId).catch((err) => {
              log.warn('Failed to load reported user for report', {
                reportId: report.id,
                userId: report.reportedUserId,
                error: err
              });
              return null;
            }),
            DatabaseService.getUserById(report.reporterUserId).catch((err) => {
              log.warn('Failed to load reporter user for report', {
                reportId: report.id,
                userId: report.reporterUserId,
                error: err
              });
              return null;
            })
          ]);

          const reportedDisplay = reportedUser?.email || reportedUser?.username || `Deleted user (${report.reportedUserId})`;
          const reporterDisplay = reporterUser?.email || reporterUser?.username || `Deleted user (${report.reporterUserId})`;

          return {
            ...report,
            reportedUserEmail: reportedDisplay,
            reporterUserEmail: reporterDisplay,
            reportedUserExists: !!reportedUser,
            reporterUserExists: !!reporterUser
          };
        } catch (err) {
          log.warn('Report enrichment failed', { reportId: report.id, error: err });
          const truncate = (value: string) => (value ? `${value.substring(0, 8)}...` : 'unknown');
          return {
            ...report,
            reportedUserEmail: `Error: ${truncate(report.reportedUserId)}`,
            reporterUserEmail: `Error: ${truncate(report.reporterUserId)}`
          };
        }
      })
    );
    
    res.json({
      success: true,
      reports: enrichedReports,
      total: enrichedReports.length,
      appliedFilter: status || 'all'
    });
  } catch (error: any) {
    log.error('Admin reports fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

/**
 * Get reports for specific user
 */
router.get('/reports/:userId', authenticateAdmin, requirePermission('view_reports'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const reports = await DatabaseService.getUserReports(userId);
    
    res.json({
      success: true,
      reports,
      total: reports.length
    });
  } catch (error: any) {
    log.error('Admin user reports fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user reports'
    });
  }
});

/**
 * Update report status
 */
router.patch('/reports/:reportId', authenticateAdmin, adminCsrfProtection, requirePermission('resolve_reports'), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, reviewed, or resolved'
      });
    }

    const updated = await DatabaseService.updateReportStatus(reportId, status);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report status updated',
      report: updated
    });
  } catch (error: any) {
    log.error('Admin update report error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update report'
    });
  }
});

/**
 * Get all banned users
 */
router.get('/bans', authenticateAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  try {
    const bannedUsers = await DatabaseService.getUsersByStatus('banned');
    
    // Get ban details for each user
    const usersWithBanInfo = await Promise.all(
      bannedUsers.map(async (user: any) => {
        const banStatus = await DatabaseService.checkUserBanStatus(user.id);
        return {
          ...user,
          banInfo: banStatus
        };
      })
    );

    res.json({
      success: true,
      users: usersWithBanInfo,
      total: usersWithBanInfo.length
    });
  } catch (error: any) {
    log.error('Admin bans fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch banned users'
    });
  }
});

/**
 * Ban a user (manual admin action)
 */
router.post('/ban', authenticateAdmin, adminCsrfProtection, requirePermission('ban_users'), async (req: Request, res: Response) => {
  try {
    const { userId, banType, duration, reason } = req.body;
    const adminId = req.admin?.adminId;

    if (!userId || !banType) {
      return res.status(400).json({
        success: false,
        error: 'userId and banType required'
      });
    }

    if (!['temporary', 'permanent'].includes(banType)) {
      return res.status(400).json({
        success: false,
        error: 'banType must be "temporary" or "permanent"'
      });
    }

    if (banType === 'temporary' && !duration) {
      return res.status(400).json({
        success: false,
        error: 'duration required for temporary ban'
      });
    }

    const ban = await DatabaseService.banUser(
      userId,
      banType,
      duration,
      reason || 'Manual ban by admin',
      adminId
    );

    if (!ban) {
      return res.status(500).json({
        success: false,
        error: 'Failed to ban user'
      });
    }

    res.json({
      success: true,
      message: 'User banned successfully',
      ban
    });
  } catch (error: any) {
    log.error('Admin ban user error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to ban user'
    });
  }
});

/**
 * Get users with optional filters and analytics snapshot
 */
router.get('/users', authenticateAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : undefined;
    const includeAnalyticsParam = typeof req.query.includeAnalytics === 'string' ? req.query.includeAnalytics.toLowerCase() : undefined;

    let users = search ? await DatabaseService.searchUsers(search) : await DatabaseService.getAllUsers();
    if (!Array.isArray(users)) {
      users = [];
    }

    if (status && status !== 'all') {
      const allowedStatuses = new Set(['active', 'banned', 'suspended']);
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status filter'
        });
      }

      users = users.filter((user: any) => {
        const userStatus = typeof user?.status === 'string' ? user.status.toLowerCase() : 'active';
        return userStatus === status;
      });
    }

    const shouldIncludeAnalytics =
      includeAnalyticsParam === 'true' ||
      includeAnalyticsParam === '1' ||
      typeof req.query.start === 'string' ||
      typeof req.query.end === 'string' ||
      typeof req.query.days === 'string' ||
      typeof req.query.gender !== 'undefined' ||
      typeof req.query.platform !== 'undefined' ||
      typeof req.query.signupSource !== 'undefined' ||
      typeof req.query.campaign !== 'undefined' ||
      typeof req.query['gender[]'] !== 'undefined' ||
      typeof req.query['platform[]'] !== 'undefined' ||
      typeof req.query['signupSource[]'] !== 'undefined' ||
      typeof req.query['campaign[]'] !== 'undefined';

    const responsePayload: Record<string, unknown> = {
      success: true,
      users,
      total: users.length
    };

    if (shouldIncludeAnalytics) {
      try {
        const parsed = parseAnalyticsQueryParams(req);
        const analyticsWindowDays = Math.min(parsed.windowDays, ANALYTICS_MAX_DAYS);
        const summary = await AnalyticsService.getSummary(analyticsWindowDays, parsed.filters);
        const userGrowth = await DatabaseService.getUserGrowthMetrics(parsed.windowStart, parsed.windowEnd, parsed.filters);

        const analyticsPayload: Record<string, unknown> = {
          summary,
          windowDays: parsed.windowDays,
          range: {
            start: parsed.windowStart.toISOString().split('T')[0],
            end: parsed.windowEnd.toISOString().split('T')[0]
          },
          userGrowth,
          filters: {
            applied: parsed.appliedFilters
          }
        };

        if (typeof DatabaseService.getAnalyticsFilterOptions === 'function') {
          const filterOptions = await DatabaseService.getAnalyticsFilterOptions();
          analyticsPayload.filters = {
            ...(analyticsPayload.filters as Record<string, unknown>),
            options: filterOptions
          };
        }

        responsePayload.analytics = analyticsPayload;
      } catch (analyticsError: any) {
        if (typeof analyticsError?.message === 'string' && analyticsError.message.startsWith('INVALID_RANGE:')) {
          const [, message] = analyticsError.message.split(':');
          return res.status(400).json({
            success: false,
            error: message || 'Invalid analytics date range.'
          });
        }

        log.error('Admin users analytics snapshot error', { error: analyticsError });
      }
    }

    res.json(responsePayload);
  } catch (error: any) {
    log.error('Admin users fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users'
    });
  }
});

/**
 * Update user role
 */
router.put('/users/:userId/role', authenticateAdmin, adminCsrfProtection, requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const actingAdminRole = normalizeRole(req.admin?.role);
    const isActingSuperAdmin = actingAdminRole === 'super_admin';

    const targetUser = await DatabaseService.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentRole = resolveUserRole(targetUser);
    const requestedRole = role as 'guest' | 'user' | 'admin' | 'super_admin';

    // Only super admins can modify admin or super admin roles
    if (!isActingSuperAdmin) {
      if (currentRole === 'admin' || currentRole === 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Super admin access required to modify admin roles'
        });
      }

      if (requestedRole === 'admin' || requestedRole === 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Super admin access required to assign admin roles'
        });
      }
    }

    if ((requestedRole === 'admin' || requestedRole === 'super_admin') && currentRole !== requestedRole) {
      if (!targetUser.email) {
        return res.status(400).json({
          success: false,
          error: 'User must have a verified email before gaining admin access'
        });
      }

      if (!targetUser.passwordHash) {
        return res.status(400).json({
          success: false,
          error: 'User must set a password before admin access can be granted'
        });
      }
    }

    const allUsersForRoleChecks = (requestedRole === 'super_admin' && currentRole !== 'super_admin') || (currentRole === 'super_admin' && requestedRole !== 'super_admin')
      ? await DatabaseService.getAllUsers()
      : null;

    if (requestedRole === 'super_admin' && currentRole !== 'super_admin') {
      const superAdminCount = (allUsersForRoleChecks || []).filter((u: any) => resolveUserRole(u) === 'super_admin').length;

      if (superAdminCount >= 2) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 2 super_admins allowed'
        });
      }
    }

    if (currentRole === 'super_admin' && requestedRole !== 'super_admin') {
      if (!isActingSuperAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Super admin access required to modify super admin roles'
        });
      }

      const superAdminCount = (allUsersForRoleChecks || []).filter((u: any) => resolveUserRole(u) === 'super_admin').length;
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'At least one super_admin must remain'
        });
      }
    }

    if (currentRole === requestedRole) {
      return res.json({
        success: true,
        message: 'User role already set',
        user: {
          id: targetUser.id,
          role: currentRole,
          tier: targetUser.tier,
          verificationStatus: resolveVerificationStatus(targetUser),
          subscriptionLevel: resolveSubscriptionLevel(targetUser)
        }
      });
    }

    const success = await DatabaseService.updateUserRole(userId, requestedRole);

    if (success) {
      let refreshedUser = targetUser;
      try {
        const fetched = await DatabaseService.getUserById(userId);
        if (fetched) {
          refreshedUser = fetched;
        }
      } catch (refreshError) {
        log.warn('Failed to refresh user after role update', { error: refreshError, userId });
      }

      res.json({
        success: true,
        message: 'User role updated successfully',
        user: {
          id: refreshedUser.id,
          role: resolveUserRole(refreshedUser),
          tier: refreshedUser.tier,
          verificationStatus: resolveVerificationStatus(refreshedUser),
          subscriptionLevel: resolveSubscriptionLevel(refreshedUser)
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error: any) {
    log.error('Admin update user role error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user role'
    });
  }
});

/**
 * Delete user
 */
router.delete('/users/:userId', authenticateAdmin, adminCsrfProtection, requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const success = await DatabaseService.deleteUser(userId, {
      reason: 'admin_delete',
      deletedBy: req.admin?.adminId || req.admin?.username || 'admin_panel',
      context: 'admin',
      adminId: req.admin?.adminId,
      adminUsername: req.admin?.username
    });

    if (success) {
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error: any) {
    log.error('Admin delete user error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
});

router.post('/users/:userId/coins', authenticateAdmin, adminCsrfProtection, requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const deltaRaw = req.body?.delta;
    const reasonRaw = req.body?.reason;

    const delta = Number(deltaRaw);
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({
        success: false,
        error: 'delta must be a non-zero number'
      });
    }

    const reason = typeof reasonRaw === 'string' && reasonRaw.trim().length > 0
      ? reasonRaw.trim()
      : undefined;

    const result = await DatabaseService.adjustUserCoins(userId, delta, {
      reason,
      adminId: req.admin?.adminId,
      adminUsername: req.admin?.username
    });

    if (!result?.success) {
      const errorCode = result?.error || 'ADJUST_FAILED';
      if (errorCode === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (errorCode === 'INVALID_DELTA') {
        return res.status(400).json({
          success: false,
          error: 'delta must be a non-zero number'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to adjust coins'
      });
    }

    log.info('Admin coin adjustment applied', {
      admin: req.admin?.username,
      adminId: req.admin?.adminId,
      userId,
      delta,
      reason: result.adjustment?.reason
    });

    res.json({
      success: true,
      user: result.user,
      adjustment: result.adjustment
    });
  } catch (error: any) {
    log.error('Admin coin adjustment error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to adjust coins'
    });
  }
});

router.get('/users/:userId/coins/history', authenticateAdmin, requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = Number.parseInt(String(req.query.limit ?? '20'), 10);
    const boundedLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;

    const history = await DatabaseService.getCoinAdjustmentHistory(userId, boundedLimit);

    res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (error: any) {
    log.error('Admin coin history fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load coin adjustments'
    });
  }
});

/**
 * Get analytics/dashboard data
 */
router.get('/analytics', authenticateAdmin, requirePermission('view_stats'), async (req: Request, res: Response) => {
  try {
    const stats = await DatabaseService.getPlatformStats();
    
    // Additional analytics can be added here
    const analytics = {
      ...stats,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    log.error('Admin analytics fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    });
  }
});

/**
 * Get all admins (super admin only)
 */
router.get('/admins', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // Only super admin can view all admins
    if (req.admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin access required'
      });
    }

    const admins = await DatabaseService.getAllAdmins();
    
    // Remove password hashes
    const safeAdmins = admins.map((admin: any) => {
      const { passwordHash, ...safeAdmin } = admin;
      return safeAdmin;
    });

    res.json({
      success: true,
      admins: safeAdmins
    });
  } catch (error: any) {
    log.error('Admin list fetch error', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch admins'
    });
  }
});

export default router;