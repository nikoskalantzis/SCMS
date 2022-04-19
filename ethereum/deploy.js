//npm install @truffle/hdwallet-provider
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Web3 = require('web3')
const compiledFactory = require('./build/ProductFactory.json')

const provider = new HDWalletProvider(
  'primary main author double egg fatal hood stand stairs urban fade nurse',
  // endpoint!
  'https://rinkeby.infura.io/v3/d063e87e3b434784989e4145b91a4b30',
)
//create web3 instance and pass the provider to const
const web3 = new Web3(provider)

const deploy = async () => {
  //get accounts from provider
  const accounts = await web3.eth.getAccounts()

  console.log('Attempting to deploy from account', accounts[0])
  //The mnemonic phrase ganerates many accounts and getting the first

  //deployment statement
  const result = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: compiledFactory.evm.bytecode.object })
    .send({ gas: '5000000', from: accounts[0] })

  //console.log(JSON.stringify(compiledFactory.abi));
  console.log('Contract deployed to', result.options.address)
  //preventing a handling deployment
  provider.engine.stop()
}
deploy()

//run node deploy.js!!!
//After deploying visit rinkeby.etherscan.io
