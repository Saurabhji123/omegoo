<div align="center">

# 🎭 Omegoo

### *Connect Anonymously, Chat Safely — Make Friends in Seconds*

[![Live Demo](https://img.shields.io/badge/Live-omegoo.vercel.app-blueviolet?style=for-the-badge&logo=vercel)](https://omegoo.vercel.app)
[![Made with React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-success?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/PWA-Enabled-purple?style=flat-square" alt="PWA">
  <img src="https://img.shields.io/badge/WebRTC-Supported-orange?style=flat-square" alt="WebRTC">
</p>

[Live Demo](https://omegoo.vercel.app) • [Report Bug](https://github.com/Saurabhji123/omegoo/issues) • [Request Feature](https://github.com/Saurabhji123/omegoo/issues)

</div>

---

## � What is Omegoo?

**Omegoo** is a modern, anonymous video chat platform that connects strangers from around the world in real-time. Built with cutting-edge web technologies, it offers a safe and exciting way to meet new people through text, voice, or video chat.

> **🔥 Now Live**: Experience seamless anonymous chatting at [omegoo.vercel.app](https://omegoo.vercel.app)

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- 🔒 **Secure Authentication** - Email/Google sign-in required
- 💬 **Multi-Mode Chat** - Text, Voice & Video
- ⚡ **Instant Matching** - Smart queue algorithm
- 🌍 **Global Reach** - Connect with users worldwide
- 📱 **PWA Support** - Install as mobile app
- 🎨 **Modern UI** - Beautiful purple gradient theme

</td>
<td width="50%">

### 🛡️ Safety & Privacy
- 🔞 **Age Verification** - 18+ mandatory
- 🚫 **Skip & Report** - Moderation tools
- 🔐 **Secure Sessions** - End-to-end encryption
- 👁️ **Privacy First** - Anonymous chat experience
- ⚖️ **Legal Compliance** - GDPR & IT Rules 2021
- 🔑 **Authenticated Users** - Email/Google sign-in required

</td>
</tr>
</table>

---

## 🎬 How It Works

```mermaid
graph LR
    A[Visit Website] --> B[Sign In/Register]
    B --> C[Accept Terms]
    C --> D[Choose Chat Mode]
    D --> E[Get Matched]
    E --> F[Start Chatting]
    F --> G{Enjoy or Skip}
    G -->|Next| E
    G -->|Done| H[End Session]
```

1. **📍 Visit** - Go to [omegoo.vercel.app](https://omegoo.vercel.app)
2. **🔐 Sign In** - Register with Email or Google OAuth
3. **✅ Accept** - Agree to age verification and terms
4. **🎯 Choose** - Select Text, Voice, or Video chat
5. **🔄 Match** - Get paired with a random stranger
6. **💬 Chat** - Enjoy anonymous conversation
7. **⏭️ Skip** - Move to next person anytime

---

## 🛠️ Technology Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?style=for-the-badge&logo=socket.io&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.20.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-PeerJS-333333?style=for-the-badge&logo=webrtc&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white)

</div>

---

## � Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 10.0.0
Git
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Saurabhji123/omegoo.git
cd omegoo

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Install backend dependencies
cd ../backend
npm install

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Start development servers
# Terminal 1 - Frontend
cd frontend
npm start

# Terminal 2 - Backend
cd backend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Production**: https://omegoo.vercel.app

---

## 📁 Project Structure

```
omegoo/
├── 📂 frontend/              # React TypeScript PWA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React Context providers
│   │   ├── services/        # API & Socket services
│   │   └── App.tsx          # Main application
│   ├── public/              # Static assets
│   └── package.json
│
├── 📂 backend/               # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth & validation
│   │   └── index.ts         # Server entry point
│   └── package.json
│
├── 📂 shared/               # Common types & utilities
├── 📄 README.md             # This file
└── 📄 package.json          # Root package config
```

---

## 🌐 Environment Variables

### Frontend (`.env`)
```bash
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
REACT_APP_ENVIRONMENT=production
```

### Backend (`.env`)
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-secret-key
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/omegoo
FRONTEND_URL=https://omegoo.vercel.app
ALLOWED_ORIGINS=https://omegoo.vercel.app
```

---

## 🎯 Features Showcase

### 🔐 Smart Authentication
- **Email/Password**: Secure account creation
- **Google OAuth**: Quick sign-in with Google
- **JWT Tokens**: Session management & security
- **Age Verification**: 18+ mandatory compliance

### 🎨 Modern UI/UX
- **Purple Gradient Theme**: Eye-catching modern design
- **Dark Mode**: Comfortable viewing experience
- **Responsive Design**: Seamless on mobile, tablet, desktop
- **Smooth Animations**: Polished interactions
- **Glass Morphism**: Modern frosted glass effects
- **PWA Ready**: Install as native app

### 🛡️ Privacy & Safety
- **Anonymous Chat**: No personal info shared during chat
- **Skip Feature**: Move to next person instantly
- **Report System**: Flag inappropriate behavior
- **Secure Sessions**: End-to-end encrypted connections
- **Data Protection**: GDPR & IT Rules 2021 compliant

---

## 📊 Performance & Analytics

- ⚡ **Fast Load Times**: < 2s initial load
- 📱 **PWA Score**: 95+ on Lighthouse
- 🎯 **SEO Optimized**: Meta tags & sitemap
- 📈 **Real-time Monitoring**: Error tracking
- 🔄 **Auto-scaling**: Handles traffic spikes

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 🚀 Roadmap

### ✅ Completed Features
- [x] Text chat functionality
- [x] Video chat with WebRTC
- [x] Voice chat support
- [x] Email authentication system
- [x] Google OAuth integration
- [x] MongoDB integration
- [x] Responsive PWA design
- [x] Purple gradient theme
- [x] Skip & report system
- [x] Age verification

### 🔜 Upcoming Features
- [ ] Phone number verification
- [ ] Coin economy system
- [ ] Premium subscriptions
- [ ] Group chat rooms
- [ ] AI-powered moderation
- [ ] Real-time language translation
- [ ] Virtual gifts & rewards
- [ ] Advanced matching algorithm
- [ ] User preferences & filters
- [ ] Video chat recording (with consent)

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? We'd love to hear from you!

- 🐛 [Report a Bug](https://github.com/Saurabhji123/omegoo/issues/new?labels=bug)
- 💡 [Request a Feature](https://github.com/Saurabhji123/omegoo/issues/new?labels=enhancement)
- 📧 Contact: [omegoochat@gmail.com](mailto:omegoochat@gmail.com)

---

## 📄 License

This project is **proprietary** and all rights are reserved.

**© 2025 Omegoo. All Rights Reserved.**

---

## ⚖️ Copyright & Intellectual Property Protection

### 🚨 STRICT COPYRIGHT NOTICE

**Omegoo** and all associated intellectual property, including but not limited to source code, design, branding, logo, features, and functionality are **exclusively owned and copyrighted** by Omegoo.

### 🛡️ Protected Intellectual Property

✅ **Source Code** - All backend and frontend code architecture  
✅ **Visual Design** - UI/UX design, layout, color schemes, animations  
✅ **Brand Identity** - Omegoo name, logo, trademarks, branding  
✅ **Unique Features** - Matching algorithm, chat system, WebRTC implementation  
✅ **Technical Innovation** - Privacy-first architecture, session management  
✅ **Content** - All website text, documentation, and marketing materials  

### ❌ PROHIBITED ACTIONS

The following actions are **STRICTLY PROHIBITED** and will result in immediate legal action:

- 🚫 **Cloning/Copying** - Creating similar platforms or derivative works
- 🚫 **Reverse Engineering** - Decompiling, disassembling, or analyzing code
- 🚫 **Redistribution** - Sharing, selling, or licensing our code/design
- 🚫 **Trademark Misuse** - Using "Omegoo" name or logo without permission
- 🚫 **Commercial Exploitation** - Monetizing any Omegoo assets
- 🚫 **Unauthorized Attribution** - Removing credits or claiming ownership

### ⚠️ DMCA TAKEDOWN ENFORCEMENT

**ZERO TOLERANCE POLICY** - Any unauthorized use of Omegoo's intellectual property will result in:

1. **📧 Immediate DMCA Takedown Notices** (24-48 hours)
2. **⚖️ Civil Litigation** - Statutory damages ($750-$150,000 per work)
3. **🌐 Domain Seizure** - Permanent blacklisting of infringing domains
4. **🔒 NO SETTLEMENT** - Once filed, DMCA will **NOT** be withdrawn

### 🌍 International Protection

This project is protected under:
- 📜 **Berne Convention** for the Protection of Literary and Artistic Works
- 📜 **WIPO Copyright Treaty** (WCT)
- 📜 **Digital Millennium Copyright Act** (DMCA) - USA
- 📜 **Copyright Directive** - European Union
- 📜 **International Copyright Laws** - Worldwide enforcement

### 📧 Legal Contact

**Copyright Infringement Reports:**  
📩 [omegoochat@gmail.com](mailto:omegoochat@gmail.com)  
Subject: "Copyright Infringement Report"

**Licensing Inquiries (Rarely Granted):**  
📩 [omegoochat@gmail.com](mailto:omegoochat@gmail.com)  
Subject: "Licensing Inquiry"

---

### ⚠️ FINAL WARNING

**By cloning, forking, or accessing this repository, you acknowledge that:**

1. You will **NOT** copy, clone, or recreate any aspect of Omegoo
2. Unauthorized use will result in **severe financial and legal consequences**
3. DMCA takedown notices are **IRREVERSIBLE and NON-NEGOTIABLE**
4. We will pursue **maximum legal penalties** without mercy
5. Your actions are **monitored and violations will be prosecuted internationally**

---

**© 2025 Omegoo. Protected by International Copyright Law.**  
*Unauthorized use will be prosecuted to the fullest extent of the law.*

---

## 🌟 Show Your Support

If you like this project, please ⭐ star it on GitHub!

<div align="center">

### Made with ❤️ by [Saurabh Shukla](https://github.com/Saurabhji123)

[![GitHub followers](https://img.shields.io/github/followers/Saurabhji123?style=social)](https://github.com/Saurabhji123)
[![GitHub stars](https://img.shields.io/github/stars/Saurabhji123/omegoo?style=social)](https://github.com/Saurabhji123/omegoo)

[⬆ Back to Top](#-omegoo)

</div>
