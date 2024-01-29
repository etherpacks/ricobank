const fs = require('fs')
const dpack   = require('@etherpacks/dpack')

const gfpackcids = {
  arbitrum: 'bafkreibhkoqc5nda6dlubyvsylethk5nxqynjltnsxnlmpc7inpcmiveom',
  arbitrum_sepolia: 'bafkreibhbhwmjnlxlt5iq4lz6wgvmulnlw3g6umni4iwst3j6wrqq2il5e',
  sepolia: 'bafkreifrnexd7p2g4hjaujq7to6dbshas2fivgxswtry55qewu4jqjmw4q'
}

const unipackcids = {
  arbitrum: 'bafkreialni6kkfqiqouimprjqm4opy442373pugwhv4gf3hxztaw7vfccy',
  goerli: 'bafkreidmspy2c7g7xe5ghg4fdp3svrvwj7xd33weq3wwebgzr42redzj2i',
  sepolia: 'bafkreiamg5nrpk5r2tvayrzt344vulxno4d3houxsdndwrdj5diulkfxau'
}
const clpackcids = {
  arbitrum: 'bafkreicgef4oib3sjjtdi5wwfrk724ubncs5pa7igcealla3d6gwnaff3q',
}

const ADDRS = {
  sepolia: {
    ball: '0xe388Fc6d7f1ebf158e316656D3E0556700852e8A',
    bank: '0x343d30cCCe6c02987329C4fE2664E20F0aD39aa2',
    multiplier: '0xd3D6332a94ba49BA55EC1E51ABc43a67a46cBb57',
    divider: '0x20A3e14b06DCD8Fd8eC582acC1cE1A08b698fa8e',
    uniwrapper: '0x7fA88e1014B0640833a03ACfEC71F242b5fBDC85',
    uniswapv3adapter: '0x3f3472F3Fa4D335e3D809B0b148b8A08180a449E',
    chainlinkadapter: '0xB8742666c2C4787D8790Cc03c508E59820DD65fd',
    feedbase: '0x16Bb244cd38C2B5EeF3E5a1d5F7B6CC56d52AeF3',

    ricorisk: '0x5dD4Ff6070629F879353d02fFdA3404085298669',
    ricodai: '0x6443Da3Df6DAE6F33e53611f31ec90d101Bf7FbF',
    gems: {
      rico: '0x6c9BFDfBbAd23418b5c19e4c7aF2f926ffAbaDfa',
      risk: '0xD612c560050D0f01d03E6fd471A28DCe48AB795e',
      dai:  '0x290eCE67DDA5eEc618b3Bb5DF04BE96f38894e29',
      wdiveth: '0x69619b71b52826B93205299e33259E1547ff3331',
      stable: '0x698DEE4d8b5B9cbD435705ca523095230340D875',
      arb: '0x3c6765dd58D75786CD2B20968Aa13beF2a1D85B8',
    },
    pools: {
      ricodai: '0x6443Da3Df6DAE6F33e53611f31ec90d101Bf7FbF',
      ricorisk: '0x5dD4Ff6070629F879353d02fFdA3404085298669'
    }
  }
}

const ball = require('./lib/ricobank/artifacts/src/ball.sol/Ball.json')
const bank = require('./lib/ricobank/artifacts/hardhat-diamond-abi/HardhatDiamondABI.sol/BankDiamond.json')
const ricorisk = require('./lib/ricobank/artifacts/src/ball.sol/Ball.json')
const divider = require('./lib/ricobank/artifacts/lib/feedbase/src/combinators/Divider.sol/Divider.json')
const multiplier = require('./lib/ricobank/artifacts/lib/feedbase/src/combinators/Multiplier.sol/Multiplier.json')
const feedbase = require('./lib/ricobank/artifacts/lib/feedbase/src/Feedbase.sol/Feedbase.json')
const uniwrapper = require('./lib/ricobank/lib/feedbase/artifacts/src/adapters/UniWrapper.sol/UniWrapper.json')
const uniswapv3adapter = require('./lib/ricobank/artifacts/lib/feedbase/src/adapters/UniswapV3Adapter.sol/UniswapV3Adapter.json')
const chainlinkadapter = require('./lib/ricobank/artifacts/lib/feedbase/src/adapters/ChainlinkAdapter.sol/ChainlinkAdapter.json')

async function buildrb(network) {
  const addrs = ADDRS[network]
  const builder = new dpack.PackBuilder(network)
  const json = JSON.stringify

  const gf_pack = await dpack.getIpfsJson(gfpackcids[network])

  const uni_pack = await dpack.getIpfsJson(unipackcids[network])

  await builder.merge(gf_pack, uni_pack)


  const artifacts = {
    ball: { abi: ball.abi, bytecode: ball.bytecode },
    bank: { abi: bank.abi, bytecode: bank.bytecode },
    divider: { abi: divider.abi, bytecode: divider.bytecode },
    multiplier: { abi: multiplier.abi, bytecode: multiplier.bytecode },
    feedbase: { abi: feedbase.abi, bytecode: feedbase.bytecode },
    uniwrapper: { abi: uniwrapper.abi, bytecode: uniwrapper.bytecode },
    uniswapv3adapter: { abi: uniswapv3adapter.abi, bytecode: uniswapv3adapter.bytecode },
    chainlinkadapter: { abi: chainlinkadapter.abi, bytecode: chainlinkadapter.bytecode }
  }

  for (let i of [
    ['Ball', 'ball'],
    ['BankDiamond', 'bank'],
    ['Divider', 'divider'],
    ['Multiplier', 'multiplier'],
    ['Feedbase', 'feedbase'],
    ['UniWrapper', 'uniwrapper'],
    ['UniswapV3Adapter', 'uniswapv3adapter'],
    ['ChainlinkAdapter', 'chainlinkadapter']
  ]) {

    if (!ADDRS[network][i[1]]) throw new Error(`no address for ${i[1]}`)

    await builder.packObject({
      objectname: i[1],
      typename: i[0],
      artifact: artifacts[i[1]],
      address: ADDRS[network][i[1]]
    })
  }

  let pack = builder.build()
  let pool_artifact = await dpack.getIpfsJson(pack.types.UniswapV3Pool.artifact['/'])
  let pools = ADDRS[network].pools
  for (let poolname in pools) {
    const pooladdr = pools[poolname]
    await builder.packObject({
      objectname: poolname,
      typename: 'UniswapV3Pool',
      artifact: { abi: pool_artifact.abi, bytecode: pool_artifact.bytecode },
      address: pools[poolname]
    }, false)
  }

  let gems = ADDRS[network].gems
  let gem_artifact = await dpack.getIpfsJson(pack.types.Gem.artifact['/'])
  for (let gemname in gems) {
    const gemaddr = gems[gemname]
    await builder.packObject({
      objectname: gemname,
      typename: 'Gem',
      artifact: { abi: gem_artifact.abi, bytecode: gem_artifact.bytecode },
      address: gems[gemname]
    }, false)
  }


  pack = await builder.build();

  const cid = await dpack.putIpfsJson(pack, true)
  console.log(`  ${network} pack @ ${cid}`)
  fs.writeFileSync(`./pack/ricobank_${network}.dpack.json`, JSON.stringify(pack, null, 2));
}

console.log("Writing ricobank packs:")
buildrb('sepolia')
