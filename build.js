const fs = require('fs')

const dpack   = require('@etherpacks/dpack')
const gemfab  = require('./lib/ricobank/artifacts/lib/gemfab/src/gem.sol/GemFab.json')
const gem = require('./lib/ricobank/artifacts/lib/gemfab/src/gem.sol/Gem.json')

async function build(network, gf_address) {
  const builder = new dpack.PackBuilder(network)
  const json = JSON.stringify

  const gf_artifact = {
    abi: gemfab.abi,
    bytecode: gemfab.bytecode
  }
  const gem_artifact = {
    abi: gem.abi,
    bytecode: gem.bytecode
  }

  fs.writeFileSync(`./link/GemFab.json`, json(gf_artifact))
  fs.writeFileSync(`./link/Gem.json`, json(gem_artifact))

  await builder.packType({
    typename: 'Gem',
    artifact: gem_artifact
  })
  await builder.packObject({
    objectname: 'gemfab',
    typename: 'GemFab',
    artifact: gf_artifact,
    address: gf_address
  })

  const pack = await builder.build();

  const cid = await dpack.putIpfsJson(pack, true)
  console.log(`  ${network} pack @ ${cid}`)
  fs.writeFileSync(`./pack/gemfab_${network}.dpack.json`, JSON.stringify(pack, null, 2));
}

console.log("Writing packs:")
build('arbitrum', '0x5C635933743B93BC1C51B4798C984867Fc31BFC7')
build('sepolia', '0x708a8cB4Fe21717a827EE6De133B1Ad9a954B60a')
build('arbitrum_sepolia', '0x708a8cB4Fe21717a827EE6De133B1Ad9a954B60a')

