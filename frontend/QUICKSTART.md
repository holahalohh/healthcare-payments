# 🚀 Healthcare Payments Frontend - Quick Start

Get started with the Healthcare Payments DApp frontend in 3 minutes!

## 📋 Prerequisites

Before you begin:
- ✅ Node.js v18+ installed
- ✅ MetaMask browser extension
- ✅ Celo Sepolia testnet CELO

## 🔧 Setup Steps

### Step 1: Install Dependencies

```bash
cd /home/hieu/celo_prs/healthcare-payments/frontend
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3008**

### Step 3: Configure MetaMask

#### Option A: Auto-Configuration (Recommended)
1. Click "Connect Wallet" in the app
2. App will automatically prompt to add/switch to Celo Sepolia
3. Approve in MetaMask

#### Option B: Manual Configuration
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter these details:
   ```
   Network Name: Celo Sepolia Testnet
   RPC URL: https://forno.celo-sepolia.celo-testnet.org
   Chain ID: 11142220
   Currency Symbol: CELO
   Block Explorer: https://sepolia.celoscan.io
   ```
4. Click "Save"

### Step 4: Get Testnet CELO

Visit: https://faucet.celo.org/sepolia
1. Enter your wallet address
2. Complete CAPTCHA
3. Receive testnet CELO (~1-2 minutes)

## 🎯 First Actions

### As a Member (Patient)

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve MetaMask connection

2. **Register**
   - Go to "Member" tab
   - Fill in name and contact
   - Submit transaction

3. **Join a Pool**
   - Check Dashboard for available pools
   - Note a Pool ID
   - Go to "Join a Pool" section
   - Enter Pool ID and contribution (min 0.01 CELO)
   - Confirm transaction

4. **Submit a Claim** (when needed)
   - Go to "Submit Medical Claim"
   - Enter pool ID and provider address
   - Fill in medical details
   - Add IPFS proof hash
   - Submit claim

### As a Provider (Medical Professional)

1. **Connect Wallet**
   - Connect your MetaMask

2. **Register as Provider**
   - Go to "Provider" tab
   - Enter your details:
     - Name: "Dr. John Smith"
     - License: "MD123456"
     - Specialty: "General Medicine"
     - Location: "New York, NY"
   - Submit registration

3. **Wait for Verification**
   - Status will show "Pending"
   - Platform owner must verify you

4. **Receive Payments** (after verification)
   - View "My Claims" section
   - Click "Receive Payment" on approved claims
   - Funds sent to your wallet

### As a Pool Creator

1. **Register as Member** (if not already)
   - Complete member registration

2. **Create Pool**
   - Go to "Create Healthcare Pool"
   - Enter details:
     - Name: "Community Health Fund"
     - Description: "For our community"
     - Min Contribution: 0.1 CELO
     - Max Claim: 10 CELO
   - Submit transaction

3. **Manage Claims** (Pool Admin tab)
   - Review pending claims
   - Approve/reject with reasons
   - Monitor pool statistics

## 📱 Interface Navigation

```
🏠 Dashboard
   ├─ Platform Statistics
   ├─ Your Profile (if registered)
   └─ Available Pools

👤 Member
   ├─ Register as Member
   ├─ Create Pool
   ├─ Join Pool
   ├─ Contribute to Pool
   ├─ Submit Claim
   ├─ My Pools
   └─ My Claims

👨‍⚕️ Provider
   ├─ Register as Provider
   ├─ Verification Status
   └─ My Claims (with payment options)

⚙️ Pool Admin (if you created pools)
   ├─ Your Pools
   ├─ Pending Claims
   └─ Approve/Reject Claims

👑 Owner (if you're contract owner)
   └─ Verify Providers
```

## 💡 Quick Tips

### For Members
- ✅ Join pools before submitting claims
- ✅ Keep IPFS proof of medical treatments
- ✅ Check claim status regularly
- ✅ Contribute regularly to maintain coverage

### For Providers
- ✅ Ensure license info is accurate
- ✅ Wait for owner verification
- ✅ Only work with verified pool members
- ✅ Collect payment after claims are approved

### For Pool Admins
- ✅ Review medical proof carefully
- ✅ Verify provider is legitimate
- ✅ Approved amount can be less than requested
- ✅ Provide clear rejection reasons

## 🎨 Features at a Glance

| Feature | Description | Tab |
|---------|-------------|-----|
| 📊 Statistics | Platform overview | Dashboard |
| 🏥 Browse Pools | View all healthcare pools | Dashboard |
| 👤 Member Registration | Register as patient | Member |
| 🏗️ Create Pool | Start new healthcare pool | Member |
| 💰 Join Pool | Join with contribution | Member |
| 📋 Submit Claim | Request medical reimbursement | Member |
| 👨‍⚕️ Provider Registration | Register as medical provider | Provider |
| 💵 Receive Payment | Get paid for approved claims | Provider |
| ✅ Approve Claims | Review and approve claims | Pool Admin |
| ❌ Reject Claims | Reject invalid claims | Pool Admin |
| 🔐 Verify Providers | Verify medical professionals | Owner |

## 🔗 Contract Information

```javascript
Contract Address: 0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA
Network: Celo Sepolia Testnet (Chain ID: 11142220)
Platform Fee: 2% on contributions
Min Contribution: 0.01 CELO
Max Claim: 80% of pool funds
```

## 🐛 Common Issues & Solutions

### Issue: "Please install MetaMask"
**Solution**: Install MetaMask extension from https://metamask.io

### Issue: "Wrong network"
**Solution**: App will prompt to switch. Click "Switch Network" in MetaMask

### Issue: "Insufficient funds"
**Solution**: Get testnet CELO from https://faucet.celo.org/sepolia

### Issue: "Transaction failed"
**Solution**: Check you have enough CELO for gas fees (~0.001 CELO)

### Issue: "Not registered as member"
**Solution**: Complete member registration in Member tab first

### Issue: "Provider not verified"
**Solution**: Contact platform owner to verify your provider account

## 📞 Need Help?

1. **Check the full README**: `frontend/README.md`
2. **Review contract docs**: `../README.md`
3. **Inspect browser console**: Press F12 for error details
4. **Check MetaMask**: Ensure proper network and balance

## 🚀 Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Output will be in `dist/` folder, ready for deployment.

## 🎉 You're Ready!

Open http://localhost:3008 and start using the Healthcare Payments DApp!

### Test Workflow

1. Connect wallet
2. Register as member
3. Create a test pool or join existing one
4. (Optional) Register as provider for testing
5. Submit a test claim
6. As pool admin, approve/reject the claim
7. As provider, receive payment

---

**Enjoy using Healthcare Payments DApp! 🏥💙**

*For detailed documentation, see README.md*
