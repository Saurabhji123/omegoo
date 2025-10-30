# 🔒 Security Guidelines for Omegoo

## 🚨 Critical Security Rules

### 1. **Never Commit Sensitive Data**
- ❌ Never commit `.env` files
- ❌ Never hardcode API keys, passwords, or secrets
- ❌ Never commit database credentials
- ✅ Always use environment variables
- ✅ Always check `.gitignore` before committing

### 2. **Environment Variables**

All sensitive configuration must be stored in `.env` files:

```bash
# Required Environment Variables
RESEND_API_KEY=your-api-key-here
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
ADMIN_JWT_SECRET=your-admin-jwt-secret
```

### 3. **How to Set Up Environment**

1. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Never share your `.env` file** - Each developer should have their own

3. **For production**, use platform-specific environment variable settings:
   - Render.com: Use Environment Variables section
   - Vercel: Use Environment Variables in project settings
   - AWS: Use Secrets Manager or Parameter Store

### 4. **Code Review Checklist**

Before pushing code, verify:
- [ ] No hardcoded API keys in code
- [ ] No sensitive data in logs
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has placeholder values only
- [ ] No real passwords or tokens in comments

### 5. **API Key Security**

**Resend API Key:**
- Get from: https://resend.com/api-keys
- Never expose in frontend code
- Only use in backend services
- Rotate keys if exposed

**MongoDB URI:**
- Use MongoDB Atlas whitelisted IPs
- Never use `0.0.0.0/0` in production
- Rotate password if exposed

### 6. **JWT Secrets**

- Use at least 256-bit random strings
- Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Never reuse secrets across environments

### 7. **Git History**

If you accidentally committed sensitive data:

```bash
# Remove file from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ dangerous - coordinate with team)
git push origin --force --all

# Then immediately rotate all exposed credentials
```

### 8. **Reporting Security Issues**

Found a security vulnerability? 

**DO NOT** open a public GitHub issue.

Instead:
1. Email: security@omegoo.com
2. Include detailed description
3. Include steps to reproduce
4. We'll respond within 48 hours

### 9. **Security Headers**

Our backend implements:
- CORS restrictions
- Rate limiting
- Helmet.js security headers
- JWT token expiration
- HTTPS-only cookies (production)

### 10. **Data Protection**

**User Data:**
- Passwords: bcrypt hashed (8-12 rounds)
- OTPs: Expire in 10 minutes
- JWTs: Expire in 24 hours (7 days for refresh)
- Evidence files: Encrypted at rest

**Database:**
- MongoDB Atlas with encryption
- Regular automated backups
- Access logs monitored

---

## 📋 Quick Security Audit

```bash
# Check for exposed secrets in code
git secrets --scan

# Check for .env in git
git ls-files | grep ".env"

# Check npm packages for vulnerabilities
npm audit

# Check for outdated packages
npm outdated
```

---

## 🛡️ Best Practices

1. **Always validate input** on both frontend and backend
2. **Sanitize user data** before database operations
3. **Use HTTPS** in production (never HTTP)
4. **Implement rate limiting** on all API endpoints
5. **Log security events** (failed logins, suspicious activities)
6. **Regular security updates** - Update dependencies monthly
7. **Code reviews** - Never merge without review
8. **Principle of least privilege** - Grant minimum necessary permissions

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** October 30, 2025  
**Maintained by:** Omegoo Security Team
