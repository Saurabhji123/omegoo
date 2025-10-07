# Omegoo - Anonymous Random Chat PWA

**"Connect anonymously, chat safely — make friends in seconds."**

# Omegoo - Anonymous Video Chat Platform

🎥 A modern, anonymous video chat platform inspired by Omegle, built with React, Node.js, and WebRTC.

## 🌟 Features

- **Anonymous Chat**: No registration required, instant connection
- **Multiple Chat Modes**: Text, Audio, and Video chat options
- **Real-time Matching**: Smart queue system for instant user pairing
- **WebRTC Integration**: High-quality peer-to-peer video/audio calls
- **Modern UI**: Clean, responsive design with dark/light mode
- **Mobile Friendly**: PWA support for mobile devices
- **Moderation Tools**: Report and skip functionality

## 🚀 Live Demo

- **Frontend**: [https://omegoo-chat.vercel.app](https://omegoo-chat.vercel.app)
- **Backend API**: [https://omegoo-backend.onrender.com](https://omegoo-backend.onrender.com)

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **WebRTC** for peer-to-peer video/audio
- **React Router** for navigation
- **Heroicons** for UI icons

### Backend
- **Node.js** with Express and TypeScript
- **Socket.IO** for real-time signaling
- **MongoDB** with in-memory fallback
- **Redis** for queue management
- **JWT** for authentication
- **CORS** and security middleware

## 📱 How It Works

1. **Visit the Platform**: Open the website, no signup required
2. **Choose Chat Mode**: Select Text, Audio, or Video chat
3. **Get Matched**: Our smart algorithm pairs you with available users
4. **Start Chatting**: Enjoy anonymous conversations with strangers
5. **Skip or Report**: Use moderation tools if needed

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/omegoo.git
   cd omegoo
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create Render Account**: Sign up at [render.com](https://render.com)
2. **Connect GitHub**: Link your GitHub repository
3. **Create Web Service**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `production`

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Import Project**: Connect your GitHub repository
3. **Configure Build**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

### Environment Variables

#### Backend (Render)
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

#### Frontend (Vercel)
```
REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com
REACT_APP_ENVIRONMENT=production
```

## 🧪 Testing Multi-User Functionality

1. **Open Multiple Tabs**: Open 2+ browser tabs/windows
2. **Different Devices**: Test on different devices/networks
3. **Chat Modes**: Test all three chat modes (text/audio/video)
4. **Features**: Test matching, messaging, video calls, skip functionality

## 🚀 Features

### Core Features
- Anonymous random matching
- Text, audio, and video chat
- Progressive verification system (Tier 0 → 1 → 2)
- Real-time content moderation
- AI-powered safety detection
- Multi-factor ban system
- Compliance with POCSO/IT Rules/GDPR

### Safety & Moderation
- 18+ only strict verification
- Real-time frame sampling and analysis
- Audio content detection
- Automatic session termination for violations
- Evidence retention and reporting system
- Grievance officer system

### Monetization
- Rewarded ads (AdMob integration)
- Coin system for premium features
- Tiered subscriptions
- Virtual gifts system

## 🏗️ Architecture

```
omegoo/
├── frontend/          # React TypeScript PWA
├── backend/           # Node.js/Express API
├── database/          # PostgreSQL & Redis schemas
├── shared/           # Common types and utilities
└── deployment/       # Docker & deployment configs
```

## 🛡️ Compliance

- **18+ Only**: Mandatory age verification
- **Zero Tolerance**: Automatic CSAM detection and reporting
- **Privacy First**: Minimal PII collection, encrypted storage
- **Legal Compliance**: POCSO, IT Rules 2021, GDPR compliant
- **Transparency**: Quarterly safety reports

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Quick Start
1. Clone and setup:
```bash
git clone <repo>
cd omegoo
npm run setup
```

2. Environment setup:
```bash
cp .env.example .env
# Configure your environment variables
```

3. Database setup:
```bash
npm run db:setup
npm run db:migrate
```

4. Start development:
```bash
npm run dev
```

## 📱 PWA Features

- Offline support
- Push notifications
- App-like experience
- Auto-install prompts
- Cross-platform compatibility

## 🔒 Security

- JWT-based authentication
- Device fingerprinting
- Rate limiting
- Encrypted evidence storage
- Secure WebRTC connections

## 📊 Monitoring

- Real-time analytics
- Performance monitoring
- Safety metrics tracking
- User behavior insights

## 🤝 Contributing

Please read CONTRIBUTING.md for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

- Email: support@omegoo.app
- Grievance Officer: grievance@omegoo.app
- Legal: legal@omegoo.app

---

**Important**: This platform is strictly for users 18 years and older. All activities are monitored for safety and compliance.