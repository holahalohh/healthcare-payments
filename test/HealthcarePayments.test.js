const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("HealthcarePayments", function () {
  // Test fixture to deploy contract
  async function deployHealthcarePaymentsFixture() {
    const [owner, admin, member1, member2, member3, provider1, provider2, other] = await ethers.getSigners();

    const HealthcarePayments = await ethers.getContractFactory("HealthcarePayments");
    const healthcare = await HealthcarePayments.deploy();

    return { healthcare, owner, admin, member1, member2, member3, provider1, provider2, other };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { healthcare, owner } = await loadFixture(deployHealthcarePaymentsFixture);
      expect(await healthcare.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      const { healthcare } = await loadFixture(deployHealthcarePaymentsFixture);
      
      expect(await healthcare.totalPools()).to.equal(0);
      expect(await healthcare.totalMembers()).to.equal(0);
      expect(await healthcare.totalProviders()).to.equal(0);
      expect(await healthcare.totalClaims()).to.equal(0);
      expect(await healthcare.platformFeePercent()).to.equal(200); // 2%
    });
  });

  describe("Member Registration", function () {
    it("Should allow member registration", async function () {
      const { healthcare, member1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await expect(healthcare.connect(member1).registerMember("Alice", "alice@example.com"))
        .to.emit(healthcare, "MemberRegistered")
        .withArgs(member1.address, "Alice", await time.latest() + 1);
      
      const member = await healthcare.getMember(member1.address);
      expect(member.name).to.equal("Alice");
      expect(member.exists).to.be.true;
      expect(await healthcare.totalMembers()).to.equal(1);
    });

    it("Should not allow duplicate member registration", async function () {
      const { healthcare, member1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      
      await expect(
        healthcare.connect(member1).registerMember("Alice2", "alice2@example.com")
      ).to.be.revertedWith("Already registered");
    });

    it("Should require name for registration", async function () {
      const { healthcare, member1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await expect(
        healthcare.connect(member1).registerMember("", "alice@example.com")
      ).to.be.revertedWith("Name required");
    });
  });

  describe("Provider Registration", function () {
    it("Should allow provider registration", async function () {
      const { healthcare, provider1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await expect(
        healthcare.connect(provider1).registerProvider(
          "City Hospital",
          "LIC-12345",
          "General Medicine",
          "New York"
        )
      ).to.emit(healthcare, "ProviderRegistered")
        .withArgs(provider1.address, "City Hospital", await time.latest() + 1);
      
      const provider = await healthcare.getProvider(provider1.address);
      expect(provider.name).to.equal("City Hospital");
      expect(provider.licenseNumber).to.equal("LIC-12345");
      expect(provider.reputation).to.equal(500); // Neutral reputation
      expect(await healthcare.totalProviders()).to.equal(1);
    });

    it("Should not allow duplicate provider registration", async function () {
      const { healthcare, provider1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await healthcare.connect(provider1).registerProvider(
        "City Hospital",
        "LIC-12345",
        "General Medicine",
        "New York"
      );
      
      await expect(
        healthcare.connect(provider1).registerProvider(
          "Another Hospital",
          "LIC-67890",
          "Cardiology",
          "Boston"
        )
      ).to.be.revertedWith("Already registered");
    });

    it("Should allow owner to verify provider", async function () {
      const { healthcare, owner, provider1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await healthcare.connect(provider1).registerProvider(
        "City Hospital",
        "LIC-12345",
        "General Medicine",
        "New York"
      );
      
      await expect(healthcare.connect(owner).verifyProvider(provider1.address))
        .to.emit(healthcare, "ProviderVerified")
        .withArgs(provider1.address, await time.latest() + 1);
      
      const provider = await healthcare.getProvider(provider1.address);
      expect(provider.status).to.equal(1); // Verified
    });

    it("Should allow owner to suspend provider", async function () {
      const { healthcare, owner, provider1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await healthcare.connect(provider1).registerProvider(
        "City Hospital",
        "LIC-12345",
        "General Medicine",
        "New York"
      );
      
      await expect(
        healthcare.connect(owner).suspendProvider(provider1.address, "License expired")
      ).to.emit(healthcare, "ProviderSuspended")
        .withArgs(provider1.address, "License expired");
      
      const provider = await healthcare.getProvider(provider1.address);
      expect(provider.status).to.equal(2); // Suspended
    });
  });

  describe("Pool Creation", function () {
    it("Should allow creating a healthcare pool", async function () {
      const { healthcare, admin } = await loadFixture(deployHealthcarePaymentsFixture);
      
      const minContribution = ethers.parseEther("0.1");
      const maxClaimAmount = ethers.parseEther("5");
      
      await expect(
        healthcare.connect(admin).createPool(
          "Community Health Pool",
          "For local community healthcare",
          minContribution,
          maxClaimAmount
        )
      ).to.emit(healthcare, "PoolCreated")
        .withArgs(1, "Community Health Pool", admin.address, await time.latest() + 1);
      
      const pool = await healthcare.getPool(1);
      expect(pool.name).to.equal("Community Health Pool");
      expect(pool.admin).to.equal(admin.address);
      expect(pool.minContribution).to.equal(minContribution);
      expect(pool.status).to.equal(0); // Active
      expect(await healthcare.totalPools()).to.equal(1);
    });

    it("Should require minimum contribution", async function () {
      const { healthcare, admin } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await expect(
        healthcare.connect(admin).createPool(
          "Community Health Pool",
          "Description",
          ethers.parseEther("0.005"), // Below minimum
          ethers.parseEther("5")
        )
      ).to.be.revertedWith("Contribution too low");
    });

    it("Should require pool name", async function () {
      const { healthcare, admin } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await expect(
        healthcare.connect(admin).createPool(
          "",
          "Description",
          ethers.parseEther("0.1"),
          ethers.parseEther("5")
        )
      ).to.be.revertedWith("Name required");
    });
  });

  describe("Pool Membership & Contributions", function () {
    async function setupPoolFixture() {
      const fixture = await loadFixture(deployHealthcarePaymentsFixture);
      const { healthcare, admin, member1, member2 } = fixture;
      
      // Create pool
      const minContribution = ethers.parseEther("0.1");
      const maxClaimAmount = ethers.parseEther("5");
      await healthcare.connect(admin).createPool(
        "Community Health Pool",
        "For local community healthcare",
        minContribution,
        maxClaimAmount
      );
      
      // Register members
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      await healthcare.connect(member2).registerMember("Bob", "bob@example.com");
      
      return { ...fixture, minContribution, maxClaimAmount };
    }

    it("Should allow member to join pool with contribution", async function () {
      const { healthcare, member1, minContribution } = await loadFixture(setupPoolFixture);
      
      const contributionAmount = ethers.parseEther("0.5");
      
      await expect(
        healthcare.connect(member1).joinPool(1, { value: contributionAmount })
      ).to.emit(healthcare, "MemberJoinedPool")
        .withArgs(1, member1.address, await time.latest() + 1);
      
      const pool = await healthcare.getPool(1);
      expect(pool.memberCount).to.equal(1);
      
      // Check net contribution (after 2% fee)
      const expectedNetContribution = contributionAmount * BigInt(9800) / BigInt(10000);
      expect(pool.totalFunds).to.equal(expectedNetContribution);
    });

    it("Should not allow non-members to join pool", async function () {
      const { healthcare, other } = await loadFixture(setupPoolFixture);
      
      await expect(
        healthcare.connect(other).joinPool(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Not registered as member");
    });

    it("Should require minimum contribution to join", async function () {
      const { healthcare, member1, minContribution } = await loadFixture(setupPoolFixture);
      
      await expect(
        healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient contribution");
    });

    it("Should allow additional contributions", async function () {
      const { healthcare, member1 } = await loadFixture(setupPoolFixture);
      
      // Join pool first
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("0.5") });
      
      // Make additional contribution
      const additionalAmount = ethers.parseEther("0.3");
      await expect(
        healthcare.connect(member1).contributeToPool(1, { value: additionalAmount })
      ).to.emit(healthcare, "ContributionMade");
      
      const pool = await healthcare.getPool(1);
      const totalContributed = ethers.parseEther("0.8");
      const expectedNet = totalContributed * BigInt(9800) / BigInt(10000);
      expect(pool.totalFunds).to.equal(expectedNet);
    });

    it("Should accumulate platform fees in emergency fund", async function () {
      const { healthcare, member1, member2 } = await loadFixture(setupPoolFixture);
      
      const contribution1 = ethers.parseEther("0.5");
      const contribution2 = ethers.parseEther("0.7");
      
      await healthcare.connect(member1).joinPool(1, { value: contribution1 });
      await healthcare.connect(member2).joinPool(1, { value: contribution2 });
      
      const totalContributions = contribution1 + contribution2;
      const expectedFees = totalContributions * BigInt(200) / BigInt(10000); // 2%
      
      const stats = await healthcare.getStats();
      expect(stats[4]).to.equal(expectedFees); // emergencyFund
    });

    it("Should allow member to exit pool when no pending claims", async function () {
      const { healthcare, member1 } = await loadFixture(setupPoolFixture);
      
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("0.5") });
      
      await expect(healthcare.connect(member1).exitPool(1))
        .to.emit(healthcare, "MemberExitedPool")
        .withArgs(1, member1.address);
      
      const pool = await healthcare.getPool(1);
      expect(pool.memberCount).to.equal(0);
    });
  });

  describe("Claims Management", function () {
    async function setupClaimsFixture() {
      const fixture = await loadFixture(deployHealthcarePaymentsFixture);
      const { healthcare, owner, admin, member1, member2, provider1 } = fixture;
      
      // Create pool
      await healthcare.connect(admin).createPool(
        "Community Health Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      
      // Register members
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      await healthcare.connect(member2).registerMember("Bob", "bob@example.com");
      
      // Register and verify provider
      await healthcare.connect(provider1).registerProvider(
        "City Hospital",
        "LIC-12345",
        "General Medicine",
        "New York"
      );
      await healthcare.connect(owner).verifyProvider(provider1.address);
      
      // Members join pool
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("2") });
      await healthcare.connect(member2).joinPool(1, { value: ethers.parseEther("2") });
      
      return fixture;
    }

    it("Should allow member to submit a claim", async function () {
      const { healthcare, member1, provider1 } = await loadFixture(setupClaimsFixture);
      
      const requestedAmount = ethers.parseEther("1");
      
      await expect(
        healthcare.connect(member1).submitClaim(
          1, // poolId
          provider1.address,
          "Fever and cold",
          "General checkup and medication",
          requestedAmount,
          "QmXXX...ipfsHash"
        )
      ).to.emit(healthcare, "ClaimSubmitted");
      
      const claim = await healthcare.getClaim(1);
      expect(claim.member).to.equal(member1.address);
      expect(claim.provider).to.equal(provider1.address);
      expect(claim.requestedAmount).to.equal(requestedAmount);
      expect(claim.status).to.equal(0); // Pending
      expect(await healthcare.totalClaims()).to.equal(1);
    });

    it("Should not allow non-pool members to submit claims", async function () {
      const { healthcare, other, provider1, owner } = await loadFixture(setupClaimsFixture);
      
      // Register the other user
      await healthcare.connect(other).registerMember("Charlie", "charlie@example.com");
      
      await expect(
        healthcare.connect(other).submitClaim(
          1,
          provider1.address,
          "Diagnosis",
          "Treatment",
          ethers.parseEther("1"),
          "QmXXX"
        )
      ).to.be.revertedWith("Not a pool member");
    });

    it("Should require verified provider for claims", async function () {
      const { healthcare, member1, provider2 } = await loadFixture(setupClaimsFixture);
      
      // Register but don't verify provider2
      await healthcare.connect(provider2).registerProvider(
        "Another Hospital",
        "LIC-67890",
        "Cardiology",
        "Boston"
      );
      
      await expect(
        healthcare.connect(member1).submitClaim(
          1,
          provider2.address,
          "Diagnosis",
          "Treatment",
          ethers.parseEther("1"),
          "QmXXX"
        )
      ).to.be.revertedWith("Provider not verified");
    });

    it("Should not allow claim amount exceeding max claim", async function () {
      const { healthcare, member1, provider1 } = await loadFixture(setupClaimsFixture);
      
      await expect(
        healthcare.connect(member1).submitClaim(
          1,
          provider1.address,
          "Diagnosis",
          "Treatment",
          ethers.parseEther("6"), // Exceeds maxClaimAmount of 5
          "QmXXX"
        )
      ).to.be.revertedWith("Amount exceeds max claim");
    });

    it("Should allow pool admin to approve claim", async function () {
      const { healthcare, admin, member1, provider1 } = await loadFixture(setupClaimsFixture);
      
      // Submit claim
      const requestedAmount = ethers.parseEther("1");
      await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Fever",
        "Treatment",
        requestedAmount,
        "QmXXX"
      );
      
      const approvedAmount = ethers.parseEther("0.8");
      
      await expect(
        healthcare.connect(admin).approveClaim(1, approvedAmount)
      ).to.emit(healthcare, "ClaimProcessed")
        .withArgs(1, 1, approvedAmount, admin.address, await time.latest() + 1); // Status 1 = Approved
      
      const claim = await healthcare.getClaim(1);
      expect(claim.status).to.equal(1); // Approved
      expect(claim.approvedAmount).to.equal(approvedAmount);
    });

    it("Should allow pool admin to reject claim", async function () {
      const { healthcare, admin, member1, provider1 } = await loadFixture(setupClaimsFixture);
      
      // Submit claim
      await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Fever",
        "Treatment",
        ethers.parseEther("1"),
        "QmXXX"
      );
      
      await expect(
        healthcare.connect(admin).rejectClaim(1, "Insufficient documentation")
      ).to.emit(healthcare, "ClaimProcessed")
        .withArgs(1, 2, 0, admin.address, await time.latest() + 1); // Status 2 = Rejected
      
      const claim = await healthcare.getClaim(1);
      expect(claim.status).to.equal(2); // Rejected
      expect(claim.rejectionReason).to.equal("Insufficient documentation");
    });

    it("Should allow provider to receive payment for approved claim", async function () {
      const { healthcare, admin, member1, provider1 } = await loadFixture(setupClaimsFixture);
      
      // Submit claim
      const requestedAmount = ethers.parseEther("1");
      await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Fever",
        "Treatment",
        requestedAmount,
        "QmXXX"
      );
      
      // Approve claim
      const approvedAmount = ethers.parseEther("0.8");
      await healthcare.connect(admin).approveClaim(1, approvedAmount);
      
      // Get pool funds before
      const poolBefore = await healthcare.getPool(1);
      const providerBalanceBefore = await ethers.provider.getBalance(provider1.address);
      
      // Pay claim
      await expect(
        healthcare.connect(provider1).payClaim(1)
      ).to.emit(healthcare, "ClaimPaid")
        .withArgs(1, member1.address, provider1.address, approvedAmount, await time.latest() + 1);
      
      // Verify pool funds decreased
      const poolAfter = await healthcare.getPool(1);
      expect(poolAfter.totalFunds).to.equal(poolBefore.totalFunds - approvedAmount);
      expect(poolAfter.totalPaidClaims).to.equal(approvedAmount);
      
      // Verify claim status
      const claim = await healthcare.getClaim(1);
      expect(claim.status).to.equal(3); // Paid
      
      // Verify provider balance increased
      const providerBalanceAfter = await ethers.provider.getBalance(provider1.address);
      expect(providerBalanceAfter).to.be.gt(providerBalanceBefore);
    });

    it("Should not allow non-provider to claim payment", async function () {
      const { healthcare, admin, member1, member2, provider1 } = await loadFixture(setupClaimsFixture);
      
      // Submit and approve claim
      await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Fever",
        "Treatment",
        ethers.parseEther("1"),
        "QmXXX"
      );
      await healthcare.connect(admin).approveClaim(1, ethers.parseEther("0.8"));
      
      await expect(
        healthcare.connect(member2).payClaim(1)
      ).to.be.revertedWith("Not registered as provider");
    });

    it("Should update provider statistics after claim payment", async function () {
      const { healthcare, admin, member1, provider1 } = await loadFixture(setupClaimsFixture);
      
      // Submit and approve claim
      const approvedAmount = ethers.parseEther("0.8");
      await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Fever",
        "Treatment",
        ethers.parseEther("1"),
        "QmXXX"
      );
      await healthcare.connect(admin).approveClaim(1, approvedAmount);
      
      // Pay claim
      await healthcare.connect(provider1).payClaim(1);
      
      const provider = await healthcare.getProvider(provider1.address);
      expect(provider.totalClaimsProcessed).to.equal(1);
      expect(provider.totalAmountProcessed).to.equal(approvedAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct contract statistics", async function () {
      const { healthcare, admin, member1, provider1, owner } = await loadFixture(deployHealthcarePaymentsFixture);
      
      // Create pool
      await healthcare.connect(admin).createPool(
        "Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      
      // Register users
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      await healthcare.connect(provider1).registerProvider(
        "Hospital",
        "LIC-123",
        "Medicine",
        "City"
      );
      await healthcare.connect(owner).verifyProvider(provider1.address);
      
      // Join pool
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("1") });
      
      // Submit claim
      await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Diagnosis",
        "Treatment",
        ethers.parseEther("0.5"),
        "QmXXX"
      );
      
      const stats = await healthcare.getStats();
      expect(stats[0]).to.equal(1); // totalPools
      expect(stats[1]).to.equal(1); // totalMembers
      expect(stats[2]).to.equal(1); // totalProviders
      expect(stats[3]).to.equal(1); // totalClaims
      expect(stats[5]).to.equal(200); // platformFeePercent
    });

    it("Should return pool members list", async function () {
      const { healthcare, admin, member1, member2 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      // Setup
      await healthcare.connect(admin).createPool(
        "Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      await healthcare.connect(member2).registerMember("Bob", "bob@example.com");
      
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("1") });
      await healthcare.connect(member2).joinPool(1, { value: ethers.parseEther("1") });
      
      const members = await healthcare.getPoolMembers(1);
      expect(members).to.have.lengthOf(2);
      expect(members).to.include(member1.address);
      expect(members).to.include(member2.address);
    });

    it("Should return member pools", async function () {
      const { healthcare, admin, member1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      // Create two pools
      await healthcare.connect(admin).createPool(
        "Pool 1",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      await healthcare.connect(admin).createPool(
        "Pool 2",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("1") });
      await healthcare.connect(member1).joinPool(2, { value: ethers.parseEther("1") });
      
      const pools = await healthcare.getMemberPools(member1.address);
      expect(pools).to.have.lengthOf(2);
      expect(pools[0]).to.equal(1);
      expect(pools[1]).to.equal(2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      const { healthcare, owner } = await loadFixture(deployHealthcarePaymentsFixture);
      
      const newFee = 300; // 3%
      
      await expect(healthcare.connect(owner).updatePlatformFee(newFee))
        .to.emit(healthcare, "PlatformFeeUpdated")
        .withArgs(newFee);
      
      expect(await healthcare.platformFeePercent()).to.equal(newFee);
    });

    it("Should not allow fee above 5%", async function () {
      const { healthcare, owner } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await expect(
        healthcare.connect(owner).updatePlatformFee(600) // 6%
      ).to.be.revertedWith("Fee cannot exceed 5%");
    });

    it("Should allow owner to withdraw emergency fund", async function () {
      const { healthcare, owner, admin, member1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      // Setup and collect some fees
      await healthcare.connect(admin).createPool(
        "Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("10") });
      
      const stats = await healthcare.getStats();
      const emergencyFund = stats[4];
      expect(emergencyFund).to.be.gt(0);
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await healthcare.connect(owner).withdrawEmergencyFund(emergencyFund);
      
      const statsAfter = await healthcare.getStats();
      expect(statsAfter[4]).to.equal(0);
    });

    it("Should allow owner to replenish emergency fund", async function () {
      const { healthcare, owner } = await loadFixture(deployHealthcarePaymentsFixture);
      
      const amount = ethers.parseEther("5");
      
      await expect(
        healthcare.connect(owner).replenishEmergencyFund({ value: amount })
      ).to.emit(healthcare, "EmergencyFundReplenished")
        .withArgs(amount, await time.latest() + 1);
      
      const stats = await healthcare.getStats();
      expect(stats[4]).to.equal(amount);
    });

    it("Should update pool status", async function () {
      const { healthcare, admin } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await healthcare.connect(admin).createPool(
        "Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      
      await expect(healthcare.connect(admin).updatePoolStatus(1, 1)) // Pause
        .to.emit(healthcare, "PoolStatusUpdated")
        .withArgs(1, 1);
      
      const pool = await healthcare.getPool(1);
      expect(pool.status).to.equal(1); // Paused
    });

    it("Should only allow pool admin or owner to update pool status", async function () {
      const { healthcare, admin, other } = await loadFixture(deployHealthcarePaymentsFixture);
      
      await healthcare.connect(admin).createPool(
        "Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      
      await expect(
        healthcare.connect(other).updatePoolStatus(1, 1)
      ).to.be.revertedWith("Not pool admin");
    });
  });

  describe("Gas Usage", function () {
    it("Should report gas usage for key operations", async function () {
      const { healthcare, owner, admin, member1, provider1 } = await loadFixture(deployHealthcarePaymentsFixture);
      
      console.log("\n=== Gas Usage Report ===");
      
      // Member registration
      let tx = await healthcare.connect(member1).registerMember("Alice", "alice@example.com");
      let receipt = await tx.wait();
      console.log(`Member Registration: ${receipt.gasUsed.toString()} gas`);
      
      // Provider registration
      tx = await healthcare.connect(provider1).registerProvider(
        "Hospital",
        "LIC-123",
        "Medicine",
        "City"
      );
      receipt = await tx.wait();
      console.log(`Provider Registration: ${receipt.gasUsed.toString()} gas`);
      
      // Provider verification
      tx = await healthcare.connect(owner).verifyProvider(provider1.address);
      receipt = await tx.wait();
      console.log(`Provider Verification: ${receipt.gasUsed.toString()} gas`);
      
      // Pool creation
      tx = await healthcare.connect(admin).createPool(
        "Pool",
        "Description",
        ethers.parseEther("0.1"),
        ethers.parseEther("5")
      );
      receipt = await tx.wait();
      console.log(`Pool Creation: ${receipt.gasUsed.toString()} gas`);
      
      // Join pool
      tx = await healthcare.connect(member1).joinPool(1, { value: ethers.parseEther("1") });
      receipt = await tx.wait();
      console.log(`Join Pool: ${receipt.gasUsed.toString()} gas`);
      
      // Submit claim
      tx = await healthcare.connect(member1).submitClaim(
        1,
        provider1.address,
        "Diagnosis",
        "Treatment",
        ethers.parseEther("0.5"),
        "QmXXX"
      );
      receipt = await tx.wait();
      console.log(`Submit Claim: ${receipt.gasUsed.toString()} gas`);
      
      // Approve claim
      tx = await healthcare.connect(admin).approveClaim(1, ethers.parseEther("0.4"));
      receipt = await tx.wait();
      console.log(`Approve Claim: ${receipt.gasUsed.toString()} gas`);
      
      // Pay claim
      tx = await healthcare.connect(provider1).payClaim(1);
      receipt = await tx.wait();
      console.log(`Pay Claim: ${receipt.gasUsed.toString()} gas`);
      
      console.log("========================\n");
    });
  });
});
