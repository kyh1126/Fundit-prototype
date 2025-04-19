import { ethers } from "hardhat";
import { Fundit } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

export async function deployFunditFixture() {
    const [owner, user, insuranceCompany, oracle] = await ethers.getSigners();

    const Fundit = await ethers.getContractFactory("Fundit");
    const fundit = await Fundit.deploy();
    await fundit.waitForDeployment();

    return { fundit, owner, user, insuranceCompany, oracle };
} 