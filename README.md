# 🚨 Scan4Legal - QR Code Based Legal Help App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

A revolutionary platform that connects citizens with legal experts instantly through QR codes. No app download required - just scan and get immediate legal help in your preferred language.

## 🎯 Core Idea

A person scans a QR code (placed in public places like police stations, buses, courts, hospitals, villages) and instantly:

👉 Connects to a legal expert  
👉 Starts a **video call or audio call**  
👉 Gets **instant legal advice in their language**

## 👥 Target Users

* Poor / rural citizens
* Workers / labourers
* Women facing domestic issues
* Road accident victims
* People facing police/legal problems
* Small shopkeepers & vendors

## ✨ Key Features

### 📱 QR Code Scan & Instant Connect
* Scan QR → Open web app (no download required)
* Auto-connect to available legal agent

### 📹 Video / Audio Call
* One tap **video call**
* Low network mode → **audio only**
* Chat option also available

### 🌍 Multi-language Support
* English, Hindi, Bengali, Telugu, Marathi, Tamil
* Automatic language detection
* Voice-based UI for illiterate users

### ⚖️ Legal Category Selection
Simple button-based selection:
* Police issue 🚓
* Domestic violence 👩
* Property dispute 🏠
* Loan / money issue 💰
* Labour issue 👷
* Accident 🚑

### 🚨 Emergency Mode
* "🚨 Urgent Help" button
* Connect within 30 seconds
* Priority lawyer assignment

### 📄 Case Recording & Reports
* Summary of advice sent via:
  * WhatsApp
  * SMS
  * Email
* Automatic report generation
* Legal advice documentation

### 📍 Location Capture
* Helps lawyer understand situation quickly
* Privacy-respecting implementation
* Optional location sharing

### 🗣️ Voice-based UI
* "Press and Speak your problem"
* Speech-to-text for illiterate users
* Multi-language speech recognition

## 👨‍⚖️ Lawyer Dashboard

Lawyers get a comprehensive dashboard with:
* Incoming call requests with priority
* Case type preview and location
* Accept / reject call functionality
* Real-time call management
* Call history and analytics
* Earnings tracking and insights
* Performance metrics
* Online/offline status management

## 💰 Revenue Models

### Option 1: Government Partnership
* Sell to:
  * Police stations
  * District courts
  * Panchayat offices
  * Bus stands

### Option 2: NGO + CSR Model
* NGOs sponsor free legal support
* Companies fund as CSR initiatives

### Option 3: Paid Legal Help
* ₹10 – ₹50 per call (very low cost)
* Monthly subscription for frequent users

### Option 4: Lawyer Subscription
* Lawyers pay to receive leads
* Example: ₹999/month per lawyer

## 📍 QR Code Placement

QR codes can be placed at:
* Police stations
* Bus stands
* Railway stations
* Hospitals
* Courts
* Village Panchayat Bhawan
* Labour chowk areas
* Women help centers

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Real-time**: Socket.io client
- **WebRTC**: Video/audio communication

### Backend
- **WebSocket Service**: Real-time lawyer-client matching
- **Database**: Prisma ORM with SQLite
- **API Routes**: RESTful endpoints
- **Authentication**: Ready for NextAuth.js integration

### Infrastructure
- **Real-time Communication**: Socket.io
- **Video/Audio**: WebRTC with STUN servers
- **Database**: SQLite (production-ready)
- **Deployment**: Docker-ready

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Bun (recommended) or npm/yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jitenkr2030/Scan4Legal.git
cd Scan4Legal
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
bun run db:push
```

5. **Start the development servers**
```bash
# Start main application
bun run dev

# Start WebSocket service (in another terminal)
cd mini-services/websocket-service
bun install
bun run dev
```

6. **Access the application**
- Main app: http://localhost:3000
- Lawyer dashboard: http://localhost:3000/lawyer
- WebSocket service: http://localhost:3003

## 📁 Project Structure

```
Scan4Legal/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   ├── call/              # Call interface
│   │   ├── lawyer/            # Lawyer dashboard
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript definitions
├── mini-services/
│   └── websocket-service/     # Real-time communication
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                    # Static assets
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="file:./db/custom.db"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# WebSocket (internal)
WEBSOCKET_PORT=3003
```

### Database Setup
The application uses Prisma with SQLite. The schema includes:
- Clients (users seeking help)
- Lawyers (legal experts)
- Cases (legal issues)
- Call Sessions (communication logs)
- Reports (generated summaries)

## 🌐 API Endpoints

### Client Endpoints
- `POST /api/call` - Create new call session
- `POST /api/report` - Generate case report
- `GET /api/report?caseId={id}` - Get case reports

### Lawyer Endpoints
- WebSocket connection on port 3003
- Real-time call matching
- Session management

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Features

- HTTPS ready for production
- Secure WebSocket connections
- Data encryption in transit
- Privacy-respecting location handling
- GDPR considerations

## 🌍 Multi-language Implementation

The platform supports 6 Indian languages:
- **English** (default)
- **हिंदी** (Hindi)
- **বাংলা** (Bengali)
- **తెలుగు** (Telugu)
- **मराठी** (Marathi)
- **தமிழ்** (Tamil)

Language detection is automatic based on browser settings, with manual override available.

## 📊 Features in Detail

### Emergency Mode
- Red alert UI with pulsing indicators
- Priority queue placement
- 30-second SLA guarantee
- Higher cost for immediate service

### Voice Interface
- Web Speech API integration
- Multi-language speech recognition
- Accessibility compliance
- Fallback text input

### Real-time Communication
- WebSocket-based lawyer matching
- WebRTC for video/audio
- Low-bandwidth optimization
- Connection quality monitoring

### Report Generation
- Automated consultation summaries
- Multi-channel delivery (WhatsApp/SMS/Email)
- Legal advice documentation
- Timestamp and duration tracking

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

### Production Setup
1. Set up reverse proxy (nginx/Caddy)
2. Configure SSL certificates
3. Set up database backups
4. Configure monitoring
5. Set up log aggregation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@scan4legal.com
- 📞 Helpline: 1800-LEGAL-HELP
- 🌐 Website: https://scan4legal.com
- 📱 WhatsApp: +91-XXXXXXXXXX

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Real-time communication by [Socket.io](https://socket.io/)
- Database by [Prisma](https://www.prisma.io/)

---

**Scan4Legal - Your right to legal help, simplified.** ⚖️

*Making legal assistance accessible to every citizen, one QR code at a time.*