import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("ChainRemit", function () {

    it("should allow a registered user to create a remittance", async function () {

        const [owner, alice, bob] = await ethers.getSigners();

        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();

        const ChainRemit = await ethers.getContractFactory("ChainRemit");
        const chainRemit = await ChainRemit.deploy(
            await mockUSDC.getAddress()
        );

        await chainRemit.connect(alice).registerUser();
        await chainRemit.connect(bob).registerUser();

        const amount = ethers.parseUnits("100", 6);

        await mockUSDC.transfer(alice.address, amount);

        await mockUSDC
            .connect(alice)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(alice)
            .sendRemittance(bob.address, amount);

        const remittance = await chainRemit.remittances(0);

        assert.equal(remittance.sender, alice.address);
        assert.equal(remittance.recipient, bob.address);
    });

});