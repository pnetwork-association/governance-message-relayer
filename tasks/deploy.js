task('deploy:GovernanceMessageVerifier', 'Deploy a GovernanceMessageVerifier contract').setAction(async () => {
  const GovernanceMessageVerifier = await ethers.getContractFactory('GovernanceMessageVerifier')
  const governanceMessageVerifier = await GovernanceMessageVerifier.deploy()
  console.log('GovernanceMessageVerifier deployed at:', governanceMessageVerifier.address)
})

task('deploy:GovernanceMessageHandler', 'Deploy a GovernanceMessageHandler contract')
  .addPositionalParam('governanceMessageVerifier')
  .addPositionalParam('sourceChainId')
  .setAction(async (_args) => {
    const GovernanceMessageHandler = await ethers.getContractFactory('GovernanceMessageHandler')
    const governanceMessageHandler = await GovernanceMessageHandler.deploy(
      _args.governanceMessageVerifier,
      _args.sourceChainId
    )
    console.log('GovernanceMessageHandler deployed at:', governanceMessageHandler.address)
  })
