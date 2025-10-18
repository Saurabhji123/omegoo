# 🎯 Quick Reference: Where to Change What

## 📊 VISUAL FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                     STEP 1: GENERATE SECRETS                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │  MongoDB Atlas   │
                    │  Password Change │
                    └──────────────────┘
                              ↓
                    ┌──────────────────┐
                    │   Generate 4     │
                    │   JWT Secrets    │
                    │   (crypto cmd)   │
                    └──────────────────┘
                              ↓
                ┌──────────────────────────┐
                │   Copy All New Values    │
                └──────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌────────────────┐                        ┌─────────────────┐
│ PLACE 1        │                        │ PLACE 2         │
│ Local Backend  │                        │ Render Dashboard│
│ .env file      │                        │ Environment Vars│
└────────────────┘                        └─────────────────┘
        │                                           │
        ├─ MONGODB_URI                             ├─ MONGODB_URI
        ├─ JWT_SECRET                              ├─ JWT_SECRET
        ├─ REFRESH_TOKEN_SECRET                    ├─ REFRESH_TOKEN_SECRET
        ├─ ADMIN_JWT_SECRET                        ├─ ADMIN_JWT_SECRET
        └─ SESSION_SECRET                          └─ SESSION_SECRET
        ↓                                           ↓
┌────────────────┐                        ┌─────────────────┐
│   Save File    │                        │   Click Save    │
└────────────────┘                        └─────────────────┘
        ↓                                           ↓
┌────────────────┐                        ┌─────────────────┐
│  npm run dev   │                        │  Auto Redeploy  │
└────────────────┘                        └─────────────────┘
        ↓                                           ↓
┌────────────────┐                        ┌─────────────────┐
│  Test Local    │                        │ Test Production │
└────────────────┘                        └─────────────────┘
```

---

## 🗺️ FILE LOCATIONS MAP

```
C:\Users\Lenovo\Omegoo\
│
├── backend/
│   ├── .env  ← 📝 EDIT THIS FILE (5 changes)
│   │   Line 8:  MONGODB_URI
│   │   Line 12: ADMIN_JWT_SECRET
│   │   Line 16: JWT_SECRET
│   │   Line 18: REFRESH_TOKEN_SECRET
│   │   Line 34: SESSION_SECRET
│   │
│   └── src/
│       └── .env  ← ❌ DON'T TOUCH (not used)
│
├── frontend/
│   └── .env  ← ❌ DON'T TOUCH (no secrets needed)
│
├── .gitignore  ← ✅ Already configured
│
├── HOW_TO_CHANGE_CREDENTIALS.md  ← 📖 Full Guide
└── CREDENTIALS_QUICK_REF.md  ← 📖 This File
```

---

## 🎯 QUICK COMMAND REFERENCE

### Generate New JWT Secrets (Run 4 Times):
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Edit Local .env File:
```powershell
code c:\Users\Lenovo\Omegoo\backend\.env
# OR
notepad c:\Users\Lenovo\Omegoo\backend\.env
```

### Test Local Backend:
```powershell
cd c:\Users\Lenovo\Omegoo\backend
npm run dev
```

### Stop All Node Processes:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 📝 EXACT LINES TO CHANGE

### In `backend/.env`:

```bash
# Line 8 (MongoDB)
# OLD:
MONGODB_URI=mongodb+srv://old_user:old_password@cluster0.example.mongodb.net/old_db?retryWrites=true&w=majority
# NEW:
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_NEW_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority

# Line 12 (Admin JWT)
# OLD:
ADMIN_JWT_SECRET=old-admin-jwt-secret-needs-change
# NEW:
ADMIN_JWT_SECRET=<paste secret from Run 3>

# Line 16 (Main JWT)
# OLD:
JWT_SECRET=old-dev-jwt-secret-not-secure
# NEW:
JWT_SECRET=<paste secret from Run 1>

# Line 18 (Refresh Token)
# OLD:
REFRESH_TOKEN_SECRET=old-dev-refresh-token-secret
# NEW:
REFRESH_TOKEN_SECRET=<paste secret from Run 2>

# Line 34 (Session)
# OLD:
SESSION_SECRET=old-dev-session-secret
# NEW:
SESSION_SECRET=<paste secret from Run 4>
```

---

## 🌐 RENDER DASHBOARD STEPS

1. Visit: `https://dashboard.render.com`
2. Select: `omegoo-backend` service
3. Click: `Environment` (left sidebar)
4. Find and edit each variable:

```
MONGODB_URI           → Paste new MongoDB URI
JWT_SECRET            → Paste Run 1 output
REFRESH_TOKEN_SECRET  → Paste Run 2 output
ADMIN_JWT_SECRET      → Paste Run 3 output
SESSION_SECRET        → Paste Run 4 output
```

5. Click: `Save Changes` (bottom)
6. Wait: 2-3 minutes for redeploy

---

## ✅ VERIFICATION CHECKLIST

```
Local Development:
□ Updated backend/.env file
□ Backend starts with npm run dev
□ See "MongoDB Connected Successfully"
□ No authentication errors

Render Production:
□ Updated all 5 environment variables
□ Service redeployed successfully
□ Logs show "MongoDB Connected"
□ Health endpoint responds

Frontend:
□ Can login/register
□ No console errors
□ JWT tokens working
```

---

## ⚡ COMMON MISTAKES

❌ **Mistake 1:** Editing wrong .env file
✅ **Solution:** Edit `backend/.env` (not `backend/src/.env`)

❌ **Mistake 2:** Spaces in environment variables
✅ **Solution:** `KEY=value` (no spaces around =)

❌ **Mistake 3:** Quotes around values
✅ **Solution:** `KEY=value` (not `KEY="value"`)

❌ **Mistake 4:** Forgot to save in Render
✅ **Solution:** Click "Save Changes" button at bottom

❌ **Mistake 5:** Special characters in password
✅ **Solution:** URL encode them (@ → %40, : → %3A, etc.)

---

## 🆘 EMERGENCY COMMANDS

### If backend won't start:
```powershell
# Kill all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Check .env syntax
Get-Content c:\Users\Lenovo\Omegoo\backend\.env | Select-String "MONGODB_URI|JWT_SECRET|REFRESH_TOKEN|ADMIN_JWT|SESSION_SECRET"
```

### Test MongoDB connection:
```powershell
node -e "require('mongoose').connect('YOUR_URI').then(() => console.log('✅ OK')).catch(e => console.log('❌', e.message))"
```

---

## 📞 WHERE TO GET HELP

**If stuck, check:**
1. Full guide: `HOW_TO_CHANGE_CREDENTIALS.md`
2. Render logs: Dashboard → Your Service → Logs
3. Local logs: Terminal where you ran `npm run dev`

---

## ⏱️ TIME ESTIMATE

```
MongoDB Password:     5 min  ━━━━━━━━━━━━━━━━━━━━
Generate Secrets:     2 min  ━━━━━━━━
Update Local:         3 min  ━━━━━━━━━━━━
Update Render:        5 min  ━━━━━━━━━━━━━━━━━━━━
Testing:              5 min  ━━━━━━━━━━━━━━━━━━━━
                     ──────
Total:               20 min
```

---

## 🎯 ONE-LINER SUMMARY

**Change 1 password on MongoDB Atlas + Generate 4 secrets → Update 5 values in 2 places (local .env + Render dashboard) → Test = Done!**

---

**💡 TIP:** Open this file side-by-side with your code editor for easy reference!
