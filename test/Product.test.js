const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider())

const compiledFactory = require('../ethereum/build/ProductFactory.json')
const compiledProduct = require('../ethereum/build/ProductManager.json')

let accounts
let factory
let productAddress
let product

beforeEach(async () => {
  accounts = await web3.eth.getAccounts()

  factory = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: compiledFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: '5000000' })

  await factory.methods.createProduct('14995692880814596164774009477').send({
    from: accounts[0],
    gas: '5000000',
  })

  //assign the first element of array to productAddress
  ;[productAddress] = await factory.methods.getDeployedProducts().call()
  product = await new web3.eth.Contract(compiledProduct.abi, productAddress)
})

// call() for non-modifying data n send() for modifying data
describe('Products', () => {
  it('deploys a ProductFactory and a ProductManager', () => {
    assert.ok(factory.options.address)
    assert.ok(product.options.address)
  })

  it('marks caller as the product owner', async () => {
    const manager = await product.methods.owner().call()
    assert.equal(accounts[0], manager)
  })

  it('the product is shipped and the buyer is receiver', async () => {
    await product.methods.shipProduct(accounts[1]).send({
      from: accounts[0],
    })
    const buyer = await product.methods.buyer().call()
    assert.equal(accounts[1], buyer)
  })

  it('the product is received and the seller is receiver', async () => {
    await product.methods.shipProduct(accounts[1]).send({
      from: accounts[0],
    })
    await product.methods.receiveProduct().send({
      from: accounts[1],
    })
    const seller = await product.methods.seller().call()
    const buyer = await product.methods.buyer().call()
    assert.equal(accounts[1], seller)
    assert.equal(buyer, '0x0000000000000000000000000000000000000000')
  })

  it('the product was received by final receiver and the owner changed', async () => {
    await product.methods.setRetailer(accounts[2]).send({
      from: accounts[0],
    })
    let retailer = await product.methods.retailer().call()
    await product.methods.shipProduct(accounts[1]).send({
      from: accounts[0],
    })
    await product.methods.receiveProduct().send({
      from: accounts[1],
    })
    await product.methods.shipProduct(accounts[2]).send({
      from: accounts[1],
    })
    await product.methods.receiveProduct().send({
      from: accounts[2],
    })
    const owner = await product.methods.owner().call()
    const seller = await product.methods.seller().call()
    assert.equal(owner, retailer, seller)
    retailer = await product.methods.retailer().call()
    assert.equal(retailer, '0x0000000000000000000000000000000000000000')
  })

  it('the reward is tranfered to seller when the buyer receives', async () => {
    await product.methods.setBalance().send({
      value: '10000000000000000',
      from: accounts[0],
    })
    await product.methods.setRewardToWei(100000000, 1).send({
      from: accounts[0],
    })
    await product.methods.shipProduct(accounts[1]).send({
      from: accounts[0],
    })
    await product.methods.receiveProduct().send({
      from: accounts[1],
    })
    const balance = await product.methods.getBalanceToWei().call()
    let sellerBalance = await web3.eth.getBalance(accounts[0]) //balance is String
    sellerBalance = web3.utils.toWei(sellerBalance, 'ether') //now is String reprisents ether
    sellerBalance = parseFloat(sellerBalance)
    assert.equal(balance, '9999999900000000')
    assert(sellerBalance > 100)
  })

})
