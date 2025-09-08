const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying FairDraw contract to Base network...");

  // Base network Chainlink VRF Coordinator address
  const VRF_COORDINATOR_BASE = "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634";
  
  // You'll need to create a Chainlink VRF subscription and fund it with LINK
  // Visit: https://vrf.chain.link/base
  const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "1"; // Replace with your subscription ID

  // Deploy the contract
  const FairDraw = await ethers.getContractFactory("FairDraw");
  const fairDraw = await FairDraw.deploy(SUBSCRIPTION_ID, VRF_COORDINATOR_BASE);

  await fairDraw.deployed();

  console.log("FairDraw deployed to:", fairDraw.address);
  console.log("VRF Subscription ID:", SUBSCRIPTION_ID);
  console.log("VRF Coordinator:", VRF_COORDINATOR_BASE);

  // Verify the contract on Basescan
  if (process.env.BASESCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await fairDraw.deployTransaction.wait(6);
    
    console.log("Verifying contract on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: fairDraw.address,
        constructorArguments: [SUBSCRIPTION_ID, VRF_COORDINATOR_BASE],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: fairDraw.address,
    vrfCoordinator: VRF_COORDINATOR_BASE,
    subscriptionId: SUBSCRIPTION_ID,
    network: "base",
    deployedAt: new Date().toISOString(),
    deployer: await fairDraw.signer.getAddress()
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./src/contracts/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to src/contracts/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
