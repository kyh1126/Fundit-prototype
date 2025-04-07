import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { NFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFT", function () {
  async function deployNFTFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(owner.address);
    await nft.waitForDeployment();

    return { nft, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nft, owner } = await loadFixture(deployNFTFixture);
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.name()).to.equal("DataToken");
      expect(await nft.symbol()).to.equal("DTT");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "ipfs://QmTest123";
      
      await nft.safeMint(addr1.address, tokenURI);
      
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should increment token ID correctly", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      
      await nft.safeMint(addr1.address, "ipfs://QmTest1");
      await nft.safeMint(addr1.address, "ipfs://QmTest2");
      
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.ownerOf(2)).to.equal(addr1.address);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const { nft, addr1, addr2 } = await loadFixture(deployNFTFixture);
      
      await expect(
        nft.connect(addr1).safeMint(addr2.address, "ipfs://QmTest")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });
}); 