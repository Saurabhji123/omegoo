# 🔐 Complete Guide: Change MongoDB Password & JWT Secrets

## 📋 TABLE OF CONTENTS
1. [MongoDB Password Change](#mongodb-password-change)
2. [JWT Secrets Generation](#jwt-secrets-generation)
3. [Where to Update](#where-to-update)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🗄️ MONGODB PASSWORD CHANGE

### **Step 1: Change Password on MongoDB Atlas**

1. **Visit MongoDB Atlas:**
   ```
   https://cloud.mongodb.com
   ```

2. **Login** with your credentials

3. **Navigate to Database Access:**
   ```
   Left Sidebar → Security → Database Access
   ```

4. **Find Your User:**
   ```
   Look for: omegoo_db_user
   ```

5. **Edit User:**
   ```
   Click "Edit" button next to omegoo_db_user
   ```

6. **Change Password:**
   ```
   Click "Edit Password" button
   Select "Autogenerate Secure Password" (recommended)
   OR
   Type your own strong password (min 8 characters, mix of letters/numbers/symbols)
   
   IMPORTANT: Click "Copy" to save the password!
   ```

7. **Save:**
   ```
   Click "Update User" button at bottom
   ```

8. **Wait 2-3 minutes** for changes to propagate

### **Your New MongoDB URI Format:**
```
mongodb+srv://YOUR_USERNAME:YOUR_NEW_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority
```

**Example with dummy password:**
```
mongodb+srv://myuser:MyNewP@ssw0rd123@cluster0.abc123.mongodb.net/myapp_db?retryWrites=true&w=majority
```

---

## 🔑 JWT SECRETS GENERATION

### **Step 2: Generate 4 New Random Secrets**

Open **PowerShell** and run this command **4 times**:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output (yours will be different):**
```
Run 1: 3f8a9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
Run 2: 9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f
Run 3: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
Run 4: f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f
```

**Copy and save these 4 secrets:**
1. **JWT_SECRET** = Run 1 output
2. **REFRESH_TOKEN_SECRET** = Run 2 output
3. **ADMIN_JWT_SECRET** = Run 3 output
4. **SESSION_SECRET** = Run 4 output

---

## 📝 WHERE TO UPDATE (3 PLACES)

### **Place 1: Local Development File (`backend/.env`)**

**File Location:** `c:\Users\Lenovo\Omegoo\backend\.env`

**What to Update:**
```bash
# OLD (Line 8):
MONGODB_URI=mongodb+srv://old_user:old_password@cluster0.example.mongodb.net/old_db?retryWrites=true&w=majority

# NEW (replace with YOUR new password):
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_NEW_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority

# OLD (Line 12):
ADMIN_JWT_SECRET=old-admin-jwt-secret-needs-to-be-changed

# NEW (use generated secret from Run 3):
ADMIN_JWT_SECRET=<paste_your_generated_secret_here>

# OLD (Line 16):
JWT_SECRET=old-dev-jwt-secret-not-secure

# NEW (use generated secret from Run 1):
JWT_SECRET=<paste_your_generated_secret_here>

# OLD (Line 18):
REFRESH_TOKEN_SECRET=old-dev-refresh-token-secret

# NEW (use generated secret from Run 2):
REFRESH_TOKEN_SECRET=<paste_your_generated_secret_here>

# OLD (Line 34):
SESSION_SECRET=old-dev-session-secret

# NEW (use generated secret from Run 4):
SESSION_SECRET=<paste_your_generated_secret_here>
```

**How to Edit:**
```powershell
# Option 1: Using VS Code
code c:\Users\Lenovo\Omegoo\backend\.env

# Option 2: Using Notepad
notepad c:\Users\Lenovo\Omegoo\backend\.env
```

Then:
1. Find each OLD line
2. Replace with NEW value
3. Save file (Ctrl+S)

---

### **Place 2: Render Dashboard (Production)**

**Website:** `https://dashboard.render.com`

**Steps:**

1. **Login to Render**
   ```
   https://dashboard.render.com
   ```

2. **Select Your Backend Service**
   ```
   Click on: omegoo-backend (or whatever name you gave)
   ```

3. **Go to Environment Tab**
   ```
   Left Sidebar → Environment
   ```

4. **Update Variables One by One:**

   **For MONGODB_URI:**
   ```
   1. Find: MONGODB_URI
   2. Click "Edit" (pencil icon)
   3. Replace value with:
      mongodb+srv://YOUR_USERNAME:YOUR_NEW_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority
   4. Click "Save"
   ```

   **For JWT_SECRET:**
   ```
   1. Find: JWT_SECRET
   2. Click "Edit"
   3. Replace with your generated secret (Run 1 output)
   4. Click "Save"
   ```

   **For REFRESH_TOKEN_SECRET:**
   ```
   1. Find: REFRESH_TOKEN_SECRET
   2. Click "Edit"
   3. Replace with your generated secret (Run 2 output)
   4. Click "Save"
   ```

   **For ADMIN_JWT_SECRET:**
   ```
   1. Find: ADMIN_JWT_SECRET
   2. Click "Edit"
   3. Replace with your generated secret (Run 3 output)
   4. Click "Save"
   ```

   **For SESSION_SECRET:**
   ```
   1. Find: SESSION_SECRET
   2. Click "Edit"
   3. Replace with your generated secret (Run 4 output)
   4. Click "Save"
   ```

5. **Save Changes**
   ```
   Click "Save Changes" button at bottom
   ```

6. **Wait for Redeploy**
   ```
   Render will automatically redeploy (takes 2-3 minutes)
   Watch the "Events" tab for deployment status
   ```

---

### **Place 3: Local File for Future Reference**

**Create a backup file (DO NOT COMMIT TO GIT):**

```powershell
# Create backup file
notepad c:\Users\Lenovo\Omegoo\CREDENTIALS_BACKUP.txt
```

**Paste this template and fill in YOUR values:**
```txt
# MY APP PRODUCTION CREDENTIALS
# DATE: 2025-10-19
# ⚠️ KEEP THIS FILE SECURE - DO NOT SHARE OR COMMIT TO GIT

## MongoDB
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority

## JWT Secrets (Generated using crypto.randomBytes)
JWT_SECRET=<paste_your_generated_secret_from_run_1>
REFRESH_TOKEN_SECRET=<paste_your_generated_secret_from_run_2>
ADMIN_JWT_SECRET=<paste_your_generated_secret_from_run_3>
SESSION_SECRET=<paste_your_generated_secret_from_run_4>

## Other Settings
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d
ADMIN_JWT_EXPIRE=12h
BCRYPT_ROUNDS=10
```

**Save and close.** This is your backup reference.

---

## ✅ TESTING

### **Test 1: Local Development**

```powershell
# Navigate to backend
cd c:\Users\Lenovo\Omegoo\backend

# Start backend
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected Successfully!
✅ Server running on port 3001
```

**If you see errors:**
- Check MongoDB password is correct
- Check no extra spaces in .env file
- Wait 2-3 minutes after changing password on Atlas

---

### **Test 2: Render Production**

```powershell
# Test health endpoint
curl https://your-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "mongodb": "connected"
}
```

**Check Render Logs:**
```
1. Render Dashboard → Your Service
2. Click "Logs" tab
3. Look for: "MongoDB Connected Successfully"
```

---

### **Test 3: Frontend Login**

1. **Open your deployed site:**
   ```
   https://omegoo.vercel.app
   ```

2. **Try to Login/Register**
   - Should work without errors
   - JWT tokens should generate properly

3. **Check Browser Console** (F12)
   - No authentication errors
   - No 401/403 errors

---

## 🚫 FILES YOU SHOULD **NEVER** EDIT

### ❌ DO NOT change these files:
- `backend/src/.env` - Different file, not used
- `frontend/.env` - Frontend doesn't need JWT secrets
- Any `.example` files - Templates only
- Git tracked files - Already removed

### ❌ DO NOT commit:
- `backend/.env`
- `CREDENTIALS_BACKUP.txt`
- Any file with real passwords

---

## 🔧 TROUBLESHOOTING

### **Problem 1: "Authentication failed" on MongoDB**

**Solution:**
```
1. Double-check password has no typos
2. Make sure password doesn't have special characters like @, :, / 
   (if it does, URL encode them)
3. Wait 5 minutes after changing password
4. Restart backend server
```

**URL Encoding Special Characters:**
```
@ → %40
: → %3A
/ → %2F
? → %3F
# → %23
[ → %5B
] → %5D
```

Example:
```
Password: P@ss:word/123
Encoded:  P%40ss%3Aword%2F123

Full URI:
mongodb+srv://myuser:P%40ss%3Aword%2F123@cluster0.example.mongodb.net/myapp_db
```

---

### **Problem 2: "Invalid token" errors**

**Solution:**
```
1. Clear browser cookies/localStorage
2. Logout and login again
3. Make sure ALL 4 JWT secrets are changed
4. Restart backend server
5. Check Render environment variables saved correctly
```

---

### **Problem 3: Render deployment fails**

**Solution:**
```
1. Check Render logs for specific error
2. Make sure no syntax errors in environment variables
3. No trailing spaces in values
4. Click "Manual Deploy" → "Clear build cache & deploy"
```

---

### **Problem 4: Local backend won't start**

**Solution:**
```powershell
# Stop all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Check .env file has no syntax errors
Get-Content c:\Users\Lenovo\Omegoo\backend\.env

# Look for:
# - No spaces around = sign (should be KEY=value, not KEY = value)
# - No quotes around values (should be KEY=value, not KEY="value")
# - No extra blank lines between variables
```

---

## 📋 COMPLETE CHECKLIST

Use this checklist to make sure you did everything:

### MongoDB Password:
- [ ] Logged into MongoDB Atlas
- [ ] Changed password for omegoo_db_user
- [ ] Copied new password
- [ ] Updated `backend/.env` file (local)
- [ ] Updated MONGODB_URI in Render
- [ ] Saved backup of new credentials

### JWT Secrets:
- [ ] Generated 4 new secrets using crypto.randomBytes
- [ ] Copied all 4 secrets
- [ ] Updated JWT_SECRET in `backend/.env`
- [ ] Updated REFRESH_TOKEN_SECRET in `backend/.env`
- [ ] Updated ADMIN_JWT_SECRET in `backend/.env`
- [ ] Updated SESSION_SECRET in `backend/.env`
- [ ] Updated all 4 secrets in Render
- [ ] Saved backup of secrets

### Testing:
- [ ] Local backend starts without errors
- [ ] MongoDB connects successfully
- [ ] Render deployment successful
- [ ] Can login/register on frontend
- [ ] No authentication errors in console

### Security:
- [ ] Did NOT commit `.env` file to git
- [ ] Did NOT commit backup credentials file
- [ ] Credentials backup stored securely
- [ ] No secrets visible in GitHub repository

---

## 📞 SUPPORT

**If you get stuck:**

1. **Check Render Logs:**
   ```
   Render Dashboard → Your Service → Logs
   ```

2. **Check Local Backend Logs:**
   ```powershell
   cd backend
   npm run dev
   # Read error messages carefully
   ```

3. **MongoDB Connection Test:**
   ```powershell
   node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_NEW_MONGODB_URI').then(() => console.log('✅ Connected')).catch(err => console.log('❌ Error:', err.message));"
   ```

---

## ⏱️ ESTIMATED TIME

- **MongoDB Password Change:** 5 minutes
- **Generate JWT Secrets:** 2 minutes
- **Update Local .env:** 3 minutes
- **Update Render:** 5 minutes
- **Testing:** 5 minutes
- **Total:** ~20 minutes

---

## 🎯 SUMMARY

**What Changes:**
1. MongoDB password (1 place on Atlas)
2. 4 JWT secrets (generate new random ones)

**Where to Update:**
1. `backend/.env` file (5 lines)
2. Render Dashboard (5 environment variables)

**What Stays Same:**
- Frontend code (no changes needed)
- Database name (omegoo_db)
- Username (omegoo_db_user)
- Cluster URL (cluster0.fabck1e.mongodb.net)

---

**🔒 REMEMBER:** After changing credentials, the old exposed secrets become useless! Your app will be secure again.

**⚠️ IMPORTANT:** Complete ALL steps. Changing only 1 or 2 places will cause errors!
