import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CELO_SEPOLIA_CONFIG,
  formatDate,
  formatAddress,
  formatCelo,
  getPoolStatusName,
  getProviderStatusName,
  getClaimStatusName,
  getStatusColor,
  getExplorerUrl,
  getTxUrl,
  POOL_STATUS,
  PROVIDER_STATUS,
  CLAIM_STATUS,
  MIN_CONTRIBUTION
} from './config';
import './App.css';

function App() {
  // State Management
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Contract Data
  const [stats, setStats] = useState(null);
  const [userRole, setUserRole] = useState({ isMember: false, isProvider: false, isOwner: false });
  const [memberData, setMemberData] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [pools, setPools] = useState([]);
  const [userPools, setUserPools] = useState([]);
  const [userClaims, setUserClaims] = useState([]);
  const [providerClaims, setProviderClaims] = useState([]);
  
  // Form States
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Initialize Web3
  useEffect(() => {
    if (window.ethereum) {
      initializeProvider();
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);
  
  const initializeProvider = async () => {
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      const network = await web3Provider.getNetwork();
      setChainId(network.chainId.toString());
      
      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);
        setAccount(accounts[0].address);
        setIsConnected(true);
        
        const healthcareContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer);
        setContract(healthcareContract);
        
        await loadContractData(healthcareContract, accounts[0].address);
      }
    } catch (error) {
      console.error("Error initializing provider:", error);
    }
  };
  
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      initializeProvider();
    }
  };
  
  const handleChainChanged = () => {
    window.location.reload();
  };
  
  const connectWallet = async () => {
    if (!window.ethereum) {
      showMessage('error', 'Please install MetaMask to use this dApp');
      return;
    }
    
    try {
      setLoading(true);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check and switch to Celo Sepolia if needed
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (currentChainId !== CELO_SEPOLIA_CONFIG.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CELO_SEPOLIA_CONFIG.chainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CELO_SEPOLIA_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      await initializeProvider();
      showMessage('success', 'Wallet connected successfully!');
    } catch (error) {
      console.error("Error connecting wallet:", error);
      showMessage('error', `Failed to connect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount('');
    setIsConnected(false);
    setUserRole({ isMember: false, isProvider: false, isOwner: false });
    setMemberData(null);
    setProviderData(null);
    showMessage('info', 'Wallet disconnected');
  };
  
  const loadContractData = async (contractInstance, userAddress) => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsData = await contractInstance.getStats();
      setStats({
        totalPools: statsData[0].toString(),
        totalMembers: statsData[1].toString(),
        totalProviders: statsData[2].toString(),
        totalClaims: statsData[3].toString(),
        emergencyFund: ethers.formatEther(statsData[4]),
        platformFeePercent: statsData[5].toString()
      });
      
      // Check user roles
      const owner = await contractInstance.owner();
      const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
      
      let isMember = false;
      let memberInfo = null;
      try {
        memberInfo = await contractInstance.getMember(userAddress);
        isMember = memberInfo.exists;
        if (isMember) {
          setMemberData({
            name: memberInfo.name,
            contactInfo: memberInfo.contactInfo,
            totalContributed: ethers.formatEther(memberInfo.totalContributed),
            totalClaimsReceived: ethers.formatEther(memberInfo.totalClaimsReceived),
            claimCount: memberInfo.claimCount.toString(),
            status: memberInfo.status,
            joinedAt: memberInfo.joinedAt.toString()
          });
        }
      } catch (e) {
        // User is not a member
      }
      
      let isProvider = false;
      let providerInfo = null;
      try {
        providerInfo = await contractInstance.getProvider(userAddress);
        isProvider = providerInfo.exists;
        if (isProvider) {
          setProviderData({
            name: providerInfo.name,
            licenseNumber: providerInfo.licenseNumber,
            specialty: providerInfo.specialty,
            location: providerInfo.location,
            status: providerInfo.status,
            totalClaimsProcessed: providerInfo.totalClaimsProcessed.toString(),
            totalAmountProcessed: ethers.formatEther(providerInfo.totalAmountProcessed),
            reputation: providerInfo.reputation.toString(),
            registeredAt: providerInfo.registeredAt.toString()
          });
        }
      } catch (e) {
        // User is not a provider
      }
      
      setUserRole({ isMember, isProvider, isOwner });
      
      // Load pools
      const totalPoolsCount = parseInt(statsData[0].toString());
      const poolsData = [];
      for (let i = 1; i <= totalPoolsCount && i <= 20; i++) {
        try {
          const pool = await contractInstance.getPool(i);
          poolsData.push({
            poolId: pool.poolId.toString(),
            name: pool.name,
            description: pool.description,
            admin: pool.admin,
            minContribution: ethers.formatEther(pool.minContribution),
            maxClaimAmount: ethers.formatEther(pool.maxClaimAmount),
            totalFunds: ethers.formatEther(pool.totalFunds),
            totalPaidClaims: ethers.formatEther(pool.totalPaidClaims),
            memberCount: pool.memberCount.toString(),
            status: pool.status,
            createdAt: pool.createdAt.toString()
          });
        } catch (e) {
          console.error(`Error loading pool ${i}:`, e);
        }
      }
      setPools(poolsData);
      
      // Load user pools if member
      if (isMember) {
        const userPoolIds = await contractInstance.getMemberPools(userAddress);
        const userPoolsData = [];
        for (let poolId of userPoolIds) {
          try {
            const pool = await contractInstance.getPool(poolId);
            userPoolsData.push({
              poolId: pool.poolId.toString(),
              name: pool.name,
              description: pool.description,
              admin: pool.admin,
              minContribution: ethers.formatEther(pool.minContribution),
              maxClaimAmount: ethers.formatEther(pool.maxClaimAmount),
              totalFunds: ethers.formatEther(pool.totalFunds),
              totalPaidClaims: ethers.formatEther(pool.totalPaidClaims),
              memberCount: pool.memberCount.toString(),
              status: pool.status,
              createdAt: pool.createdAt.toString()
            });
          } catch (e) {
            console.error(`Error loading user pool ${poolId}:`, e);
          }
        }
        setUserPools(userPoolsData);
        
        // Load user claims
        const userClaimIds = await contractInstance.getMemberClaims(userAddress);
        const userClaimsData = [];
        for (let claimId of userClaimIds) {
          try {
            const claim = await contractInstance.getClaim(claimId);
            userClaimsData.push({
              claimId: claim.claimId.toString(),
              poolId: claim.poolId.toString(),
              member: claim.member,
              provider: claim.provider,
              diagnosis: claim.diagnosis,
              treatmentDescription: claim.treatmentDescription,
              requestedAmount: ethers.formatEther(claim.requestedAmount),
              approvedAmount: ethers.formatEther(claim.approvedAmount),
              status: claim.status,
              medicalProof: claim.medicalProof,
              rejectionReason: claim.rejectionReason,
              submittedAt: claim.submittedAt.toString(),
              processedAt: claim.processedAt.toString(),
              processedBy: claim.processedBy
            });
          } catch (e) {
            console.error(`Error loading claim ${claimId}:`, e);
          }
        }
        setUserClaims(userClaimsData);
      }
      
      // Load provider claims if provider
      if (isProvider) {
        const providerClaimIds = await contractInstance.getProviderClaims(userAddress);
        const providerClaimsData = [];
        for (let claimId of providerClaimIds) {
          try {
            const claim = await contractInstance.getClaim(claimId);
            providerClaimsData.push({
              claimId: claim.claimId.toString(),
              poolId: claim.poolId.toString(),
              member: claim.member,
              provider: claim.provider,
              diagnosis: claim.diagnosis,
              treatmentDescription: claim.treatmentDescription,
              requestedAmount: ethers.formatEther(claim.requestedAmount),
              approvedAmount: ethers.formatEther(claim.approvedAmount),
              status: claim.status,
              medicalProof: claim.medicalProof,
              rejectionReason: claim.rejectionReason,
              submittedAt: claim.submittedAt.toString(),
              processedAt: claim.processedAt.toString(),
              processedBy: claim.processedBy
            });
          } catch (e) {
            console.error(`Error loading provider claim ${claimId}:`, e);
          }
        }
        setProviderClaims(providerClaimsData);
      }
      
    } catch (error) {
      console.error("Error loading contract data:", error);
      showMessage('error', 'Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };
  
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };
  
  const refreshData = async () => {
    if (contract && account) {
      await loadContractData(contract, account);
      showMessage('success', 'Data refreshed!');
    }
  };
  
  // Member Functions
  const registerMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const contactInfo = formData.get('contactInfo');
    
    try {
      setLoading(true);
      const tx = await contract.registerMember(name, contactInfo);
      showMessage('info', 'Registering member... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Successfully registered as member!');
      await refreshData();
      e.target.reset();
    } catch (error) {
      console.error("Error registering member:", error);
      showMessage('error', `Failed to register: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const createPool = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('poolName');
    const description = formData.get('poolDescription');
    const minContribution = formData.get('minContribution');
    const maxClaimAmount = formData.get('maxClaimAmount');
    
    try {
      setLoading(true);
      const tx = await contract.createPool(
        name,
        description,
        ethers.parseEther(minContribution),
        ethers.parseEther(maxClaimAmount)
      );
      showMessage('info', 'Creating pool... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Pool created successfully!');
      await refreshData();
      e.target.reset();
    } catch (error) {
      console.error("Error creating pool:", error);
      showMessage('error', `Failed to create pool: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const joinPool = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const poolId = formData.get('poolId');
    const contribution = formData.get('contribution');
    
    try {
      setLoading(true);
      const tx = await contract.joinPool(poolId, {
        value: ethers.parseEther(contribution)
      });
      showMessage('info', 'Joining pool... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Successfully joined the pool!');
      await refreshData();
      e.target.reset();
    } catch (error) {
      console.error("Error joining pool:", error);
      showMessage('error', `Failed to join pool: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const contributeToPool = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const poolId = formData.get('contributePoolId');
    const amount = formData.get('contributeAmount');
    
    try {
      setLoading(true);
      const tx = await contract.contributeToPool(poolId, {
        value: ethers.parseEther(amount)
      });
      showMessage('info', 'Making contribution... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Contribution made successfully!');
      await refreshData();
      e.target.reset();
    } catch (error) {
      console.error("Error contributing:", error);
      showMessage('error', `Failed to contribute: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Provider Functions
  const registerProvider = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('providerName');
    const licenseNumber = formData.get('licenseNumber');
    const specialty = formData.get('specialty');
    const location = formData.get('location');
    
    try {
      setLoading(true);
      const tx = await contract.registerProvider(name, licenseNumber, specialty, location);
      showMessage('info', 'Registering provider... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Successfully registered as provider! Waiting for verification.');
      await refreshData();
      e.target.reset();
    } catch (error) {
      console.error("Error registering provider:", error);
      showMessage('error', `Failed to register: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Claim Functions
  const submitClaim = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const poolId = formData.get('claimPoolId');
    const provider = formData.get('providerAddress');
    const diagnosis = formData.get('diagnosis');
    const treatment = formData.get('treatment');
    const amount = formData.get('claimAmount');
    const medicalProof = formData.get('medicalProof');
    
    try {
      setLoading(true);
      const tx = await contract.submitClaim(
        poolId,
        provider,
        diagnosis,
        treatment,
        ethers.parseEther(amount),
        medicalProof
      );
      showMessage('info', 'Submitting claim... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Claim submitted successfully!');
      await refreshData();
      e.target.reset();
    } catch (error) {
      console.error("Error submitting claim:", error);
      showMessage('error', `Failed to submit claim: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const payClaim = async (claimId) => {
    try {
      setLoading(true);
      const tx = await contract.payClaim(claimId);
      showMessage('info', 'Processing payment... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Payment received successfully!');
      await refreshData();
    } catch (error) {
      console.error("Error paying claim:", error);
      showMessage('error', `Failed to process payment: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Admin Functions (Pool Admin)
  const approveClaim = async (claimId, approvedAmount) => {
    try {
      setLoading(true);
      const tx = await contract.approveClaim(claimId, ethers.parseEther(approvedAmount));
      showMessage('info', 'Approving claim... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Claim approved successfully!');
      await refreshData();
    } catch (error) {
      console.error("Error approving claim:", error);
      showMessage('error', `Failed to approve: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const rejectClaim = async (claimId, reason) => {
    try {
      setLoading(true);
      const tx = await contract.rejectClaim(claimId, reason);
      showMessage('info', 'Rejecting claim... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Claim rejected.');
      await refreshData();
    } catch (error) {
      console.error("Error rejecting claim:", error);
      showMessage('error', `Failed to reject: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Owner Functions
  const verifyProvider = async (providerAddress) => {
    try {
      setLoading(true);
      const tx = await contract.verifyProvider(providerAddress);
      showMessage('info', 'Verifying provider... Please wait for confirmation.');
      await tx.wait();
      showMessage('success', 'Provider verified successfully!');
      await refreshData();
    } catch (error) {
      console.error("Error verifying provider:", error);
      showMessage('error', `Failed to verify: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render Functions
  const renderDashboard = () => (
    <div className="dashboard">
      <h2>📊 Platform Statistics</h2>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏥</div>
            <div className="stat-value">{stats.totalPools}</div>
            <div className="stat-label">Healthcare Pools</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalMembers}</div>
            <div className="stat-label">Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍⚕️</div>
            <div className="stat-value">{stats.totalProviders}</div>
            <div className="stat-label">Providers</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats.totalClaims}</div>
            <div className="stat-label">Total Claims</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{formatCelo(stats.emergencyFund)}</div>
            <div className="stat-label">Emergency Fund (CELO)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-value">{stats.platformFeePercent / 100}%</div>
            <div className="stat-label">Platform Fee</div>
          </div>
        </div>
      )}
      
      {userRole.isMember && memberData && (
        <div className="user-info">
          <h3>👤 Your Member Profile</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{memberData.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Contact:</span>
              <span className="value">{memberData.contactInfo}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Contributed:</span>
              <span className="value">{formatCelo(memberData.totalContributed)} CELO</span>
            </div>
            <div className="info-item">
              <span className="label">Claims Received:</span>
              <span className="value">{formatCelo(memberData.totalClaimsReceived)} CELO</span>
            </div>
            <div className="info-item">
              <span className="label">Total Claims:</span>
              <span className="value">{memberData.claimCount}</span>
            </div>
            <div className="info-item">
              <span className="label">Joined:</span>
              <span className="value">{formatDate(memberData.joinedAt)}</span>
            </div>
          </div>
        </div>
      )}
      
      {userRole.isProvider && providerData && (
        <div className="user-info">
          <h3>👨‍⚕️ Your Provider Profile</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{providerData.name}</span>
            </div>
            <div className="info-item">
              <span className="label">License:</span>
              <span className="value">{providerData.licenseNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">Specialty:</span>
              <span className="value">{providerData.specialty}</span>
            </div>
            <div className="info-item">
              <span className="label">Location:</span>
              <span className="value">{providerData.location}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">
                <span className="status-badge" style={{ backgroundColor: getStatusColor(providerData.status, 'provider') }}>
                  {getProviderStatusName(providerData.status)}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="label">Reputation:</span>
              <span className="value">{providerData.reputation}/1000</span>
            </div>
            <div className="info-item">
              <span className="label">Claims Processed:</span>
              <span className="value">{providerData.totalClaimsProcessed}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Earned:</span>
              <span className="value">{formatCelo(providerData.totalAmountProcessed)} CELO</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="pools-section">
        <h3>🏥 Available Healthcare Pools</h3>
        {pools.length === 0 ? (
          <p className="no-data">No pools available yet. Create the first one!</p>
        ) : (
          <div className="pools-grid">
            {pools.map(pool => (
              <div key={pool.poolId} className="pool-card">
                <div className="pool-header">
                  <h4>{pool.name}</h4>
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(pool.status, 'pool') }}>
                    {getPoolStatusName(pool.status)}
                  </span>
                </div>
                <p className="pool-description">{pool.description}</p>
                <div className="pool-stats">
                  <div className="pool-stat">
                    <span className="label">Total Funds:</span>
                    <span className="value">{formatCelo(pool.totalFunds)} CELO</span>
                  </div>
                  <div className="pool-stat">
                    <span className="label">Members:</span>
                    <span className="value">{pool.memberCount}</span>
                  </div>
                  <div className="pool-stat">
                    <span className="label">Min Contribution:</span>
                    <span className="value">{formatCelo(pool.minContribution)} CELO</span>
                  </div>
                  <div className="pool-stat">
                    <span className="label">Max Claim:</span>
                    <span className="value">{formatCelo(pool.maxClaimAmount)} CELO</span>
                  </div>
                  <div className="pool-stat">
                    <span className="label">Admin:</span>
                    <span className="value">
                      <a href={getExplorerUrl(pool.admin)} target="_blank" rel="noopener noreferrer">
                        {formatAddress(pool.admin)}
                      </a>
                    </span>
                  </div>
                  <div className="pool-stat">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(pool.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  const renderMemberSection = () => (
    <div className="member-section">
      {!userRole.isMember ? (
        <div className="registration-form">
          <h2>👤 Register as Member</h2>
          <form onSubmit={registerMember}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Contact Information *</label>
              <input type="text" name="contactInfo" required placeholder="email@example.com or phone" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Register as Member'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="section">
            <h2>🏥 Create Healthcare Pool</h2>
            <form onSubmit={createPool}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pool Name *</label>
                  <input type="text" name="poolName" required placeholder="Community Health Fund" />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <input type="text" name="poolDescription" required placeholder="Healthcare pool for..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Contribution (CELO) *</label>
                  <input type="number" name="minContribution" step="0.01" min={MIN_CONTRIBUTION} required placeholder="0.1" />
                </div>
                <div className="form-group">
                  <label>Maximum Claim Amount (CELO) *</label>
                  <input type="number" name="maxClaimAmount" step="0.1" min="0.1" required placeholder="10" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Pool'}
              </button>
            </form>
          </div>
          
          <div className="section">
            <h2>🎯 Join a Pool</h2>
            <form onSubmit={joinPool}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pool ID *</label>
                  <input type="number" name="poolId" min="1" required placeholder="1" />
                </div>
                <div className="form-group">
                  <label>Initial Contribution (CELO) *</label>
                  <input type="number" name="contribution" step="0.01" min={MIN_CONTRIBUTION} required placeholder="0.1" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Joining...' : 'Join Pool'}
              </button>
            </form>
          </div>
          
          <div className="section">
            <h2>💰 Contribute to Pool</h2>
            <form onSubmit={contributeToPool}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pool ID *</label>
                  <input type="number" name="contributePoolId" min="1" required placeholder="1" />
                </div>
                <div className="form-group">
                  <label>Contribution Amount (CELO) *</label>
                  <input type="number" name="contributeAmount" step="0.01" min="0.01" required placeholder="0.5" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Contributing...' : 'Make Contribution'}
              </button>
            </form>
          </div>
          
          <div className="section">
            <h2>📋 Submit Medical Claim</h2>
            <form onSubmit={submitClaim}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pool ID *</label>
                  <input type="number" name="claimPoolId" min="1" required placeholder="1" />
                </div>
                <div className="form-group">
                  <label>Provider Address *</label>
                  <input type="text" name="providerAddress" required placeholder="0x..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Diagnosis *</label>
                  <input type="text" name="diagnosis" required placeholder="Flu and fever" />
                </div>
                <div className="form-group">
                  <label>Treatment Description *</label>
                  <input type="text" name="treatment" required placeholder="Medication and consultation" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Requested Amount (CELO) *</label>
                  <input type="number" name="claimAmount" step="0.01" min="0.01" required placeholder="0.5" />
                </div>
                <div className="form-group">
                  <label>Medical Proof (IPFS Hash) *</label>
                  <input type="text" name="medicalProof" required placeholder="ipfs://QmXXX..." />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </div>
          
          <div className="section">
            <h2>📊 My Pools ({userPools.length})</h2>
            {userPools.length === 0 ? (
              <p className="no-data">You haven't joined any pools yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pool ID</th>
                      <th>Name</th>
                      <th>Total Funds</th>
                      <th>Members</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPools.map(pool => (
                      <tr key={pool.poolId}>
                        <td>{pool.poolId}</td>
                        <td>{pool.name}</td>
                        <td>{formatCelo(pool.totalFunds)} CELO</td>
                        <td>{pool.memberCount}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(pool.status, 'pool') }}>
                            {getPoolStatusName(pool.status)}
                          </span>
                        </td>
                        <td>
                          <a href={getExplorerUrl(pool.admin)} target="_blank" rel="noopener noreferrer" className="btn-link">
                            View Admin
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="section">
            <h2>📋 My Claims ({userClaims.length})</h2>
            {userClaims.length === 0 ? (
              <p className="no-data">You haven't submitted any claims yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Pool</th>
                      <th>Diagnosis</th>
                      <th>Requested</th>
                      <th>Approved</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userClaims.map(claim => (
                      <tr key={claim.claimId}>
                        <td>{claim.claimId}</td>
                        <td>{claim.poolId}</td>
                        <td>{claim.diagnosis}</td>
                        <td>{formatCelo(claim.requestedAmount)} CELO</td>
                        <td>{formatCelo(claim.approvedAmount)} CELO</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(claim.status, 'claim') }}>
                            {getClaimStatusName(claim.status)}
                          </span>
                        </td>
                        <td>{formatDate(claim.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
  
  const renderProviderSection = () => (
    <div className="provider-section">
      {!userRole.isProvider ? (
        <div className="registration-form">
          <h2>👨‍⚕️ Register as Medical Provider</h2>
          <form onSubmit={registerProvider}>
            <div className="form-group">
              <label>Provider Name *</label>
              <input type="text" name="providerName" required placeholder="Dr. Jane Smith" />
            </div>
            <div className="form-group">
              <label>Medical License Number *</label>
              <input type="text" name="licenseNumber" required placeholder="MD123456" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Specialty *</label>
                <input type="text" name="specialty" required placeholder="General Medicine" />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input type="text" name="location" required placeholder="New York, NY" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register as Provider'}
            </button>
          </form>
          <p className="info-text">
            ⚠️ After registration, wait for the platform owner to verify your credentials.
          </p>
        </div>
      ) : (
        <>
          {providerData.status === PROVIDER_STATUS.Pending && (
            <div className="alert alert-warning">
              ⏳ Your provider account is pending verification. Please wait for the platform owner to verify your credentials.
            </div>
          )}
          
          {providerData.status === PROVIDER_STATUS.Verified && (
            <div className="alert alert-success">
              ✅ Your provider account is verified! You can now receive payments for approved claims.
            </div>
          )}
          
          <div className="section">
            <h2>💼 My Claims ({providerClaims.length})</h2>
            {providerClaims.length === 0 ? (
              <p className="no-data">No claims associated with your provider account yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Patient</th>
                      <th>Diagnosis</th>
                      <th>Treatment</th>
                      <th>Requested</th>
                      <th>Approved</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerClaims.map(claim => (
                      <tr key={claim.claimId}>
                        <td>{claim.claimId}</td>
                        <td>
                          <a href={getExplorerUrl(claim.member)} target="_blank" rel="noopener noreferrer">
                            {formatAddress(claim.member)}
                          </a>
                        </td>
                        <td>{claim.diagnosis}</td>
                        <td>{claim.treatmentDescription}</td>
                        <td>{formatCelo(claim.requestedAmount)} CELO</td>
                        <td>{formatCelo(claim.approvedAmount)} CELO</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(claim.status, 'claim') }}>
                            {getClaimStatusName(claim.status)}
                          </span>
                        </td>
                        <td>
                          {claim.status === CLAIM_STATUS.Approved && (
                            <button 
                              onClick={() => payClaim(claim.claimId)} 
                              className="btn btn-small btn-success"
                              disabled={loading}
                            >
                              Receive Payment
                            </button>
                          )}
                          {claim.status === CLAIM_STATUS.Paid && (
                            <span className="text-success">✓ Paid</span>
                          )}
                          {claim.medicalProof && (
                            <a href={claim.medicalProof} target="_blank" rel="noopener noreferrer" className="btn-link">
                              View Proof
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
  
  const renderAdminSection = () => {
    const adminPools = pools.filter(pool => 
      pool.admin.toLowerCase() === account.toLowerCase()
    );
    
    return (
      <div className="admin-section">
        <h2>⚙️ Pool Administration</h2>
        
        {adminPools.length === 0 ? (
          <p className="no-data">You don't administer any pools. Create one in the Member section!</p>
        ) : (
          <>
            {adminPools.map(pool => {
              const poolClaimIds = pools.find(p => p.poolId === pool.poolId);
              
              return (
                <div key={pool.poolId} className="admin-pool-section">
                  <h3>🏥 {pool.name} (Pool #{pool.poolId})</h3>
                  <div className="pool-admin-stats">
                    <div className="stat">
                      <span className="label">Total Funds:</span>
                      <span className="value">{formatCelo(pool.totalFunds)} CELO</span>
                    </div>
                    <div className="stat">
                      <span className="label">Members:</span>
                      <span className="value">{pool.memberCount}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Paid Claims:</span>
                      <span className="value">{formatCelo(pool.totalPaidClaims)} CELO</span>
                    </div>
                    <div className="stat">
                      <span className="label">Status:</span>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(pool.status, 'pool') }}>
                        {getPoolStatusName(pool.status)}
                      </span>
                    </div>
                  </div>
                  
                  <h4>📋 Pending Claims Review</h4>
                  <div className="claims-review">
                    {userClaims.filter(c => c.poolId === pool.poolId && c.status === CLAIM_STATUS.Pending).length === 0 ? (
                      <p className="no-data">No pending claims for this pool.</p>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Claim ID</th>
                              <th>Member</th>
                              <th>Provider</th>
                              <th>Diagnosis</th>
                              <th>Treatment</th>
                              <th>Amount</th>
                              <th>Submitted</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userClaims
                              .filter(c => c.poolId === pool.poolId && c.status === CLAIM_STATUS.Pending)
                              .map(claim => (
                                <tr key={claim.claimId}>
                                  <td>{claim.claimId}</td>
                                  <td>
                                    <a href={getExplorerUrl(claim.member)} target="_blank" rel="noopener noreferrer">
                                      {formatAddress(claim.member)}
                                    </a>
                                  </td>
                                  <td>
                                    <a href={getExplorerUrl(claim.provider)} target="_blank" rel="noopener noreferrer">
                                      {formatAddress(claim.provider)}
                                    </a>
                                  </td>
                                  <td>{claim.diagnosis}</td>
                                  <td>{claim.treatmentDescription}</td>
                                  <td>{formatCelo(claim.requestedAmount)} CELO</td>
                                  <td>{formatDate(claim.submittedAt)}</td>
                                  <td>
                                    <div className="action-buttons">
                                      <button 
                                        onClick={() => {
                                          const amount = prompt(`Approve amount for claim #${claim.claimId} (max: ${claim.requestedAmount} CELO):`);
                                          if (amount) approveClaim(claim.claimId, amount);
                                        }}
                                        className="btn btn-small btn-success"
                                        disabled={loading}
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => {
                                          const reason = prompt(`Rejection reason for claim #${claim.claimId}:`);
                                          if (reason) rejectClaim(claim.claimId, reason);
                                        }}
                                        className="btn btn-small btn-danger"
                                        disabled={loading}
                                      >
                                        Reject
                                      </button>
                                      {claim.medicalProof && (
                                        <a href={claim.medicalProof} target="_blank" rel="noopener noreferrer" className="btn-link">
                                          View Proof
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  };
  
  const renderOwnerSection = () => (
    <div className="owner-section">
      <h2>👑 Platform Owner Controls</h2>
      
      <div className="section">
        <h3>👨‍⚕️ Verify Provider</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          verifyProvider(formData.get('providerAddress'));
          e.target.reset();
        }}>
          <div className="form-group">
            <label>Provider Address *</label>
            <input type="text" name="providerAddress" required placeholder="0x..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Provider'}
          </button>
        </form>
      </div>
      
      <div className="alert alert-info">
        ℹ️ Additional owner functions (update fees, withdraw emergency fund) can be added as needed.
      </div>
    </div>
  );
  
  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>🏥 Healthcare Payments</h1>
              <p className="tagline">Decentralized Healthcare Funding on Celo</p>
            </div>
            
            {!isConnected ? (
              <button onClick={connectWallet} className="btn btn-primary" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="wallet-info">
                <div className="account">
                  <span className="network-badge">Celo Sepolia</span>
                  <span className="address">{formatAddress(account)}</span>
                  <button onClick={disconnectWallet} className="btn btn-secondary btn-small">
                    Disconnect
                  </button>
                </div>
                {(userRole.isMember || userRole.isProvider || userRole.isOwner) && (
                  <div className="user-roles">
                    {userRole.isMember && <span className="role-badge">👤 Member</span>}
                    {userRole.isProvider && <span className="role-badge">👨‍⚕️ Provider</span>}
                    {userRole.isOwner && <span className="role-badge">👑 Owner</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      
      {message.text && (
        <div className={`message message-${message.type}`}>
          <div className="container">
            {message.text}
          </div>
        </div>
      )}
      
      {isConnected ? (
        <main className="main">
          <div className="container">
            <nav className="tabs">
              <button 
                className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
              <button 
                className={`tab ${activeTab === 'member' ? 'active' : ''}`}
                onClick={() => setActiveTab('member')}
              >
                👤 Member
              </button>
              <button 
                className={`tab ${activeTab === 'provider' ? 'active' : ''}`}
                onClick={() => setActiveTab('provider')}
              >
                👨‍⚕️ Provider
              </button>
              {(userRole.isMember || userRole.isOwner) && (
                <button 
                  className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  ⚙️ Pool Admin
                </button>
              )}
              {userRole.isOwner && (
                <button 
                  className={`tab ${activeTab === 'owner' ? 'active' : ''}`}
                  onClick={() => setActiveTab('owner')}
                >
                  👑 Owner
                </button>
              )}
              <button onClick={refreshData} className="btn btn-secondary btn-small" disabled={loading}>
                {loading ? '⏳' : '🔄 Refresh'}
              </button>
            </nav>
            
            <div className="content">
              {loading && <div className="loading-overlay">⏳ Processing...</div>}
              
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'member' && renderMemberSection()}
              {activeTab === 'provider' && renderProviderSection()}
              {activeTab === 'admin' && renderAdminSection()}
              {activeTab === 'owner' && renderOwnerSection()}
            </div>
          </div>
        </main>
      ) : (
        <main className="main">
          <div className="container">
            <div className="welcome-section">
              <h2>Welcome to Healthcare Payments DApp</h2>
              <p>A decentralized platform for community healthcare funding and claims management on Celo blockchain.</p>
              
              <div className="features">
                <div className="feature">
                  <div className="feature-icon">🏥</div>
                  <h3>Healthcare Pools</h3>
                  <p>Create or join community healthcare funding pools</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">👥</div>
                  <h3>Member System</h3>
                  <p>Register, contribute, and submit medical claims</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">👨‍⚕️</div>
                  <h3>Verified Providers</h3>
                  <p>Medical providers verified by platform owner</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">📋</div>
                  <h3>Claims Processing</h3>
                  <p>Transparent claim submission and approval workflow</p>
                </div>
              </div>
              
              <div className="cta">
                <button onClick={connectWallet} className="btn btn-primary btn-large">
                  Connect Your Wallet to Get Started
                </button>
              </div>
              
              <div className="contract-info">
                <p><strong>Contract Address:</strong> <a href={getExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer">{CONTRACT_ADDRESS}</a></p>
                <p><strong>Network:</strong> Celo Sepolia Testnet</p>
                <p><strong>Platform Fee:</strong> 2%</p>
              </div>
            </div>
          </div>
        </main>
      )}
      
      <footer className="footer">
        <div className="container">
          <p>Healthcare Payments DApp © 2025 | Built on Celo Blockchain</p>
          <p>
            <a href={getExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer">View Contract</a>
            {' | '}
            <a href="https://docs.celo.org" target="_blank" rel="noopener noreferrer">Celo Docs</a>
            {' | '}
            <a href="https://faucet.celo.org/sepolia" target="_blank" rel="noopener noreferrer">Get Testnet CELO</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
