import { ethers } from "hardhat";

async function main() {
  // FunditToken 배포
  const FunditToken = await ethers.getContractFactory("FunditToken");
  const funditToken = await FunditToken.deploy();
  await funditToken.waitForDeployment();
  const funditTokenAddress = await funditToken.getAddress();
  console.log("FunditToken deployed to:", funditTokenAddress);

  // Fundit 배포
  const Fundit = await ethers.getContractFactory("Fundit");
  const fundit = await Fundit.deploy([funditTokenAddress]);
  await fundit.waitForDeployment();
  console.log("Fundit deployed to:", await fundit.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 