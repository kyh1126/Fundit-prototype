import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FunditModule", (m) => {
  // FunditToken 컨트랙트 배포
  const funditToken = m.contract("FunditToken", []);
  
  // Fundit 컨트랙트 배포
  const funditContract = m.contract("Fundit", []);
  
  // Fundit 컨트랙트에 FunditToken 설정
  m.call(funditContract, "setFunditToken", [funditToken]);

  return { funditContract, funditToken };
});
