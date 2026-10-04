import { network } from "hardhat";

const { ethers } = await network.create();

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying with:", deployer.address);

    const MockUSDC =
        await ethers.getContractFactory("MockUSDC");

    const token = await MockUSDC.deploy();

    await token.waitForDeployment();

    console.log(
        "MockUSDC deployed to:",
        await token.getAddress()
    );

    const ChainRemit =
        await ethers.getContractFactory("ChainRemit");

    const chainRemit = await ChainRemit.deploy(
        await token.getAddress()
    );

    await chainRemit.waitForDeployment();

    console.log(
        "ChainRemit deployed to:",
        await chainRemit.getAddress()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});