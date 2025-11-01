# Healthcare Payments DApp

A decentralized healthcare payment pooling and claims management system built on the Celo blockchain.

## 🌟 Overview

Healthcare Payments enables communities to create healthcare funding pools where members contribute funds and receive coverage for medical expenses. The platform facilitates transparent claims processing through verified medical providers with built-in governance and security features.

## ✨ Key Features

### 🏥 Healthcare Pool Management
- Create community healthcare funding pools
- Set minimum contribution and maximum claim limits
- Pool admins manage membership and claims
- Track pool funds, members, and claim history
- Pause or close pools when needed

### 👥 Member Registration & Contributions
- Register as a patient/member
- Join multiple healthcare pools
- Make initial and ongoing contributions
- Track contribution history and claims received
- Exit pools when no pending claims

### 🏨 Medical Provider System
- Register as a verified medical provider
- Submit license and specialty information
- Owner verification required before providing services
- Reputation system (0-1000 score)
- Track services provided and payments received

### 📝 Claims Processing
- Submit claims with diagnosis, treatment, and IPFS medical proof
- Pool admins review and approve/reject claims
- Approved claims paid directly to verified providers
- Complete claim lifecycle tracking
- Dispute resolution capability

### 💰 Financial Features
- 2% platform fee on all contributions
- Emergency fund from accumulated fees
- Transparent fund tracking per pool
- Maximum claim limits (80% of pool funds)
- ReentrancyGuard protection on payments

### 🔒 Security & Governance
- Owner controls for provider verification
- Pool admin permissions for claim management
- Minimum contribution requirements (0.01 CELO)
- Member suspension capability
- Provider suspension for fraud prevention

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- Hardhat
- Celo wallet with testnet CELO

### Installation

```bash
# Clone the repository
cd healthcare-payments

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your mnemonic to .env
MNEMONIC="your twelve word mnemonic phrase here"
```

### Compile Contract

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy to Celo Sepolia

```bash
npm run deploy:sepolia
```

## 📖 Contract Architecture

### Main Roles

1. **Owner**: Platform administrator
   - Verify/suspend medical providers
   - Update platform fees (max 5%)
   - Manage emergency fund
   - Emergency pool management

2. **Pool Admin**: Healthcare pool creator
   - Approve/reject claims
   - Update pool status
   - Manage pool settings

3. **Members**: Patients/Contributors
   - Join pools and contribute
   - Submit medical claims
   - Receive claim payments

4. **Medical Providers**: Verified healthcare professionals
   - Receive payments for approved claims
   - Build reputation through successful claims
   - Must be verified by owner

### Key Structs

```solidity
struct HealthcarePool {
    uint256 poolId;
    string name;
    address admin;
    uint256 minContribution;
    uint256 maxClaimAmount;
    uint256 totalFunds;
    uint256 memberCount;
    PoolStatus status;
}

struct Member {
    address memberAddress;
    string name;
    string contactInfo;
    uint256 totalContributed;
    uint256 totalClaimsReceived;
    uint256 claimCount;
    MemberStatus status;
}

struct MedicalProvider {
    address providerAddress;
    string name;
    string licenseNumber;
    string specialty;
    string location;
    ProviderStatus status;
    uint256 reputation;
}

struct Claim {
    uint256 claimId;
    uint256 poolId;
    address member;
    address provider;
    string diagnosis;
    string treatment;
    uint256 claimedAmount;
    uint256 approvedAmount;
    ClaimStatus status;
    string ipfsMedicalProof;
}
```

### State Machine

```
Pool Status:   Active → Paused → Closed
Member Status: Active → Suspended → Exited
Provider Status: Pending → Verified → Suspended
Claim Status:  Pending → Approved/Rejected → Paid/Disputed
```

## 🔧 Core Functions

### Member Functions

```javascript
// Register as a member
await healthcarePayments.registerMember("John Doe", "john@example.com");

// Join a pool with initial contribution
await healthcarePayments.joinPool(poolId, { 
  value: ethers.parseEther("1.0") 
});

// Make additional contributions
await healthcarePayments.contributeToPool(poolId, { 
  value: ethers.parseEther("0.5") 
});

// Submit a medical claim
await healthcarePayments.submitClaim(
  poolId,
  providerAddress,
  "Flu",
  "Medication and consultation",
  ethers.parseEther("0.3"),
  "ipfs://QmXXX..."
);

// Exit a pool (if no pending claims)
await healthcarePayments.exitPool(poolId);
```

### Pool Admin Functions

```javascript
// Create a healthcare pool
await healthcarePayments.createPool(
  "Community Health Pool",
  ethers.parseEther("0.1"),  // min contribution
  ethers.parseEther("10")     // max claim amount
);

// Approve a claim
await healthcarePayments.approveClaim(
  claimId,
  ethers.parseEther("0.25")  // approved amount
);

// Reject a claim
await healthcarePayments.rejectClaim(
  claimId,
  "Insufficient medical documentation"
);

// Update pool status
await healthcarePayments.updatePoolStatus(poolId, 1); // 1 = Paused
```

### Provider Functions

```javascript
// Register as a medical provider
await healthcarePayments.registerProvider(
  "Dr. Jane Smith",
  "MD123456",
  "General Medicine",
  "New York, NY"
);

// Receive payment for approved claim
await healthcarePayments.payClaim(claimId);
```

### Owner Functions

```javascript
// Verify a medical provider
await healthcarePayments.verifyProvider(providerAddress);

// Suspend a fraudulent provider
await healthcarePayments.suspendProvider(providerAddress);

// Update provider reputation
await healthcarePayments.updateProviderReputation(
  providerAddress,
  850  // reputation score 0-1000
);

// Update platform fee (max 5%)
await healthcarePayments.updatePlatformFee(150); // 1.5%

// Withdraw emergency fund
await healthcarePayments.withdrawEmergencyFund(
  ethers.parseEther("10")
);

// Replenish emergency fund
await healthcarePayments.replenishEmergencyFund({ 
  value: ethers.parseEther("5") 
});
```

### View Functions

```javascript
// Get contract statistics
const [totalPools, totalMembers, totalProviders, totalClaims, emergencyFund] 
  = await healthcarePayments.getStats();

// Get pool details
const pool = await healthcarePayments.getPool(poolId);

// Get pool members
const members = await healthcarePayments.getPoolMembers(poolId);

// Get pool claims
const claims = await healthcarePayments.getPoolClaims(poolId);

// Get member details
const member = await healthcarePayments.getMember(memberAddress);

// Get member's pools
const memberPools = await healthcarePayments.getMemberPools(memberAddress);

// Get member's claims
const memberClaims = await healthcarePayments.getMemberClaims(memberAddress);

// Get provider details
const provider = await healthcarePayments.getProvider(providerAddress);

// Get provider's claims
const providerClaims = await healthcarePayments.getProviderClaims(providerAddress);

// Get claim details
const claim = await healthcarePayments.getClaim(claimId);
```

## 💡 Usage Examples

### Example 1: Creating a Community Health Pool

```javascript
const { ethers } = require("hardhat");

async function createHealthPool() {
  const [admin] = await ethers.getSigners();
  const healthcarePayments = await ethers.getContractAt(
    "HealthcarePayments",
    "0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA"
  );

  // Create pool
  const tx = await healthcarePayments.createPool(
    "Village Health Fund",
    ethers.parseEther("0.05"),  // 0.05 CELO minimum
    ethers.parseEther("5")      // 5 CELO max claim
  );
  
  const receipt = await tx.wait();
  console.log(`Pool created! Gas used: ${receipt.gasUsed}`);
}
```

### Example 2: Member Claims Process

```javascript
async function submitAndProcessClaim() {
  const healthcarePayments = await ethers.getContractAt(
    "HealthcarePayments",
    "0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA"
  );

  // Member submits claim
  const tx1 = await healthcarePayments.submitClaim(
    1,  // poolId
    "0xProviderAddress...",
    "Broken Arm",
    "X-ray and cast",
    ethers.parseEther("0.8"),
    "ipfs://QmMedicalRecords..."
  );
  await tx1.wait();

  // Pool admin reviews and approves
  const tx2 = await healthcarePayments.approveClaim(
    1,  // claimId
    ethers.parseEther("0.75")  // approved amount
  );
  await tx2.wait();

  // Provider receives payment
  const tx3 = await healthcarePayments.payClaim(1);
  await tx3.wait();

  console.log("Claim processed successfully!");
}
```

### Example 3: Provider Verification Workflow

```javascript
async function verifyProvider() {
  const [owner] = await ethers.getSigners();
  const healthcarePayments = await ethers.getContractAt(
    "HealthcarePayments",
    "0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA"
  );

  const providerAddress = "0xProviderAddress...";

  // Verify provider
  const tx1 = await healthcarePayments.verifyProvider(providerAddress);
  await tx1.wait();

  // Set initial reputation
  const tx2 = await healthcarePayments.updateProviderReputation(
    providerAddress,
    750  // Good standing
  );
  await tx2.wait();

  console.log("Provider verified and reputation set!");
}
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test
```

### Test Coverage

- ✅ Deployment and initialization
- ✅ Member registration and management
- ✅ Provider registration and verification
- ✅ Pool creation and management
- ✅ Contributions and fee handling
- ✅ Claims submission and processing
- ✅ Payment distribution
- ✅ Admin functions
- ✅ View functions
- ✅ Access control
- ✅ Edge cases and error conditions

### Gas Usage Report

```
Member Registration:    ~169k gas
Provider Registration:  ~235k gas
Pool Creation:          ~236k gas
Join Pool:              ~306k gas
Submit Claim:           ~438k gas
Approve Claim:          ~124k gas
Pay Claim:              ~147k gas
```

## 🔐 Security Features

### Smart Contract Security

- **OpenZeppelin Contracts**: Using audited implementations
- **ReentrancyGuard**: Protection on payment functions
- **Access Control**: Owner and admin modifiers
- **Input Validation**: Comprehensive checks on all inputs
- **Fund Safety**: Pool fund sufficiency checks
- **Provider Verification**: Required for claim processing

### Best Practices

- Minimum contribution requirements
- Maximum claim percentage limits
- Platform fee caps (5% maximum)
- Emergency fund for critical situations
- Member and provider suspension capabilities

## 📊 Economic Model

### Platform Fees

- **Rate**: 2% on all contributions
- **Collection**: Automatic deduction on pool joins and contributions
- **Usage**: Emergency fund for platform sustainability
- **Adjustable**: Owner can update (max 5%)

### Pool Economics

- Members pool funds together
- Minimum contribution enforced
- Claims limited to 80% of pool funds
- Transparent fund tracking
- No hidden fees

### Provider Reputation

- Score range: 0-1000
- Improved through successful claims
- Visible to pool admins
- Impacts trust and selection

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- Healthcare pool creation
- Member and provider registration
- Claims processing system
- Platform fee mechanism

### Phase 2: Enhanced Features 🚧
- Frontend web application
- IPFS integration for medical records
- Multi-signature approvals for large claims
- Automated claim verification (oracles)

### Phase 3: Advanced Features 📋
- Cross-pool claim sharing
- Insurance provider integration
- Pharmaceutical partnerships
- Health metrics tracking

### Phase 4: Scaling 📋
- Layer 2 integration
- Multi-chain deployment
- Mobile application
- Provider marketplace

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For questions or issues:

- Open an issue on GitHub
- Check the documentation
- Review existing test cases for examples
