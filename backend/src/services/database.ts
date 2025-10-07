import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

export class DatabaseService {
  private static pool: Pool;

  static async initialize() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await this.pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  }

  static async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async close() {
    await this.pool.end();
  }

  // User operations
  static async createUser(userData: {
    deviceId: string;
    deviceHash: string;
    userAgent: string;
    ipHash: string;
  }) {
    const query = `
      INSERT INTO users (device_id, device_hash, user_agent, ip_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      userData.deviceId,
      userData.deviceHash,
      userData.userAgent,
      userData.ipHash
    ]);
    
    return result.rows[0];
  }

  static async getUserById(userId: string) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  static async getUserByDeviceId(deviceId: string) {
    const query = 'SELECT * FROM users WHERE device_id = $1';
    const result = await this.query(query, [deviceId]);
    return result.rows[0];
  }

  static async updateUser(userId: string, updates: any) {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [userId, ...values]);
    return result.rows[0];
  }

  static async verifyUserPhone(userId: string, phoneHash: string) {
    const query = `
      UPDATE users 
      SET phone_hash = $2, tier = 'verified', is_verified = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [userId, phoneHash]);
    return result.rows[0];
  }

  // Ban operations
  static async createBanRecord(banData: {
    userId: string;
    type: string;
    reason: string;
    reportId?: string;
    deviceHashes: string[];
    phoneHash?: string;
    ipHashes: string[];
    expiresAt?: Date;
  }) {
    const query = `
      INSERT INTO ban_records (
        user_id, type, reason, report_id, device_hashes, 
        phone_hash, ip_hashes, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      banData.userId,
      banData.type,
      banData.reason,
      banData.reportId,
      JSON.stringify(banData.deviceHashes),
      banData.phoneHash,
      JSON.stringify(banData.ipHashes),
      banData.expiresAt
    ]);
    
    return result.rows[0];
  }

  static async checkUserBanned(deviceHash: string, phoneHash?: string, ipHash?: string) {
    let query = `
      SELECT * FROM ban_records 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        $1 = ANY(SELECT jsonb_array_elements_text(device_hashes::jsonb))
    `;
    
    const params = [deviceHash];
    
    if (phoneHash) {
      query += ' OR phone_hash = $' + (params.length + 1);
      params.push(phoneHash);
    }
    
    if (ipHash) {
      query += ' OR $' + (params.length + 1) + ' = ANY(SELECT jsonb_array_elements_text(ip_hashes::jsonb))';
      params.push(ipHash);
    }
    
    query += ')';
    
    const result = await this.query(query, params);
    return result.rows[0];
  }

  // Chat session operations
  static async createChatSession(sessionData: {
    user1Id: string;
    user2Id: string;
    mode: string;
  }) {
    const query = `
      INSERT INTO chat_sessions (user1_id, user2_id, mode)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      sessionData.user1Id,
      sessionData.user2Id,
      sessionData.mode
    ]);
    
    return result.rows[0];
  }

  static async endChatSession(sessionId: string, duration?: number) {
    const query = `
      UPDATE chat_sessions 
      SET status = 'ended', ended_at = NOW(), duration = $2
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [sessionId, duration]);
    return result.rows[0];
  }

  // Moderation report operations
  static async createModerationReport(reportData: {
    sessionId: string;
    reportedUserId: string;
    reporterUserId?: string;
    violationType: string;
    description: string;
    evidenceUrls: string[];
    autoDetected: boolean;
    confidenceScore: number;
  }) {
    const query = `
      INSERT INTO moderation_reports (
        session_id, reported_user_id, reporter_user_id, violation_type,
        description, evidence_urls, auto_detected, confidence_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      reportData.sessionId,
      reportData.reportedUserId,
      reportData.reporterUserId,
      reportData.violationType,
      reportData.description,
      JSON.stringify(reportData.evidenceUrls),
      reportData.autoDetected,
      reportData.confidenceScore
    ]);
    
    return result.rows[0];
  }

  static async getReports(limit: number = 20, offset: number = 0) {
    const query = `
      SELECT mr.*, u.device_id, cs.mode as chat_mode
      FROM moderation_reports mr
      JOIN users u ON mr.reported_user_id = u.id
      LEFT JOIN chat_sessions cs ON mr.session_id = cs.id
      ORDER BY mr.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await this.query(query, [limit, offset]);
    return result.rows;
  }

  // Analytics operations
  static async getDailyStats(date: Date) {
    const query = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_active_at >= $1 THEN u.id END) as daily_active_users,
        COUNT(DISTINCT cs.id) as total_sessions,
        COUNT(DISTINCT mr.id) as total_reports,
        COUNT(DISTINCT CASE WHEN br.created_at >= $1 THEN br.id END) as daily_bans
      FROM users u
      LEFT JOIN chat_sessions cs ON (cs.user1_id = u.id OR cs.user2_id = u.id)
      LEFT JOIN moderation_reports mr ON mr.reported_user_id = u.id
      LEFT JOIN ban_records br ON br.user_id = u.id
      WHERE u.created_at <= $1
    `;
    
    const result = await this.query(query, [date]);
    return result.rows[0];
  }
}