import hre from "hardhat";

async function main() {
  const address = "0x4CfA61dABeE04795513fa8EC90DeCfBcC51037D5";
  const balance = await hre.ethers.provider.getBalance(address);
  console.log(`\nWallet:  ${address}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} Sepolia ETH`);
  
  const needed = hre.ethers.parseEther("0.003");
  if (balance >= needed) {
    console.log(`Status:  ✔ Sufficient funds for deployment!\n`);
  } else {
    console.log(`Status:  ✖ Insufficient funds. Need at least 0.003 ETH.`);
    console.log(`         Go to https://cloud.google.com/application/web3/faucet/ethereum/sepolia\n`);
  }
}

main().catch(console.error);
