# 🧪 Testing Coin System - Step by Step

## 🔍 **How to Test & Debug**

### **Step 1: Open Browser Console (F12)**
1. Open Omegoo in browser
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Clear console (🗑️ icon)

### **Step 2: Login to Your Account**
```
Email: saurabhshukla1966@gmail.com (or your account)
Password: your_password
```

After login, check console for:
```
✅ User data loaded: { userId: 'xxx', coins: 50 }
```

### **Step 3: Start a Chat (Text/Voice/Video)**
Click any "Start Chat" button and watch console logs:

#### **Expected Console Logs (if working):**
```javascript
🔍 Starting search for new text chat partner
📤 Backend: Sending match-found to user-xxx with coins: 49
📊 Match data received: { coins: 49, totalChats: 1, dailyChats: 1, hasCoinsData: true }
🔄 CALLING updateUser with: { coins: 49, totalChats: 1, dailyChats: 1 }
🔄 updateUser function called with: { coins: 49, totalChats: 1, dailyChats: 1 }
✅ UPDATE_USER action dispatched
📝 AuthContext UPDATE_USER action: { before: {coins: 50, totalChats: 0, dailyChats: 0}, updates: {coins: 49, totalChats: 1, dailyChats: 1}, after: {coins: 49, totalChats: 1, dailyChats: 1} }
✅ updateUser CALLED - New values: coins=49, totalChats=1, dailyChats=1
```

### **Step 4: Check UI Updates**

#### **Home Page (After Chat):**
- Header: Should show ⭐ **49** (was 50)
- Coin badge: Should show "49 Coins"

#### **Profile Page:**
- Total Chats: Should show **1** (was 0)
- Today's Chats: Should show **1** (was 0)
- Total Coins: Should show **49** (was 50)

---

## ❌ **If NOT Working - Troubleshooting**

### **Problem 1: No console logs at all**
**Cause**: Backend not sending match-found event
**Fix**: Check backend logs - socket connection issue

### **Problem 2: Console shows "⚠️ No coins data in match-found event!"**
**Cause**: Backend not sending coins/totalChats/dailyChats in event
**Fix**: Check backend socket.ts lines 400-420

### **Problem 3: Console shows logs BUT UI not updating**
**Cause**: React state not re-rendering
**Fix**: Check if `user` object is properly spread in AuthContext reducer

### **Problem 4: "hasCoinsData: false" in console**
**Cause**: Backend sending match-found without coin data
**Check**: Backend socket.ts - ensure `coins`, `totalChats`, `dailyChats` are in emit

---

## 🔧 **Manual Backend Check**

### **Check Backend Logs (if running locally):**
```
💰 User user-xxx: 50 -> 49 coins | Chats: 1 total, 1 today
📤 Sending match-found to user-xxx (initiator) with coins: 49
```

If you see this → Backend is working ✅

If you DON'T see this → Backend coin deduction failed ❌

---

## 🎯 **Test Sequence**

1. **Initial State**
   - Login → Coins: 50, Total: 0, Daily: 0

2. **After 1 Chat**
   - Expected: Coins: 49, Total: 1, Daily: 1
   - Check: Home header, Profile stats

3. **After 2 Chats**
   - Expected: Coins: 48, Total: 2, Daily: 2
   - Check: All pages update

4. **After 50 Chats**
   - Expected: Coins: 0, Total: 50, Daily: 50
   - Try 51st chat → Should show "Insufficient coins" alert

5. **Next Day Login**
   - Expected: Coins: 50 (reset), Total: 50 (preserved), Daily: 0 (reset)

---

## 🐛 **Common Issues**

### Issue: "Coins deducted but UI shows old value"
**Solution**: 
- Close all tabs
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)
- Login again

### Issue: "Backend says insufficient coins but UI shows 50"
**Solution**:
- Logout and login again
- Check localStorage: `localStorage.getItem('user')`
- Clear localStorage: `localStorage.clear()`

### Issue: "totalChats/dailyChats not increasing"
**Solution**:
- Check backend database directly
- Verify updateUser() is being called in console
- Check AuthContext reducer logs

---

## ✅ **Success Indicators**

All these should be TRUE:

- [ ] Console shows "📊 Match data received: { coins: 49... }"
- [ ] Console shows "🔄 CALLING updateUser with: { coins: 49... }"
- [ ] Console shows "📝 AuthContext UPDATE_USER action: { after: { coins: 49 } }"
- [ ] Home page header shows 49 coins (not 50)
- [ ] Profile page shows updated stats
- [ ] After refresh, values persist
- [ ] Next chat deducts another coin (48)

---

## 📞 **Need Help?**

If all logs are present BUT UI not updating:
1. Check React DevTools → Components → AuthContext
2. Verify `user.coins` value in state
3. Force re-render by navigating away and back
4. Check if component is using old cached data

If no logs at all:
1. Backend not running
2. Socket not connected
3. Match-found event not firing
4. Check backend terminal for errors
