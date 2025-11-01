// Healthcare Payments Contract Configuration
export const CONTRACT_ADDRESS = "0x2722376053C44a349A0F79AeEF051B4Ec3EffDFA";

// Celo Sepolia Testnet configuration
export const CELO_SEPOLIA_CONFIG = {
  chainId: "0xAA044C", // 11142220 in hex
  chainName: "Celo Sepolia Testnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  },
  rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
  blockExplorerUrls: ["https://sepolia.celoscan.io"]
};

// Contract ABI - Healthcare Payments
export const CONTRACT_ABI = [
  // Pool Management
  "function createPool(string name, string description, uint256 minContribution, uint256 maxClaimAmount) external returns (uint256)",
  "function updatePoolStatus(uint256 poolId, uint8 newStatus) external",
  "function getPool(uint256 poolId) external view returns (tuple(uint256 poolId, string name, string description, address admin, uint256 minContribution, uint256 maxClaimAmount, uint256 totalFunds, uint256 totalPaidClaims, uint256 memberCount, uint8 status, uint256 createdAt, bool exists))",
  "function getPoolMembers(uint256 poolId) external view returns (address[] memory)",
  "function getPoolClaims(uint256 poolId) external view returns (uint256[] memory)",
  
  // Member Management
  "function registerMember(string name, string contactInfo) external",
  "function joinPool(uint256 poolId) external payable",
  "function contributeToPool(uint256 poolId) external payable",
  "function exitPool(uint256 poolId) external",
  "function getMember(address memberAddress) external view returns (tuple(address memberAddress, string name, string contactInfo, uint256 totalContributed, uint256 totalClaimsReceived, uint256 claimCount, uint8 status, uint256 joinedAt, bool exists))",
  "function getMemberPools(address memberAddress) external view returns (uint256[] memory)",
  "function getMemberClaims(address memberAddress) external view returns (uint256[] memory)",
  
  // Provider Management
  "function registerProvider(string name, string licenseNumber, string specialty, string location) external",
  "function verifyProvider(address providerAddress) external",
  "function suspendProvider(address providerAddress, string reason) external",
  "function updateProviderReputation(address providerAddress, uint256 newReputation) external",
  "function getProvider(address providerAddress) external view returns (tuple(address providerAddress, string name, string licenseNumber, string specialty, string location, uint8 status, uint256 totalClaimsProcessed, uint256 totalAmountProcessed, uint256 reputation, uint256 registeredAt, bool exists))",
  "function getProviderClaims(address providerAddress) external view returns (uint256[] memory)",
  
  // Claim Management
  "function submitClaim(uint256 poolId, address provider, string diagnosis, string treatmentDescription, uint256 requestedAmount, string medicalProof) external returns (uint256)",
  "function approveClaim(uint256 claimId, uint256 approvedAmount) external",
  "function rejectClaim(uint256 claimId, string reason) external",
  "function payClaim(uint256 claimId) external",
  "function getClaim(uint256 claimId) external view returns (tuple(uint256 claimId, uint256 poolId, address member, address provider, string diagnosis, string treatmentDescription, uint256 requestedAmount, uint256 approvedAmount, uint8 status, string medicalProof, string rejectionReason, uint256 submittedAt, uint256 processedAt, address processedBy))",
  
  // Statistics and Info
  "function getStats() external view returns (uint256 totalPools, uint256 totalMembers, uint256 totalProviders, uint256 totalClaims, uint256 emergencyFund, uint256 platformFeePercent)",
  
  // Admin Functions
  "function updatePlatformFee(uint256 newFeePercent) external",
  "function withdrawEmergencyFund(uint256 amount) external",
  "function replenishEmergencyFund() external payable",
  "function owner() external view returns (address)",
  
  // Public state variables
  "function totalPools() external view returns (uint256)",
  "function totalMembers() external view returns (uint256)",
  "function totalProviders() external view returns (uint256)",
  "function totalClaims() external view returns (uint256)",
  "function platformFeePercent() external view returns (uint256)",
  "function emergencyFund() external view returns (uint256)",
  "function pools(uint256) external view returns (uint256 poolId, string name, string description, address admin, uint256 minContribution, uint256 maxClaimAmount, uint256 totalFunds, uint256 totalPaidClaims, uint256 memberCount, uint8 status, uint256 createdAt, bool exists)",
  "function members(address) external view returns (address memberAddress, string name, string contactInfo, uint256 totalContributed, uint256 totalClaimsReceived, uint256 claimCount, uint8 status, uint256 joinedAt, bool exists)",
  "function providers(address) external view returns (address providerAddress, string name, string licenseNumber, string specialty, string location, uint8 status, uint256 totalClaimsProcessed, uint256 totalAmountProcessed, uint256 reputation, uint256 registeredAt, bool exists)",
  "function claims(uint256) external view returns (uint256 claimId, uint256 poolId, address member, address provider, string diagnosis, string treatmentDescription, uint256 requestedAmount, uint256 approvedAmount, uint8 status, string medicalProof, string rejectionReason, uint256 submittedAt, uint256 processedAt, address processedBy)",
  
  // Events
  "event PoolCreated(uint256 indexed poolId, string name, address indexed admin, uint256 timestamp)",
  "event PoolStatusUpdated(uint256 indexed poolId, uint8 newStatus)",
  "event MemberRegistered(address indexed memberAddress, string name, uint256 timestamp)",
  "event MemberJoinedPool(uint256 indexed poolId, address indexed member, uint256 timestamp)",
  "event MemberExitedPool(uint256 indexed poolId, address indexed member)",
  "event ProviderRegistered(address indexed providerAddress, string name, uint256 timestamp)",
  "event ProviderVerified(address indexed providerAddress, uint256 timestamp)",
  "event ProviderSuspended(address indexed providerAddress, string reason)",
  "event ContributionMade(uint256 indexed poolId, address indexed member, uint256 amount, uint256 timestamp)",
  "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed poolId, address indexed member, address provider, uint256 requestedAmount, uint256 timestamp)",
  "event ClaimProcessed(uint256 indexed claimId, uint8 status, uint256 approvedAmount, address indexed processedBy, uint256 timestamp)",
  "event ClaimPaid(uint256 indexed claimId, address indexed member, address indexed provider, uint256 amount, uint256 timestamp)",
  "event EmergencyFundReplenished(uint256 amount, uint256 timestamp)",
  "event PlatformFeeUpdated(uint256 newFeePercent)"
];

// Pool Status
export const POOL_STATUS = {
  0: "Active",
  1: "Paused",
  2: "Closed",
  Active: 0,
  Paused: 1,
  Closed: 2
};

// Member Status
export const MEMBER_STATUS = {
  0: "Active",
  1: "Suspended",
  2: "Exited",
  Active: 0,
  Suspended: 1,
  Exited: 2
};

// Provider Status
export const PROVIDER_STATUS = {
  0: "Pending",
  1: "Verified",
  2: "Suspended",
  Pending: 0,
  Verified: 1,
  Suspended: 2
};

// Claim Status
export const CLAIM_STATUS = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Paid",
  4: "Disputed",
  Pending: 0,
  Approved: 1,
  Rejected: 2,
  Paid: 3,
  Disputed: 4
};

// Constants
export const PLATFORM_FEE_PERCENT = 2; // 2%
export const MIN_CONTRIBUTION = "0.01"; // 0.01 CELO
export const MAX_CLAIM_PERCENTAGE = 80; // 80% of pool

// Helper Functions
export const formatDate = (timestamp) => {
  if (!timestamp || timestamp === 0) return "N/A";
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatCelo = (amount) => {
  if (!amount) return "0";
  return parseFloat(amount).toFixed(4);
};

export const getPoolStatusName = (status) => {
  return POOL_STATUS[status] || "Unknown";
};

export const getMemberStatusName = (status) => {
  return MEMBER_STATUS[status] || "Unknown";
};

export const getProviderStatusName = (status) => {
  return PROVIDER_STATUS[status] || "Unknown";
};

export const getClaimStatusName = (status) => {
  return CLAIM_STATUS[status] || "Unknown";
};

export const getExplorerUrl = (address) => {
  return `${CELO_SEPOLIA_CONFIG.blockExplorerUrls[0]}/address/${address}`;
};

export const getTxUrl = (txHash) => {
  return `${CELO_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
};

export const getStatusColor = (status, type) => {
  if (type === 'pool') {
    switch(status) {
      case 0: return '#10b981'; // Active - green
      case 1: return '#f59e0b'; // Paused - amber
      case 2: return '#ef4444'; // Closed - red
      default: return '#6b7280';
    }
  } else if (type === 'provider') {
    switch(status) {
      case 0: return '#f59e0b'; // Pending - amber
      case 1: return '#10b981'; // Verified - green
      case 2: return '#ef4444'; // Suspended - red
      default: return '#6b7280';
    }
  } else if (type === 'claim') {
    switch(status) {
      case 0: return '#f59e0b'; // Pending - amber
      case 1: return '#3b82f6'; // Approved - blue
      case 2: return '#ef4444'; // Rejected - red
      case 3: return '#10b981'; // Paid - green
      case 4: return '#8b5cf6'; // Disputed - purple
      default: return '#6b7280';
    }
  }
  return '#6b7280';
};
