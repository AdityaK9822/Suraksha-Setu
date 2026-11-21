import { ethers } from 'hardhat'

async function main() {
  const Factory = await ethers.getContractFactory('SurakshaSetu')
  const c = await Factory.deploy()
  await c.waitForDeployment()
  console.log('SurakshaSetu deployed to:', await c.getAddress())
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})