import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('SurakshaSetu', () => {
  it('registers and verifies a document hash', async () => {
    const [admin, user] = await ethers.getSigners()
    const Factory = await ethers.getContractFactory('SurakshaSetu')
    const c = await Factory.deploy()
    await c.waitForDeployment()

    const hash = ethers.keccak256(ethers.toUtf8Bytes('doc'))
    await c.connect(user).register(hash)
    expect((await c.records(hash)).verified).to.equal(false)

    await c.connect(admin).verify(hash)
    expect((await c.records(hash)).verified).to.equal(true)
  })
})