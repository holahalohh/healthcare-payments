# Healthcare Payments Frontend

A modern React frontend for the Healthcare Payments DApp on Celo blockchain.

## 🌟 Features

### 👤 Member Features
- Register as a member
- Create healthcare pools
- Join existing pools
- Make contributions to pools
- Submit medical claims with IPFS proof
- Track your pools and claims
- View claim status and history

### 👨‍⚕️ Provider Features
- Register as a medical provider
- Wait for owner verification
- View assigned claims
- Receive payments for approved claims
- Track earnings and reputation

### ⚙️ Pool Admin Features
- Review pending claims
- Approve/reject claims with reasons
- Monitor pool statistics
- Manage pool status

### 👑 Owner Features
- Verify medical providers
- Update platform fees
- Manage emergency fund
- Monitor platform statistics

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- MetaMask browser extension
- Celo Sepolia testnet CELO ([Get from faucet](https://faucet.celo.org/sepolia))

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3008`

### Building for Production

```bash
npm run build
npm run preview
```

## 🔧 Configuration

The contract configuration is in `src/config.js`:

```javascript
export const CONTRACT_ADDRESS = "0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA";
export const CELO_SEPOLIA_CONFIG = {
  chainId: "0xAA044C", // 11142220
  chainName: "Celo Sepolia Testnet",
  // ... more config
};
```

## 📱 MetaMask Setup

### Add Celo Sepolia Network

1. Click MetaMask extension
2. Click network dropdown
3. Click "Add Network"
4. Enter network details:
   - **Network Name**: Celo Sepolia Testnet
   - **RPC URL**: `https://forno.celo-sepolia.celo-testnet.org`
   - **Chain ID**: `11142220`
   - **Currency Symbol**: CELO
   - **Block Explorer**: `https://sepolia.celoscan.io`

Or the frontend will automatically prompt you to add/switch networks when connecting.

### Get Testnet CELO

Visit the [Celo Faucet](https://faucet.celo.org/sepolia) and request testnet CELO.

## 🎯 User Workflows

### Member Workflow

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Switch to Celo Sepolia if needed

2. **Register as Member**
   - Go to "Member" tab
   - Fill in your name and contact info
   - Submit registration transaction

3. **Join a Pool**
   - Browse available pools in Dashboard
   - Note the Pool ID
   - Go to "Join a Pool" section
   - Enter Pool ID and contribution amount
   - Confirm transaction

4. **Submit a Claim**
   - Go to "Submit Medical Claim" section
   - Enter pool ID and verified provider address
   - Fill in diagnosis and treatment details
   - Provide requested amount and IPFS medical proof
   - Submit claim transaction

5. **Track Claims**
   - View "My Claims" section
   - Check claim status (Pending/Approved/Rejected/Paid)
   - See approved amounts and timestamps

### Provider Workflow

1. **Connect Wallet**
   - Connect your MetaMask wallet

2. **Register as Provider**
   - Go to "Provider" tab
   - Fill in provider details:
     - Name
     - Medical license number
     - Specialty
     - Location
   - Submit registration

3. **Wait for Verification**
   - Status will show "Pending"
   - Platform owner must verify your credentials

4. **Receive Payments**
   - Once verified, view "My Claims" section
   - Claims with "Approved" status can be paid
   - Click "Receive Payment" button
   - Funds transferred to your wallet

### Pool Admin Workflow

1. **Create a Pool** (as Member)
   - Register as member first
   - Go to "Create Healthcare Pool"
   - Set pool parameters
   - Submit transaction

2. **Review Claims**
   - Go to "Pool Admin" tab
   - View pending claims for your pools
   - Check medical proof (IPFS link)
   - Review diagnosis and treatment

3. **Approve/Reject Claims**
   - Click "Approve" to approve a claim
     - Enter approved amount (can be less than requested)
   - Click "Reject" to reject a claim
     - Provide rejection reason
   - Transaction will update claim status

### Owner Workflow

1. **Verify Providers**
   - Go to "Owner" tab
   - Enter provider wallet address
   - Click "Verify Provider"
   - Provider can now receive payments

2. **Monitor Platform**
   - View platform statistics in Dashboard
   - Track total pools, members, providers, claims
   - Monitor emergency fund balance

## 🎨 Interface Overview

### Dashboard Tab
- Platform statistics
- Your member/provider profile
- Available healthcare pools
- Quick overview of the platform

### Member Tab
- Member registration (if not registered)
- Create healthcare pool
- Join existing pools
- Make contributions
- Submit medical claims
- View your pools and claims

### Provider Tab
- Provider registration (if not registered)
- View verification status
- List of your claims
- Receive payment for approved claims

### Pool Admin Tab
- Shows if you administer any pools
- Review pending claims
- Approve or reject claims
- Monitor pool statistics

### Owner Tab
- Platform owner controls
- Verify medical providers
- Additional admin functions

## 🔍 Technical Details

### Tech Stack

- **React 18.2**: UI framework
- **Vite 5.4**: Build tool and dev server
- **ethers.js 6.13**: Ethereum library for blockchain interaction
- **CSS3**: Custom styling with gradients and animations

### Key Components

- `App.jsx`: Main application component with all functionality
- `config.js`: Contract configuration, ABI, and helper functions
- `App.css`: Complete styling for the application

### State Management

- React hooks (`useState`, `useEffect`)
- Local state for wallet connection
- Contract data loaded on connection
- Auto-refresh after transactions

### Web3 Integration

- MetaMask connection via `window.ethereum`
- Ethers.js for contract interactions
- Network detection and switching
- Transaction status tracking

## 🔐 Security Features

- Wallet connection required for all actions
- Network verification (Celo Sepolia only)
- Transaction confirmation prompts
- Error handling and user feedback
- Read-only functions for public data

## 📊 Contract Interactions

### Read Functions
- `getStats()`: Platform statistics
- `getPool()`: Pool details
- `getMember()`: Member information
- `getProvider()`: Provider information
- `getClaim()`: Claim details
- Various list functions for pools, claims, etc.

### Write Functions (Transactions)
- `registerMember()`: Register as member
- `registerProvider()`: Register as provider
- `createPool()`: Create healthcare pool
- `joinPool()`: Join pool with contribution
- `contributeToPool()`: Add more funds
- `submitClaim()`: Submit medical claim
- `approveClaim()`: Approve claim (admin)
- `rejectClaim()`: Reject claim (admin)
- `payClaim()`: Receive payment (provider)
- `verifyProvider()`: Verify provider (owner)

## 🎯 IPFS Integration

The frontend supports IPFS hashes for medical proof:

1. Upload medical documents to IPFS
2. Get the IPFS hash (e.g., `ipfs://QmXXX...`)
3. Include hash when submitting claim
4. Reviewers can view proof via IPFS link

**IPFS Hosting Options:**
- [Pinata](https://pinata.cloud)
- [NFT.Storage](https://nft.storage)
- [Web3.Storage](https://web3.storage)
- Local IPFS node

## 🐛 Troubleshooting

### MetaMask Issues

**Problem**: Can't connect wallet  
**Solution**: Make sure MetaMask is installed and unlocked

**Problem**: Wrong network  
**Solution**: Frontend will prompt to switch to Celo Sepolia

**Problem**: Transaction rejected  
**Solution**: Check you have enough CELO for gas fees

### Transaction Errors

**Problem**: "Not registered as member"  
**Solution**: Register as member first in Member tab

**Problem**: "Provider not verified"  
**Solution**: Provider must be verified by owner before participating

**Problem**: "Insufficient pool funds"  
**Solution**: Pool needs more contributions or reduce claim amount

**Problem**: "Below minimum contribution"  
**Solution**: Increase contribution (minimum 0.01 CELO)

### Loading Issues

**Problem**: Data not loading  
**Solution**: Click the "Refresh" button or reload page

**Problem**: Pools not showing  
**Solution**: Ensure you're connected to correct network

## 📱 Mobile Responsiveness

The frontend is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Edge, Safari)
- Tablet devices
- Mobile browsers with MetaMask mobile app

## 🔗 Important Links

- **Contract**: [0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA](https://sepolia.celoscan.io/address/0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA)
- **Celo Faucet**: https://faucet.celo.org/sepolia
- **Celo Docs**: https://docs.celo.org
- **Block Explorer**: https://sepolia.celoscan.io

## 🚀 Deployment

### Deploy to Vercel

```bash
npm run build
# Deploy dist folder to Vercel
```

### Deploy to Netlify

```bash
npm run build
# Deploy dist folder to Netlify
```

### Deploy to IPFS

```bash
npm run build
# Upload dist folder to IPFS
```

## 📝 Environment Variables

No environment variables needed! All configuration is in `src/config.js`.

## 🎉 Features Highlights

✅ MetaMask integration with auto network switching  
✅ Real-time contract data loading  
✅ Transaction status notifications  
✅ Responsive design for all devices  
✅ Role-based UI (Member/Provider/Admin/Owner)  
✅ Complete healthcare pool lifecycle  
✅ Claims management workflow  
✅ IPFS medical proof support  
✅ Interactive pool browsing  
✅ Detailed statistics dashboard  

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review the user workflows
- Inspect browser console for errors
- Ensure MetaMask is properly configured

## 📄 License

MIT License - Feel free to use and modify

---

**Built with ❤️ for Celo Healthcare Payments DApp**
