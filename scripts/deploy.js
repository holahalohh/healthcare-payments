const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🏥 Deploying Healthcare Payments Contract to Celo Sepolia...\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name}`);
  console.log(`📡 Chain ID: ${network.chainId}\n`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`👤 Deployer address: ${deployerAddress}`);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log(`💰 Deployer balance: ${hre.ethers.formatEther(balance)} CELO\n`);

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no CELO! Please fund the account first.");
  }

  // Deploy the contract
  console.log("📝 Deploying HealthcarePayments contract...");
  const HealthcarePayments = await hre.ethers.getContractFactory("HealthcarePayments");
  const healthcarePayments = await HealthcarePayments.deploy();

  await healthcarePayments.waitForDeployment();
  const contractAddress = await healthcarePayments.getAddress();

  console.log(`✅ HealthcarePayments deployed to: ${contractAddress}\n`);

  // Get deployment transaction details
  const deploymentTx = healthcarePayments.deploymentTransaction();
  if (deploymentTx) {
    console.log(`📋 Deployment Transaction Hash: ${deploymentTx.hash}`);
    const receipt = await deploymentTx.wait();
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`💵 Gas Price: ${hre.ethers.formatUnits(receipt.gasPrice, "gwei")} gwei\n`);
  }

  // Verify initial contract state
  console.log("🔍 Verifying initial contract state...");
  const owner = await healthcarePayments.owner();
  const platformFee = await healthcarePayments.platformFeePercent();
  const stats = await healthcarePayments.getStats();

  console.log(`👑 Contract Owner: ${owner}`);
  console.log(`💵 Platform Fee: ${platformFee.toString()} basis points (${Number(platformFee) / 100}%)`);
  console.log(`📊 Total Pools: ${stats[0].toString()}`);
  console.log(`📊 Total Members: ${stats[1].toString()}`);
  console.log(`📊 Total Providers: ${stats[2].toString()}`);
  console.log(`📊 Total Claims: ${stats[3].toString()}`);
  console.log(`💰 Emergency Fund: ${hre.ethers.formatEther(stats[4])} CELO\n`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    contractName: "HealthcarePayments",
    deployer: deployerAddress,
    deploymentDate: new Date().toISOString(),
    transactionHash: deploymentTx ? deploymentTx.hash : null,
    gasUsed: deploymentTx ? (await deploymentTx.wait()).gasUsed.toString() : null,
    owner: owner,
    platformFee: platformFee.toString(),
    blockExplorerUrl: `https://sepolia.celoscan.io/address/${contractAddress}`,
    features: {
      poolManagement: true,
      memberRegistration: true,
      providerVerification: true,
      claimsProcessing: true,
      platformFees: true,
      emergencyFund: true
    },
    configuration: {
      minContribution: "0.01 CELO",
      maxClaimPercentage: "80%",
      platformFeePercent: `${Number(platformFee) / 100}%`,
      maxPlatformFee: "5%"
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `healthcare-payments-${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`💾 Deployment info saved to: ${deploymentFile}\n`);

  // Print contract verification command
  console.log("📝 To verify the contract on CeloScan, run:");
  console.log(`npx hardhat verify --network celoSepolia ${contractAddress}\n`);

  // Print interaction examples
  console.log("🎯 Contract Interaction Examples:\n");
  console.log("// Register as a member:");
  console.log(`const tx = await healthcarePayments.registerMember("John Doe", "john@example.com");`);
  console.log();
  console.log("// Create a healthcare pool:");
  console.log(`const tx = await healthcarePayments.createPool("Community Health Pool", ethers.parseEther("0.1"), ethers.parseEther("10"));`);
  console.log();
  console.log("// Join a pool:");
  console.log(`const tx = await healthcarePayments.joinPool(1, { value: ethers.parseEther("0.1") });`);
  console.log();
  console.log("// Submit a claim:");
  console.log(`const tx = await healthcarePayments.submitClaim(1, providerAddress, "Flu", "Medication", ethers.parseEther("0.5"), "ipfs://QmXXX...");`);
  console.log();

  console.log("✅ Deployment completed successfully!\n");
  console.log(`🌐 View on CeloScan: https://sepolia.celoscan.io/address/${contractAddress}`);
  console.log(`🌐 View transactions: https://sepolia.celoscan.io/address/${contractAddress}#transactions\n`);

  return {
    contractAddress,
    owner,
    deployer: deployerAddress
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
