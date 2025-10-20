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
- 🔒 **100% Anonymous** - No registration required
- 💬 **Multi-Mode Chat** - Text, Voice & Video
- ⚡ **Instant Matching** - Smart queue algorithm
- 🌍 **Global Reach** - Connect with users worldwide
- 📱 **PWA Support** - Install as mobile app
- 🎨 **Modern UI** - Beautiful gradient theme

</td>
<td width="50%">

### 🛡️ Safety & Privacy
- 🔞 **Age Verification** - 18+ mandatory
- 🚫 **Skip & Report** - Moderation tools
- 🔐 **Secure Sessions** - End-to-end encryption
- 👁️ **Privacy First** - Minimal data collection
- ⚖️ **Legal Compliance** - GDPR & IT Rules 2021
- 🎖️ **Verified Users** - Phone verification system

</td>
</tr>
</table>

---

## 🎬 How It Works

```mermaid
graph LR
    A[Visit Website] --> B[Accept Terms]
    B --> C[Choose Chat Mode]
    C --> D[Get Matched]
    D --> E[Start Chatting]
    E --> F{Enjoy or Skip}
    F -->|Next| D
    F -->|Done| G[End Session]
```

1. **📍 Visit** - Go to [omegoo.vercel.app](https://omegoo.vercel.app)
2. **✅ Accept** - Agree to age verification and terms
3. **🎯 Choose** - Select Text, Voice, or Video chat
4. **🔄 Match** - Get paired with a random stranger
5. **💬 Chat** - Enjoy anonymous conversation
6. **⏭️ Skip** - Move to next person anytime

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
- **Guest Mode**: Start chatting instantly
- **Google OAuth**: One-click sign-in
- **Email/Password**: Traditional authentication
- **Tiered System**: Guest → Verified → Premium

### � Coin Economy
- **Daily Coins**: 50 coins auto-reset at 12 AM
- **Session Cost**: 1 coin per chat session
- **Reward System**: Earn coins through activities
- **Premium Features**: Unlock with subscription

### 🎨 Modern UI/UX
- **Gradient Theme**: Purple-blue aesthetic
- **Dark Mode**: Eye-friendly interface
- **Responsive Design**: Mobile, tablet, desktop
- **Smooth Animations**: Polished interactions
- **Glass Morphism**: Modern frosted glass effects

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

## � Roadmap

- [x] Text chat functionality
- [x] Video chat with WebRTC
- [x] Voice chat support
- [x] Google OAuth integration
- [x] Responsive design
- [ ] Group chat rooms
- [ ] AI-powered moderation
- [ ] Language translation
- [ ] Virtual gifts system
- [ ] Premium subscriptions

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? We'd love to hear from you!

- 🐛 [Report a Bug](https://github.com/Saurabhji123/omegoo/issues/new?labels=bug)
- 💡 [Request a Feature](https://github.com/Saurabhji123/omegoo/issues/new?labels=enhancement)
- 📧 Contact: [your-email@example.com](mailto:your-email@example.com)

---

## 📄 License

This project is **proprietary** and all rights are reserved.

**© 2025 Omegoo. All Rights Reserved.**

---

## 🌟 Show Your Support

If you like this project, please ⭐ star it on GitHub!

<div align="center">

### Made with ❤️ by [Saurabh Shukla](https://github.com/Saurabhji123)

[![GitHub followers](https://img.shields.io/github/followers/Saurabhji123?style=social)](https://github.com/Saurabhji123)
[![GitHub stars](https://img.shields.io/github/stars/Saurabhji123/omegoo?style=social)](https://github.com/Saurabhji123/omegoo)

[⬆ Back to Top](#-omegoo)

</div>