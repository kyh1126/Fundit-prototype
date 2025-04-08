import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FunditModule", (m) => {
  // Deploy FunditToken contract
  const funditToken = m.contract("FunditToken", []);
  
  // Deploy Fundit contract
  const funditContract = m.contract("Fundit", []);
  
  // Set FunditToken in Fundit contract
  m.call(funditContract, "setFunditToken", [funditToken]);

  return { funditContract, funditToken };
});
