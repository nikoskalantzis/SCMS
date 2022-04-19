const path = require('path')
const solc = require('solc')
const fs = require('fs-extra') //file system module

const buildPath = path.resolve(__dirname, 'build')
fs.removeSync(buildPath) //delete what is inside the folder

// read 'Product.sol' from the 'contracts' folder
const ProductPath = path.resolve(__dirname, 'contracts', 'Product.sol')
// read the sourceCode of the file with encoding 'utf8'
const source = fs.readFileSync(ProductPath, 'utf8')

const input = {
  language: 'Solidity',
  sources: {
    'Product.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
}

// use sol compiler to compile both contracts
const output = JSON.parse(solc.compile(JSON.stringify(input))).contracts[
  'Product.sol'
]

// write the output to the build directory
fs.ensureDirSync(buildPath) //ensure that directory exists
// console.log(output);
for (let contract in output) {
  //for two contracts
  fs.outputJsonSync(
    path.resolve(buildPath, contract + '.json'),
    output[contract], //write this content
  )
}
