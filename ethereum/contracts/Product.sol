// SPDX-License-Identifier: NK
pragma solidity ^0.8.11;

enum ProductState{ Created, Shipped, Received, Complete }
enum RoutePhase{ Manufacturer, Intra_Logistic, Retailer, Post_Retailer }

struct Product {
    uint96 epc;
    ProductState state;
    RoutePhase phase;
    int32 qualityInfo; //fixed16x8
}

contract ProductFactory {
    address[] public depolyedProducts;
    mapping(uint96 => address) public productsAddress;
    
    function createProduct(uint96 epc) public {
        address newProduct = address(new ProductManager(msg.sender, epc));
        depolyedProducts.push(newProduct);
        productsAddress[epc] = newProduct;
    }

    function getDeployedProducts() public view returns (address[] memory) {
        return depolyedProducts;
    }
}

contract ProductManager {
    
    Product product;
    address public owner;   //manufacturer
    address payable public seller;
    address public buyer;
    address public retailer;

    int32 minQualityValue;
    int32 maxQualityValue;

    uint8 maxTransfers;
    uint256 public reward;
    mapping(address => uint8) rewarded;

    event Shipped(address, address);
    event Received(address, address);
    event ServiceCompleted(string, address);
    event QualityFailure(string, address, int32);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(address creator, uint96 _epc)  {
        owner = creator;
        enrollProduct(_epc);
    }

    function enrollProduct(uint96 epc) private {
        product = Product({
            epc: epc,
            state: ProductState.Created,
            phase: RoutePhase.Manufacturer,
            qualityInfo: 0
        });
        seller = payable (owner);
    }

    function setRewardToWei(uint256 _reward, uint8 _maxTransfers) public onlyOwner {
        reward = _reward;
        maxTransfers = _maxTransfers;
    }

    function shipProduct(address recipient) public {
        require(seller == msg.sender && seller != recipient,
            "The caller is not sender or the recipient defined as sender");
        product.state = ProductState.Shipped;
        
        buyer = recipient;
        emit Shipped(seller, buyer);
    }

    function receiveProduct() public {
        require(buyer == msg.sender,
            "The caller is not buyer");
        product.state = ProductState.Received;
        sendRewardToSeller();

        emit Received(seller, buyer);
        seller = payable (buyer);
        buyer = address(0);

        if (seller != owner && seller != retailer) {
            setPhase(RoutePhase.Intra_Logistic);
        }
        
        if (seller == retailer) {
            completeProcedure();
        }
    }

    function sendRewardToSeller() private {
        if (maxTransfers > 0 && reward < getBalanceToWei()
            && rewarded[seller] < maxTransfers) {
            seller.transfer(reward);
            rewarded[seller]++;
        }
    }

    function setPhase(RoutePhase phase) private {
        product.phase = phase;
    }

    function setRetailer(address finalRecipient) public onlyOwner {
        retailer = finalRecipient;
    }

    function completeProcedure() private {
        product.state = ProductState.Complete;
        setPhase(RoutePhase.Retailer);
        emit ServiceCompleted(
            "The product arrived to specific retailer", retailer);
        owner = retailer;
        retailer = address(0);
    }

    //This function is payable because is able to recieve ehters
    function setBalance() public payable onlyOwner {}

    function getBalanceToWei() public view returns(uint256) {
        return address(this).balance;
    }

    function getProductInfo() public view returns
        (uint96, ProductState, RoutePhase, int32) {
        return (product.epc, product.state, product.phase, product.qualityInfo);
    }

    function setLimitQualityValue(int32 min, int32 max) public onlyOwner {
        require(minQualityValue == 0 && maxQualityValue == 0,
            "The limit values has already initialized");
        minQualityValue = min;
        maxQualityValue = max;
    }

    function setQualityInfo(int32 info) public {
        require(msg.sender == seller, "The caller is not sender");
        product.qualityInfo = info;
        if (info <= minQualityValue || info >= maxQualityValue) {
            emit QualityFailure("Recording limit Value from specific party",
                seller, product.qualityInfo);
        }
    }

}
