import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";
import hre from "hardhat";

describe("NFT", function () {
  async function deployNFTFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    
    const nft = await hre.viem.deployContract("NFT");
    
    return { 
      nft, 
      owner: owner.account.address, 
      addr1: addr1.account.address, 
      addr2: addr2.account.address,
      publicClient,
      ownerClient: owner,
      addr1Client: addr1,
      addr2Client: addr2
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nft, owner } = await loadFixture(deployNFTFixture);
      expect(await nft.read.owner()).to.equal(getAddress(owner));
    });

    it("Should have correct name and symbol", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.read.name()).to.equal("DataToken");
      expect(await nft.read.symbol()).to.equal("DTT");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const { nft, owner, addr1, publicClient } = await loadFixture(deployNFTFixture);
      const tokenURI = "ipfs://QmTest123";
      
      await nft.write.safeMint([addr1, tokenURI]);
      
      expect(await nft.read.ownerOf([1n])).to.equal(getAddress(addr1));
      expect(await nft.read.tokenURI([1n])).to.equal(tokenURI);
    });

    it("Should increment token ID correctly", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      
      await nft.write.safeMint([addr1, "ipfs://QmTest1"]);
      await nft.write.safeMint([addr1, "ipfs://QmTest2"]);
      
      expect(await nft.read.ownerOf([1n])).to.equal(getAddress(addr1));
      expect(await nft.read.ownerOf([2n])).to.equal(getAddress(addr1));
    });

    it("Should fail if non-owner tries to mint", async function () {
      const { nft, addr1Client, addr2 } = await loadFixture(deployNFTFixture);
      
      await expect(
        nft.write.safeMint([addr2, "ipfs://QmTest"], { account: addr1Client.account })
      ).to.be.rejected;
    });
  });

  describe("Pausable", function () {
    it("Should allow minting when not paused", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      await nft.write.safeMint([addr1, "ipfs://QmTest"]);
      expect(await nft.read.ownerOf([1n])).to.equal(getAddress(addr1));
    });

    it("Should prevent minting when paused", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      await nft.write.pause();
      await expect(
        nft.write.safeMint([addr1, "ipfs://QmTest"])
      ).to.be.rejected;
    });

    it("Should allow minting after unpause", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      await nft.write.pause();
      await nft.write.unpause();
      await nft.write.safeMint([addr1, "ipfs://QmTest"]);
      expect(await nft.read.ownerOf([1n])).to.equal(getAddress(addr1));
    });

    it("Should prevent non-owner from pausing", async function () {
      const { nft, addr1Client } = await loadFixture(deployNFTFixture);
      await expect(
        nft.write.pause({ account: addr1Client.account })
      ).to.be.rejected;
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple tokens", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      const uris = ["ipfs://QmTest1", "ipfs://QmTest2", "ipfs://QmTest3"];
      
      await nft.write.batchMint([addr1, uris]);
      
      expect(await nft.read.ownerOf([1n])).to.equal(getAddress(addr1));
      expect(await nft.read.ownerOf([2n])).to.equal(getAddress(addr1));
      expect(await nft.read.ownerOf([3n])).to.equal(getAddress(addr1));
      expect(await nft.read.tokenURI([1n])).to.equal(uris[0]);
      expect(await nft.read.tokenURI([2n])).to.equal(uris[1]);
      expect(await nft.read.tokenURI([3n])).to.equal(uris[2]);
    });

    it("Should fail batch minting when paused", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      const uris = ["ipfs://QmTest1", "ipfs://QmTest2"];
      
      await nft.write.pause();
      await expect(
        nft.write.batchMint([addr1, uris])
      ).to.be.rejected;
    });

    it("Should fail batch minting with empty array", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      const uris: string[] = [];
      
      await expect(
        nft.write.batchMint([addr1, uris])
      ).to.be.rejected;
    });

    it("Should fail batch minting with too large batch size", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNFTFixture);
      const uris = Array(101).fill("ipfs://QmTest");
      
      await expect(
        nft.write.batchMint([addr1, uris])
      ).to.be.rejected;
    });
  });

  describe("Metadata Management", function () {
    it("Should allow token owner to update token URI", async function () {
      const { nft, owner, addr1, addr1Client } = await loadFixture(deployNFTFixture);
      const initialURI = "ipfs://QmTest1";
      const newURI = "ipfs://QmTest2";
      
      await nft.write.safeMint([addr1, initialURI]);
      await nft.write.updateTokenURI([1n, newURI], { account: addr1Client.account });
      
      expect(await nft.read.tokenURI([1n])).to.equal(newURI);
      expect(await nft.read.getMetadataVersion([1n])).to.equal(1n);
    });

    it("Should fail if non-owner tries to update token URI", async function () {
      const { nft, owner, addr1, addr2, addr2Client } = await loadFixture(deployNFTFixture);
      const initialURI = "ipfs://QmTest1";
      const newURI = "ipfs://QmTest2";
      
      await nft.write.safeMint([addr1, initialURI]);
      await expect(
        nft.write.updateTokenURI([1n, newURI], { account: addr2Client.account })
      ).to.be.rejected;
    });

    it("Should fail to update non-existent token URI", async function () {
      const { nft, owner, addr1, addr1Client } = await loadFixture(deployNFTFixture);
      const newURI = "ipfs://QmTest2";
      
      await expect(
        nft.write.updateTokenURI([1n, newURI], { account: addr1Client.account })
      ).to.be.rejected;
    });

    it("Should increment metadata version on update", async function () {
      const { nft, owner, addr1, addr1Client } = await loadFixture(deployNFTFixture);
      const initialURI = "ipfs://QmTest1";
      const newURI1 = "ipfs://QmTest2";
      const newURI2 = "ipfs://QmTest3";
      
      await nft.write.safeMint([addr1, initialURI]);
      expect(await nft.read.getMetadataVersion([1n])).to.equal(0n);
      
      await nft.write.updateTokenURI([1n, newURI1], { account: addr1Client.account });
      expect(await nft.read.getMetadataVersion([1n])).to.equal(1n);
      
      await nft.write.updateTokenURI([1n, newURI2], { account: addr1Client.account });
      expect(await nft.read.getMetadataVersion([1n])).to.equal(2n);
    });
  });
}); 