# MongoDB Atlas Setup Guide for Omegoo

## Current Configuration
Your `.env` file already has MongoDB configured:
```
MONGODB_URI=mongodb+srv://omegoo_db_user:omegoo_pass@cluster0.fabck1e.mongodb.net/omegoo_db?retryWrites=true&w=majority
USE_MONGODB=true
```

## If You Need to Update Connection String:

Replace the MONGODB_URI in `backend/.env` with YOUR connection string from MongoDB Atlas:

```bash
# Example format:
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DATABASE>?retryWrites=true&w=majority

# Actual example:
MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/omegoo_db?retryWrites=true&w=majority
```

**Replace:**
- `<USERNAME>` with your MongoDB Atlas username
- `<PASSWORD>` with your MongoDB Atlas password
- `<CLUSTER>` with your cluster URL (e.g., cluster0.abc123.mongodb.net)
- `<DATABASE>` with database name (keep it as `omegoo_db`)

## Testing Connection

Run backend server:
```bash
cd backend
npm run dev
```

Look for these messages in console:
✅ MongoDB connected successfully
✅ ServiceFactory: Using MongoDB Production DatabaseService

If you see errors, check:
1. Username/password correct hai?
2. Network Access me 0.0.0.0/0 allowed hai?
3. Database User create kiya hai with read/write permissions?
