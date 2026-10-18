const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AetheronToken V2 security', function () {
  async function deploy(initialSupply = 0n) {
    const [owner, minter, outsider, timelock] = await ethers.getSigners();
    const token = await ethers.deployContract('AetheronToken', [initialSupply, owner.address]);
    await token.waitForDeployment();
    return { token, owner, minter, outsider, timelock };
  }

  it('rejects unauthorized minting', async function () {
    const { token, outsider } = await deploy();
    await expect(token.connect(outsider).mint(outsider.address, 1n)).to.be.revertedWithCustomError(
      token,
      'NotMinter'
    );
  });

  it('enforces the global supply cap', async function () {
    const { token, owner } = await deploy();
    const cap = await token.MAX_SUPPLY();
    await token.mint(owner.address, cap);
    expect(await token.totalSupply()).to.equal(cap);
    await expect(token.mint(owner.address, 1n)).to.be.revertedWithCustomError(
      token,
      'SupplyCapExceeded'
    );
  });

  it('restricts minter grants to owner and permits revocation', async function () {
    const { token, minter, outsider } = await deploy();
    await expect(token.connect(outsider).grantMinter(minter.address)).to.be.reverted;
    await token.grantMinter(minter.address);
    await token.connect(minter).mint(minter.address, 1n);
    await token.revokeMinter(minter.address);
    await expect(token.connect(minter).mint(minter.address, 1n)).to.be.revertedWithCustomError(
      token,
      'NotMinter'
    );
  });

  it('requires the pending owner to accept the handoff', async function () {
    const { token, owner, outsider, timelock } = await deploy();
    await token.transferOwnership(timelock.address);
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.pendingOwner()).to.equal(timelock.address);
    await expect(token.connect(outsider).acceptOwnership()).to.be.reverted;
    await token.connect(timelock).acceptOwnership();
    expect(await token.owner()).to.equal(timelock.address);
  });
});
