# FairDraw Protocol

A verifiably fair draw platform built on Base with Chainlink VRF integration and Farcaster Frame support.

## 🎯 Overview

FairDraw Protocol enables users to create and participate in transparent, on-chain draws with provable randomness. Built as a Base MiniApp with full Farcaster integration for social sharing and participation.

### Key Features

- **🎲 Verifiable Randomness**: Uses Chainlink VRF for provably fair winner selection
- **⛓️ On-Chain Transparency**: All draws and results stored immutably on Base
- **🖼️ Farcaster Frames**: Native social sharing and participation via frames
- **💰 Micro-transactions**: Low-cost entry fees powered by Base's efficiency
- **📱 Mobile-First**: Optimized for Base Wallet and mobile experiences

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Smart Contract │
│   (React/Vite)  │◄──►│   (Express)     │◄──►│   (Solidity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Farcaster      │    │   Supabase      │    │  Chainlink VRF  │
│  Frames         │    │   Database      │    │  Randomness     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Base wallet with ETH for gas fees
- Supabase account
- Chainlink VRF subscription

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/-app-development-2694.git
   cd -app-development-2694
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Run the schema in your Supabase SQL editor
   cat database/schema.sql
   ```

5. **Compile and deploy smart contracts**
   ```bash
   npm run compile
   npm run deploy:contract:testnet  # For Base Sepolia testnet
   # or
   npm run deploy:contract          # For Base mainnet
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Backend API
   npm run dev:api
   ```

## 📋 Environment Configuration

### Required Environment Variables

```bash
# Application
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME=FairDraw Protocol

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key

# Chainlink VRF
VRF_SUBSCRIPTION_ID=your_subscription_id
VRF_COORDINATOR_BASE=0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API
PORT=3001
NODE_ENV=production
```

### Setting up Chainlink VRF

1. Visit [vrf.chain.link/base](https://vrf.chain.link/base)
2. Create a new subscription
3. Fund it with LINK tokens
4. Add your deployed contract as a consumer
5. Update `VRF_SUBSCRIPTION_ID` in your environment

## 🔧 Smart Contract Deployment

### Base Sepolia (Testnet)

```bash
# Deploy to testnet
npm run deploy:contract:testnet

# Verify contract (optional)
npx hardhat verify --network base-sepolia DEPLOYED_CONTRACT_ADDRESS SUBSCRIPTION_ID VRF_COORDINATOR_ADDRESS
```

### Base Mainnet

```bash
# Deploy to mainnet
npm run deploy:contract

# Verify contract
npx hardhat verify --network base DEPLOYED_CONTRACT_ADDRESS SUBSCRIPTION_ID VRF_COORDINATOR_ADDRESS
```

## 🖼️ Farcaster Frame Integration

### Frame Endpoints

- `GET /api/frames/image/:action` - Generate frame images
- `POST /api/frames/action` - Handle frame interactions
- `GET /api/frames/image/draw/:drawId` - Draw-specific images

### Frame Actions

- **view_draws**: Browse active draws
- **join_draw**: Participate in a specific draw
- **create_draw**: Redirect to draw creation
- **view_results**: Display draw results

### Sharing Draws

```javascript
import { generateDrawCastText, generateDrawShareUrl } from './src/frames/index.js';

const draw = { /* draw data */ };
const castText = generateDrawCastText(draw);
const shareUrl = generateDrawShareUrl(draw.drawId);
```

## 🗄️ Database Schema

The application uses Supabase with the following main tables:

- **draws**: Store draw information from smart contracts
- **participants**: User wallet addresses and Farcaster IDs
- **participations**: Individual participation records

### Key Views

- **draw_stats**: Aggregated draw statistics
- **user_stats**: User participation and win statistics
- **platform_stats**: Overall platform metrics

## 🔌 API Endpoints

### Draws
- `GET /api/draws` - List draws with pagination
- `GET /api/draws/:drawId` - Get specific draw details
- `GET /api/draws/:drawId/participants` - Get draw participants

### Users
- `GET /api/users/:address/draws` - User's created draws
- `GET /api/users/:address/participations` - User's participations

### Statistics
- `GET /api/stats` - Platform statistics

### Webhooks
- `POST /api/webhooks/blockchain` - Blockchain event webhooks

## 🎨 Frontend Components

### Core Components

- **AppShell**: Main application layout
- **DrawCard**: Display draw information
- **CreateDrawForm**: Draw creation interface
- **ParticipantEntryForm**: Join draw interface
- **WinnerDisplay**: Show draw results
- **SocialShareButton**: Share functionality

### Hooks

- **useFairDrawContract**: Smart contract interactions
- **usePaymentContext**: Payment processing

## 🔐 Security Considerations

### Smart Contract Security

- Uses OpenZeppelin contracts for security
- Chainlink VRF for verifiable randomness
- Reentrancy protection
- Access control for admin functions

### API Security

- CORS configuration
- Input validation
- Rate limiting (recommended)
- Environment variable protection

### Database Security

- Row Level Security (RLS) enabled
- Proper authentication policies
- Encrypted connections

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Connect your repository
2. Set environment variables
3. Deploy with build command: `npm run build`

### Backend (Railway/Render)

1. Connect your repository
2. Set environment variables
3. Deploy with start command: `npm run api`

### Database (Supabase)

1. Create new project
2. Run schema from `database/schema.sql`
3. Configure RLS policies
4. Set up authentication

## 📊 Monitoring & Analytics

### Recommended Tools

- **Sentry**: Error tracking
- **Mixpanel/PostHog**: User analytics
- **Grafana**: Infrastructure monitoring
- **Supabase Analytics**: Database insights

## 🧪 Testing

```bash
# Run smart contract tests
npm run test

# Frontend testing (add your preferred testing framework)
# npm run test:frontend

# API testing (add your preferred testing framework)  
# npm run test:api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Community**: Join our Discord/Telegram for discussions

## 🔗 Links

- **Live App**: https://fairdraw.vistara.dev
- **Smart Contract**: [View on Basescan](https://basescan.org/address/CONTRACT_ADDRESS)
- **Farcaster**: Share draws in your casts
- **Base**: Built on Base for low-cost transactions

---

Built with ❤️ for the Base ecosystem and Farcaster community.
