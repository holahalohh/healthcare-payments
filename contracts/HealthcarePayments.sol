// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HealthcarePayments
 * @dev Decentralized healthcare payment pooling and claims management on Celo
 * @notice Enables communities to pool funds for medical expenses and process claims transparently
 */
contract HealthcarePayments is Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    uint256 public totalPools;
    uint256 public totalMembers;
    uint256 public totalProviders;
    uint256 public totalClaims;
    
    uint256 public platformFeePercent = 200; // 2% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_CONTRIBUTION = 0.01 ether;
    uint256 public constant MAX_CLAIM_PERCENTAGE = 8000; // 80% of pool
    
    // ============ Enums ============
    
    enum PoolStatus { Active, Paused, Closed }
    enum ClaimStatus { Pending, Approved, Rejected, Paid, Disputed }
    enum ProviderStatus { Pending, Verified, Suspended }
    enum MemberStatus { Active, Suspended, Exited }
    
    // ============ Structs ============
    
    struct HealthcarePool {
        uint256 poolId;
        string name;
        string description;
        address admin;
        uint256 minContribution;
        uint256 maxClaimAmount;
        uint256 totalFunds;
        uint256 totalPaidClaims;
        uint256 memberCount;
        PoolStatus status;
        uint256 createdAt;
        bool exists;
    }
    
    struct Member {
        address memberAddress;
        string name;
        string contactInfo;
        uint256 totalContributed;
        uint256 totalClaimsReceived;
        uint256 claimCount;
        MemberStatus status;
        uint256 joinedAt;
        bool exists;
    }
    
    struct MedicalProvider {
        address providerAddress;
        string name;
        string licenseNumber;
        string specialty;
        string location;
        ProviderStatus status;
        uint256 totalClaimsProcessed;
        uint256 totalAmountProcessed;
        uint256 reputation; // 0-1000
        uint256 registeredAt;
        bool exists;
    }
    
    struct Claim {
        uint256 claimId;
        uint256 poolId;
        address member;
        address provider;
        string diagnosis;
        string treatmentDescription;
        uint256 requestedAmount;
        uint256 approvedAmount;
        ClaimStatus status;
        string medicalProof; // IPFS hash
        string rejectionReason;
        uint256 submittedAt;
        uint256 processedAt;
        address processedBy;
    }
    
    struct PoolMember {
        address memberAddress;
        uint256 totalContributed;
        uint256 lastContributionAt;
        bool isActive;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => HealthcarePool) public pools;
    mapping(address => Member) public members;
    mapping(address => MedicalProvider) public providers;
    mapping(uint256 => Claim) public claims;
    
    // Pool-specific mappings
    mapping(uint256 => mapping(address => PoolMember)) public poolMembers;
    mapping(uint256 => address[]) public poolMembersList;
    mapping(uint256 => uint256[]) public poolClaims;
    mapping(address => uint256[]) public memberPools;
    mapping(address => uint256[]) public memberClaims;
    mapping(address => uint256[]) public providerClaims;
    
    // Emergency fund
    uint256 public emergencyFund;
    
    // ============ Events ============
    
    event PoolCreated(uint256 indexed poolId, string name, address indexed admin, uint256 timestamp);
    event PoolStatusUpdated(uint256 indexed poolId, PoolStatus newStatus);
    
    event MemberRegistered(address indexed memberAddress, string name, uint256 timestamp);
    event MemberJoinedPool(uint256 indexed poolId, address indexed member, uint256 timestamp);
    event MemberExitedPool(uint256 indexed poolId, address indexed member);
    
    event ProviderRegistered(address indexed providerAddress, string name, uint256 timestamp);
    event ProviderVerified(address indexed providerAddress, uint256 timestamp);
    event ProviderSuspended(address indexed providerAddress, string reason);
    
    event ContributionMade(
        uint256 indexed poolId, 
        address indexed member, 
        uint256 amount, 
        uint256 timestamp
    );
    
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed poolId,
        address indexed member,
        address provider,
        uint256 requestedAmount,
        uint256 timestamp
    );
    
    event ClaimProcessed(
        uint256 indexed claimId,
        ClaimStatus status,
        uint256 approvedAmount,
        address indexed processedBy,
        uint256 timestamp
    );
    
    event ClaimPaid(
        uint256 indexed claimId,
        address indexed member,
        address indexed provider,
        uint256 amount,
        uint256 timestamp
    );
    
    event EmergencyFundReplenished(uint256 amount, uint256 timestamp);
    event PlatformFeeUpdated(uint256 newFeePercent);
    
    // ============ Modifiers ============
    
    modifier onlyPoolAdmin(uint256 _poolId) {
        require(pools[_poolId].exists, "Pool does not exist");
        require(pools[_poolId].admin == msg.sender || owner() == msg.sender, "Not pool admin");
        _;
    }
    
    modifier onlyActiveMember() {
        require(members[msg.sender].exists, "Not registered as member");
        require(members[msg.sender].status == MemberStatus.Active, "Member not active");
        _;
    }
    
    modifier onlyVerifiedProvider() {
        require(providers[msg.sender].exists, "Not registered as provider");
        require(providers[msg.sender].status == ProviderStatus.Verified, "Provider not verified");
        _;
    }
    
    modifier poolExists(uint256 _poolId) {
        require(pools[_poolId].exists, "Pool does not exist");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Initialize contract
    }
    
    // ============ Pool Management Functions ============
    
    /**
     * @dev Create a new healthcare pool
     */
    function createPool(
        string memory _name,
        string memory _description,
        uint256 _minContribution,
        uint256 _maxClaimAmount
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(_minContribution >= MIN_CONTRIBUTION, "Contribution too low");
        require(_maxClaimAmount > 0, "Max claim amount required");
        
        totalPools++;
        
        pools[totalPools] = HealthcarePool({
            poolId: totalPools,
            name: _name,
            description: _description,
            admin: msg.sender,
            minContribution: _minContribution,
            maxClaimAmount: _maxClaimAmount,
            totalFunds: 0,
            totalPaidClaims: 0,
            memberCount: 0,
            status: PoolStatus.Active,
            createdAt: block.timestamp,
            exists: true
        });
        
        emit PoolCreated(totalPools, _name, msg.sender, block.timestamp);
        
        return totalPools;
    }
    
    /**
     * @dev Update pool status
     */
    function updatePoolStatus(uint256 _poolId, PoolStatus _newStatus) 
        external 
        onlyPoolAdmin(_poolId) 
    {
        pools[_poolId].status = _newStatus;
        emit PoolStatusUpdated(_poolId, _newStatus);
    }
    
    // ============ Member Functions ============
    
    /**
     * @dev Register as a member
     */
    function registerMember(string memory _name, string memory _contactInfo) external {
        require(!members[msg.sender].exists, "Already registered");
        require(bytes(_name).length > 0, "Name required");
        
        members[msg.sender] = Member({
            memberAddress: msg.sender,
            name: _name,
            contactInfo: _contactInfo,
            totalContributed: 0,
            totalClaimsReceived: 0,
            claimCount: 0,
            status: MemberStatus.Active,
            joinedAt: block.timestamp,
            exists: true
        });
        
        totalMembers++;
        
        emit MemberRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Join a healthcare pool
     */
    function joinPool(uint256 _poolId) external payable onlyActiveMember poolExists(_poolId) {
        require(pools[_poolId].status == PoolStatus.Active, "Pool not active");
        require(!poolMembers[_poolId][msg.sender].isActive, "Already in pool");
        require(msg.value >= pools[_poolId].minContribution, "Insufficient contribution");
        
        // Calculate platform fee
        uint256 fee = (msg.value * platformFeePercent) / BASIS_POINTS;
        uint256 netContribution = msg.value - fee;
        
        // Update pool member
        poolMembers[_poolId][msg.sender] = PoolMember({
            memberAddress: msg.sender,
            totalContributed: netContribution,
            lastContributionAt: block.timestamp,
            isActive: true
        });
        
        poolMembersList[_poolId].push(msg.sender);
        memberPools[msg.sender].push(_poolId);
        
        // Update pool
        pools[_poolId].totalFunds += netContribution;
        pools[_poolId].memberCount++;
        
        // Update member
        members[msg.sender].totalContributed += netContribution;
        
        // Add fee to emergency fund
        emergencyFund += fee;
        
        emit MemberJoinedPool(_poolId, msg.sender, block.timestamp);
        emit ContributionMade(_poolId, msg.sender, netContribution, block.timestamp);
    }
    
    /**
     * @dev Make additional contribution to pool
     */
    function contributeToPool(uint256 _poolId) 
        external 
        payable 
        onlyActiveMember 
        poolExists(_poolId) 
        nonReentrant 
    {
        require(pools[_poolId].status == PoolStatus.Active, "Pool not active");
        require(poolMembers[_poolId][msg.sender].isActive, "Not a pool member");
        require(msg.value > 0, "Amount must be greater than 0");
        
        // Calculate platform fee
        uint256 fee = (msg.value * platformFeePercent) / BASIS_POINTS;
        uint256 netContribution = msg.value - fee;
        
        // Update pool member
        poolMembers[_poolId][msg.sender].totalContributed += netContribution;
        poolMembers[_poolId][msg.sender].lastContributionAt = block.timestamp;
        
        // Update pool
        pools[_poolId].totalFunds += netContribution;
        
        // Update member
        members[msg.sender].totalContributed += netContribution;
        
        // Add fee to emergency fund
        emergencyFund += fee;
        
        emit ContributionMade(_poolId, msg.sender, netContribution, block.timestamp);
    }
    
    /**
     * @dev Exit from a pool (if no pending claims)
     */
    function exitPool(uint256 _poolId) external onlyActiveMember poolExists(_poolId) {
        require(poolMembers[_poolId][msg.sender].isActive, "Not a pool member");
        
        // Check for pending claims
        uint256[] memory memberClaimIds = memberClaims[msg.sender];
        for (uint256 i = 0; i < memberClaimIds.length; i++) {
            Claim memory claim = claims[memberClaimIds[i]];
            if (claim.poolId == _poolId && claim.status == ClaimStatus.Pending) {
                revert("Cannot exit with pending claims");
            }
        }
        
        poolMembers[_poolId][msg.sender].isActive = false;
        pools[_poolId].memberCount--;
        
        emit MemberExitedPool(_poolId, msg.sender);
    }
    
    // ============ Provider Functions ============
    
    /**
     * @dev Register as a medical provider
     */
    function registerProvider(
        string memory _name,
        string memory _licenseNumber,
        string memory _specialty,
        string memory _location
    ) external {
        require(!providers[msg.sender].exists, "Already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_licenseNumber).length > 0, "License number required");
        
        providers[msg.sender] = MedicalProvider({
            providerAddress: msg.sender,
            name: _name,
            licenseNumber: _licenseNumber,
            specialty: _specialty,
            location: _location,
            status: ProviderStatus.Pending,
            totalClaimsProcessed: 0,
            totalAmountProcessed: 0,
            reputation: 500, // Start with neutral reputation
            registeredAt: block.timestamp,
            exists: true
        });
        
        totalProviders++;
        
        emit ProviderRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Verify a medical provider (only owner)
     */
    function verifyProvider(address _providerAddress) external onlyOwner {
        require(providers[_providerAddress].exists, "Provider not found");
        providers[_providerAddress].status = ProviderStatus.Verified;
        
        emit ProviderVerified(_providerAddress, block.timestamp);
    }
    
    /**
     * @dev Suspend a provider
     */
    function suspendProvider(address _providerAddress, string memory _reason) 
        external 
        onlyOwner 
    {
        require(providers[_providerAddress].exists, "Provider not found");
        providers[_providerAddress].status = ProviderStatus.Suspended;
        
        emit ProviderSuspended(_providerAddress, _reason);
    }
    
    /**
     * @dev Update provider reputation
     */
    function updateProviderReputation(address _providerAddress, uint256 _newReputation) 
        external 
        onlyOwner 
    {
        require(providers[_providerAddress].exists, "Provider not found");
        require(_newReputation <= 1000, "Reputation must be <= 1000");
        
        providers[_providerAddress].reputation = _newReputation;
    }
    
    // ============ Claim Functions ============
    
    /**
     * @dev Submit a medical claim
     */
    function submitClaim(
        uint256 _poolId,
        address _provider,
        string memory _diagnosis,
        string memory _treatmentDescription,
        uint256 _requestedAmount,
        string memory _medicalProof
    ) external onlyActiveMember poolExists(_poolId) returns (uint256) {
        require(pools[_poolId].status == PoolStatus.Active, "Pool not active");
        require(poolMembers[_poolId][msg.sender].isActive, "Not a pool member");
        require(providers[_provider].exists, "Provider not registered");
        require(providers[_provider].status == ProviderStatus.Verified, "Provider not verified");
        require(_requestedAmount > 0, "Amount must be greater than 0");
        require(_requestedAmount <= pools[_poolId].maxClaimAmount, "Amount exceeds max claim");
        require(bytes(_diagnosis).length > 0, "Diagnosis required");
        require(bytes(_medicalProof).length > 0, "Medical proof required");
        
        // Check pool has sufficient funds
        uint256 maxAllowedClaim = (pools[_poolId].totalFunds * MAX_CLAIM_PERCENTAGE) / BASIS_POINTS;
        require(_requestedAmount <= maxAllowedClaim, "Insufficient pool funds");
        
        totalClaims++;
        
        claims[totalClaims] = Claim({
            claimId: totalClaims,
            poolId: _poolId,
            member: msg.sender,
            provider: _provider,
            diagnosis: _diagnosis,
            treatmentDescription: _treatmentDescription,
            requestedAmount: _requestedAmount,
            approvedAmount: 0,
            status: ClaimStatus.Pending,
            medicalProof: _medicalProof,
            rejectionReason: "",
            submittedAt: block.timestamp,
            processedAt: 0,
            processedBy: address(0)
        });
        
        poolClaims[_poolId].push(totalClaims);
        memberClaims[msg.sender].push(totalClaims);
        providerClaims[_provider].push(totalClaims);
        
        members[msg.sender].claimCount++;
        
        emit ClaimSubmitted(
            totalClaims,
            _poolId,
            msg.sender,
            _provider,
            _requestedAmount,
            block.timestamp
        );
        
        return totalClaims;
    }
    
    /**
     * @dev Approve a claim
     */
    function approveClaim(uint256 _claimId, uint256 _approvedAmount) 
        external 
        onlyPoolAdmin(claims[_claimId].poolId) 
    {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        require(_approvedAmount > 0 && _approvedAmount <= claim.requestedAmount, "Invalid amount");
        
        HealthcarePool storage pool = pools[claim.poolId];
        require(pool.totalFunds >= _approvedAmount, "Insufficient pool funds");
        
        claim.status = ClaimStatus.Approved;
        claim.approvedAmount = _approvedAmount;
        claim.processedAt = block.timestamp;
        claim.processedBy = msg.sender;
        
        emit ClaimProcessed(_claimId, ClaimStatus.Approved, _approvedAmount, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Reject a claim
     */
    function rejectClaim(uint256 _claimId, string memory _reason) 
        external 
        onlyPoolAdmin(claims[_claimId].poolId) 
    {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        require(bytes(_reason).length > 0, "Reason required");
        
        claim.status = ClaimStatus.Rejected;
        claim.rejectionReason = _reason;
        claim.processedAt = block.timestamp;
        claim.processedBy = msg.sender;
        
        emit ClaimProcessed(_claimId, ClaimStatus.Rejected, 0, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Pay an approved claim
     */
    function payClaim(uint256 _claimId) external onlyVerifiedProvider nonReentrant {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Approved, "Claim not approved");
        require(claim.provider == msg.sender, "Not the claim provider");
        
        HealthcarePool storage pool = pools[claim.poolId];
        require(pool.totalFunds >= claim.approvedAmount, "Insufficient pool funds");
        
        // Update pool
        pool.totalFunds -= claim.approvedAmount;
        pool.totalPaidClaims += claim.approvedAmount;
        
        // Update member
        members[claim.member].totalClaimsReceived += claim.approvedAmount;
        
        // Update provider
        providers[msg.sender].totalClaimsProcessed++;
        providers[msg.sender].totalAmountProcessed += claim.approvedAmount;
        
        // Update claim status
        claim.status = ClaimStatus.Paid;
        
        // Transfer funds to provider
        (bool success, ) = payable(msg.sender).call{value: claim.approvedAmount}("");
        require(success, "Transfer failed");
        
        emit ClaimPaid(_claimId, claim.member, msg.sender, claim.approvedAmount, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get pool details
     */
    function getPool(uint256 _poolId) 
        external 
        view 
        poolExists(_poolId) 
        returns (HealthcarePool memory) 
    {
        return pools[_poolId];
    }
    
    /**
     * @dev Get pool members
     */
    function getPoolMembers(uint256 _poolId) 
        external 
        view 
        poolExists(_poolId) 
        returns (address[] memory) 
    {
        return poolMembersList[_poolId];
    }
    
    /**
     * @dev Get pool claims
     */
    function getPoolClaims(uint256 _poolId) 
        external 
        view 
        poolExists(_poolId) 
        returns (uint256[] memory) 
    {
        return poolClaims[_poolId];
    }
    
    /**
     * @dev Get member details
     */
    function getMember(address _memberAddress) 
        external 
        view 
        returns (Member memory) 
    {
        require(members[_memberAddress].exists, "Member not found");
        return members[_memberAddress];
    }
    
    /**
     * @dev Get member pools
     */
    function getMemberPools(address _memberAddress) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return memberPools[_memberAddress];
    }
    
    /**
     * @dev Get member claims
     */
    function getMemberClaims(address _memberAddress) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return memberClaims[_memberAddress];
    }
    
    /**
     * @dev Get provider details
     */
    function getProvider(address _providerAddress) 
        external 
        view 
        returns (MedicalProvider memory) 
    {
        require(providers[_providerAddress].exists, "Provider not found");
        return providers[_providerAddress];
    }
    
    /**
     * @dev Get provider claims
     */
    function getProviderClaims(address _providerAddress) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return providerClaims[_providerAddress];
    }
    
    /**
     * @dev Get claim details
     */
    function getClaim(uint256 _claimId) 
        external 
        view 
        returns (Claim memory) 
    {
        require(_claimId > 0 && _claimId <= totalClaims, "Claim does not exist");
        return claims[_claimId];
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 _totalPools,
            uint256 _totalMembers,
            uint256 _totalProviders,
            uint256 _totalClaims,
            uint256 _emergencyFund,
            uint256 _platformFeePercent
        ) 
    {
        return (
            totalPools,
            totalMembers,
            totalProviders,
            totalClaims,
            emergencyFund,
            platformFeePercent
        );
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 500, "Fee cannot exceed 5%");
        platformFeePercent = _newFeePercent;
        
        emit PlatformFeeUpdated(_newFeePercent);
    }
    
    /**
     * @dev Withdraw emergency fund
     */
    function withdrawEmergencyFund(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount > 0 && _amount <= emergencyFund, "Invalid amount");
        
        emergencyFund -= _amount;
        
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Replenish emergency fund
     */
    function replenishEmergencyFund() external payable onlyOwner {
        require(msg.value > 0, "Amount must be greater than 0");
        
        emergencyFund += msg.value;
        
        emit EmergencyFundReplenished(msg.value, block.timestamp);
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        emergencyFund += msg.value;
    }
}
