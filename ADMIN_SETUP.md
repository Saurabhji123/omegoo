# 🔐 Admin Setup Guide

## Problem: Admin Login Not Working

**Root Cause:** No admin user exists in the database yet.

The `/api/admin/login` endpoint works correctly, but you need to create the first admin user before you can login.

---

## ✅ Solution: Create First Admin

### Method 1: Using PowerShell Script (Easiest)

1. Open PowerShell in the project root
2. Run:
   ```powershell
   .\setup-admin.ps1
   ```
3. Enter your desired admin credentials when prompted
4. Done! You can now login at: https://omegoo.vercel.app/admin

---

### Method 2: Using npm Script

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Run the setup script:
   ```bash
   npm run admin:setup
   ```

3. Enter your credentials when prompted

4. Login at: https://omegoo.vercel.app/admin

---

### Method 3: Using cURL (Manual)

```bash
curl -X POST https://omegoo-api-clean.onrender.com/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@omegoo.com",
    "password": "your_secure_password"
  }'
```

---

### Method 4: Using Postman/Thunder Client

**Endpoint:** `POST https://omegoo-api-clean.onrender.com/api/admin/setup`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "admin",
  "email": "admin@omegoo.com",
  "password": "your_secure_password"
}
```

---

## 🔒 Security Notes

1. **One-Time Setup:** The `/api/admin/setup` endpoint only works once. After the first admin is created, it will return a 403 error.

2. **Strong Password:** Use a strong password (12+ characters, mix of letters, numbers, symbols)

3. **Save Credentials:** Store your admin credentials securely (password manager recommended)

4. **Multiple Admins:** After creating the first admin, you can create additional admins from the admin dashboard

---

## 🎯 Recommended Admin Credentials

For testing/development:
- **Username:** `admin`
- **Email:** `admin@omegoochat.com`
- **Password:** `Admin@Omegoo2024!`

For production:
- Use a unique, strong password
- Use your actual email address
- Change password after first login

---

## ✅ After Setup

Once admin is created:

1. Visit: https://omegoo.vercel.app/admin
2. Login with your credentials
3. You'll see the admin dashboard with:
   - Platform statistics
   - User management
   - Moderation tools
   - Report management

---

## 🐛 Troubleshooting

### Error: "Admin setup already completed"
- An admin already exists
- Try logging in with existing credentials
- Use the checkAdmin.ts script to see existing admins

### Error: "Username and password required"
- Make sure you're sending all required fields
- Check that JSON is properly formatted

### Error: "Network error"
- Verify backend is running on Render
- Check API URL: https://omegoo-api-clean.onrender.com
- Wait a few minutes if Render is spinning up

---

## 📝 Check Existing Admins

To see if admins already exist:

```bash
cd backend
npm run admin:check
```

This will show all existing admin users in the database.

---

## 🔑 Login After Setup

**Admin Panel URL:** https://omegoo.vercel.app/admin

**Login with:**
- Username OR Email
- Password

**Features:**
- ✅ View platform statistics
- ✅ Manage users (ban/unban)
- ✅ View moderation reports
- ✅ System analytics

---

## 🚨 Important Notes

1. **Backend Must Be Running:** Make sure https://omegoo-api-clean.onrender.com is active
2. **MongoDB Connected:** Backend must be connected to MongoDB Atlas
3. **CORS Enabled:** Frontend (omegoo.vercel.app) is whitelisted
4. **JWT Secret Set:** ADMIN_JWT_SECRET environment variable must be set

---

## 🎉 Ready to Go!

After creating your admin account, you can:
1. Login to the admin panel
2. Monitor platform activity
3. Manage users and content
4. View reports and analytics
5. Create additional admin accounts

---

**Need Help?** Check the Render logs for any errors:
- https://dashboard.render.com → Select backend service → Logs

