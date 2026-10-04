import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("ChainRemit", async () => {

    it("allow registered user to create remittance", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        const remittance =
            await chainRemit.remittances(0);

        assert.equal(remittance.sender, sender.address);
        assert.equal(remittance.recipient, recipient.address);
        assert.equal(remittance.amount, amount);
    });


    it("recipient can withdraw", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        const recipientBalanceBefore =
            await token.balanceOf(recipient.address);

        await chainRemit
            .connect(recipient)
            .withdraw(0);

        const recipientBalanceAfter =
            await token.balanceOf(recipient.address);

        assert.equal(
            recipientBalanceAfter - recipientBalanceBefore,
            995_000n
        );
    });


    it("non-recipient cannot withdraw", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient, attacker] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        await assert.rejects(
            chainRemit
                .connect(attacker)
                .withdraw(0),
            /Not the recipient/
        );
    });


    it("cannot withdraw twice", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        await chainRemit
            .connect(recipient)
            .withdraw(0);

        await assert.rejects(
            chainRemit
                .connect(recipient)
                .withdraw(0),
            /Already withdrawn/
        );
    });


    it("correct fee and claimable amount", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        const remittance =
            await chainRemit.remittances(0);

        assert.equal(remittance.fee, 50_000n);
        assert.equal(
            remittance.claimableAmount,
            9_950_000n
        );
    });


    it("unregistered sender is blocked", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(recipient).registerUser();

        await assert.rejects(
            chainRemit
                .connect(sender)
                .sendRemittance(
                    recipient.address,
                    1_000_000n
                ),
            /Sender not registered/
        );
    });


    it("unregistered recipient is blocked", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();

        await assert.rejects(
            chainRemit
                .connect(sender)
                .sendRemittance(
                    recipient.address,
                    1_000_000n
                ),
            /Recipient not registered/
        );
    });


    it("zero amount is blocked", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        await assert.rejects(
            chainRemit
                .connect(sender)
                .sendRemittance(
                    recipient.address,
                    0n
                ),
            /Amount must be greater than zero/
        );
    });


    it("zero address recipient is blocked", async () => {
        const { ethers } = await network.create();

        const [owner, sender] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();

        await assert.rejects(
            chainRemit
                .connect(sender)
                .sendRemittance(
                    ethers.ZeroAddress,
                    1_000_000n
                ),
            /Invalid recipient/
        );
    });


    it("only owner can change fee", async () => {
        const { ethers } = await network.create();

        const [owner, sender] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit
            .connect(owner)
            .setFee(100);

        assert.equal(
            await chainRemit.feeBasisPoints(),
            100n
        );

        await assert.rejects(
            chainRemit
                .connect(sender)
                .setFee(200),
            /OwnableUnauthorizedAccount/
        );
    });


    it("fee above maximum is blocked", async () => {
        const { ethers } = await network.create();

        const [owner] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await assert.rejects(
            chainRemit.setFee(1001),
            /Fee too high/
        );
    });


    it("maximum fee of 1000 basis points is allowed", async () => {
        const { ethers } = await network.create();

        const [owner] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.setFee(1000);

        assert.equal(
            await chainRemit.feeBasisPoints(),
            1000n
        );
    });


    it("contract holds remittance tokens", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        const contractBalance =
            await token.balanceOf(
                await chainRemit.getAddress()
            );

        assert.equal(
            contractBalance,
            amount
        );
    });


    it("accumulated fee is correct", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(recipient.address, amount);

        assert.equal(
            await chainRemit.accumulatedFees(),
            50_000n
        );
    });


    it("multiple remittances receive different IDs", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;
        const totalAmount = 2_000_000n;

        await token.transfer(sender.address, totalAmount);

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                totalAmount
            );

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        const first =
            await chainRemit.remittances(0);

        const second =
            await chainRemit.remittances(1);

        assert.equal(first.amount, amount);
        assert.equal(second.amount, amount);
        assert.equal(first.sender, sender.address);
        assert.equal(second.sender, sender.address);
    });


    it("withdrawal marks remittance completed", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        await chainRemit
            .connect(recipient)
            .withdraw(0);

        const remittance =
            await chainRemit.remittances(0);

        assert.equal(remittance.completed, true);
        assert.equal(
            remittance.claimableAmount,
            0n
        );
    });


    it("updated fee applies to new remittances", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        await chainRemit.setFee(100);

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        const remittance =
            await chainRemit.remittances(0);

        assert.equal(remittance.fee, 100_000n);
    });


    it("supports remittances from different senders", async () => {
        const { ethers } = await network.create();

        const [owner, sender1, sender2, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender1).registerUser();
        await chainRemit.connect(sender2).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender1.address, amount);
        await token.transfer(sender2.address, amount);

        await token
            .connect(sender1)
            .approve(await chainRemit.getAddress(), amount);

        await token
            .connect(sender2)
            .approve(await chainRemit.getAddress(), amount);

        await chainRemit
            .connect(sender1)
            .sendRemittance(
                recipient.address,
                amount
            );

        await chainRemit
            .connect(sender2)
            .sendRemittance(
                recipient.address,
                amount
            );

        const first =
            await chainRemit.remittances(0);

        const second =
            await chainRemit.remittances(1);

        assert.equal(first.sender, sender1.address);
        assert.equal(second.sender, sender2.address);
    });


    it("insufficient token balance is blocked", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                amount
            );

        await assert.rejects(
            chainRemit
                .connect(sender)
                .sendRemittance(
                    recipient.address,
                    amount
                )
        );
    });


    it("insufficient allowance is blocked", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 1_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                500_000n
            );

        await assert.rejects(
            chainRemit
                .connect(sender)
                .sendRemittance(
                    recipient.address,
                    amount
                )
        );
    });


    it("repeated registration keeps user registered", async () => {
        const { ethers } = await network.create();

        const [owner, sender] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit
            .connect(sender)
            .registerUser();

        await chainRemit
            .connect(sender)
            .registerUser();

        assert.equal(
            await chainRemit.isRegistered(sender.address),
            true
        );
    });


    it("owner can withdraw accumulated fees", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                amount
            );

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        const feesBefore =
            await chainRemit.accumulatedFees();

        assert.equal(
            feesBefore,
            50_000n
        );

        const ownerBalanceBefore =
            await token.balanceOf(owner.address);

        await chainRemit
            .connect(owner)
            .withdrawFees(owner.address);

        const ownerBalanceAfter =
            await token.balanceOf(owner.address);

        assert.equal(
            ownerBalanceAfter - ownerBalanceBefore,
            50_000n
        );
    });


    it("non-owner cannot withdraw fees", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                amount
            );

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        await assert.rejects(
            chainRemit
                .connect(sender)
                .withdrawFees(sender.address),
            /OwnableUnauthorizedAccount/
        );
    });


    it("fees become zero after withdrawal", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                amount
            );

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        await chainRemit
            .connect(owner)
            .withdrawFees(owner.address);

        assert.equal(
            await chainRemit.accumulatedFees(),
            0n
        );
    });


    it("zero address fee recipient is rejected", async () => {
        const { ethers } = await network.create();

        const [owner] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await assert.rejects(
            chainRemit
                .connect(owner)
                .withdrawFees(ethers.ZeroAddress),
            /Invalid recipient/
        );
    });
    it("fee withdrawal does not affect pending remittance", async () => {
        const { ethers } = await network.create();

        const [owner, sender, recipient] =
            await ethers.getSigners();

        const MockUSDC =
            await ethers.getContractFactory("MockUSDC");

        const token = await MockUSDC.deploy();

        const ChainRemit =
            await ethers.getContractFactory("ChainRemit");

        const chainRemit = await ChainRemit.deploy(
            await token.getAddress()
        );

        await chainRemit.connect(sender).registerUser();
        await chainRemit.connect(recipient).registerUser();

        const amount = 10_000_000n;

        await token.transfer(sender.address, amount);

        await token
            .connect(sender)
            .approve(
                await chainRemit.getAddress(),
                amount
            );

        await chainRemit
            .connect(sender)
            .sendRemittance(
                recipient.address,
                amount
            );

        await chainRemit
            .connect(owner)
            .withdrawFees(owner.address);

        const recipientBalanceBefore =
            await token.balanceOf(recipient.address);

        await chainRemit
            .connect(recipient)
            .withdraw(0);

        const recipientBalanceAfter =
            await token.balanceOf(recipient.address);

        assert.equal(
            recipientBalanceAfter - recipientBalanceBefore,
            9_950_000n
        );
    });

});