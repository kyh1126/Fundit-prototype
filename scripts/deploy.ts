import hre from "hardhat";

async function main() {
  // FunditToken 배포
  const funditToken = await hre.viem.deployContract("FunditToken");
  console.log("FunditToken deployed to:", funditToken.address);

  // Fundit 배포
  const fundit = await hre.viem.deployContract("Fundit");
  console.log("Fundit deployed to:", fundit.address);

  // Fundit에 FunditToken 설정
  await fundit.write.setFunditToken([funditToken.address]);
  console.log("FunditToken set in Fundit contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 