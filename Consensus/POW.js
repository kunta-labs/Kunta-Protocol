/*
Copyright 2017-Present The Kunta Protocol Authors
This file is part of the Kunta Protocol library.
The Kunta Protocol is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
The Kunta Protocol is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.
You should have received a copy of the GNU Lesser General Public License
along with the Kunta Protocol library. If not, see <http://www.gnu.org/licenses/>.
*/

var LOGGER = require('../Logger.js')
var CryptographicUtility = require('../Crypto.js')
var MineAttempt = CryptographicUtility.MineAttempt
var BlockProperties = require('../BlockProperties.js')
var Block = BlockProperties.Block
const spawn = require('threads').spawn;
var CalculateHashForBlock = CryptographicUtility.CalculateHashForBlock
var CalculateHash = CryptographicUtility.CalculateHash
const { fork } = require('child_process');
var GetConstraintString = (difficulty) =>{
    var mathDifficultyRepresentation = "";
    for (var i = 0; i < difficulty; i++) {
        mathDifficultyRepresentation += "0";
    }
    return mathDifficultyRepresentation
}
class POW {
	constructor(){
	}
}
var Mine = (rootInstances, 
			blockData, 
			nextIndex, 
			previousBlockHeaderHash, 
			nextTimestamp, 
			rootSet, 
            BLOCKCHAIN_CONFIGURATION,
            CONSENSUS_TYPE,
            difficulty, 
            MineSuccess) => {
        	LOGGER(rootInstances,"generateNextBlock: POW CONSENSUS, rootInstances")
            CryptographicUtility.SOLVED_BY_ANOTHER = false
		    var nonce = 0
            var constraintString = GetConstraintString(difficulty)
            var RIOBJS = []
            rootInstances.forEach(ri => {
                console.log("Mine, rootInstances.forEach")
                console.log(ri)
                try{
                    RIOBJS.push(JSON.parse(ri))
                }catch(e){
                    RIOBJS.push(ri)
                }
                
            })
            var stringedRIs = JSON.stringify(RIOBJS)
            console.log("stringedRIs")
            console.log(stringedRIs)
            var stringedblockData = JSON.stringify(blockData)
            var solved = false
            CryptographicUtility.setSolvedByAnother(false);
            while(!solved && !CryptographicUtility.getSolvedByAnother()){ 
                if(CryptographicUtility.getSolvedByAnother()){
                    throw new Error("[ERROR POW:96] CryptographicUtility.SOLVED_BY_ANOTHER")
                }

                var nextHash = MineAttempt(nextIndex, 
                                           previousBlockHeaderHash, 
                                           nextTimestamp, 
                                           stringedblockData,
                                           stringedRIs,
                                           nonce);
                                            
                if(nextHash.substring(0, difficulty) == constraintString){
                    solved = true
                }else{
                    nonce++
                }
            }
            if(CryptographicUtility.getSolvedByAnother()){
                throw new Error("[ERROR POW:127] CryptographicUtility.SOLVED_BY_ANOTHER")
            }
            console.log("block exists")
            console.log(Block)
            var minedBlock = new Block(
                                 nextIndex, 
                                 nextHash,
                                 0.0,
                                 previousBlockHeaderHash, 
                                 rootSet,
                                 nextTimestamp, 
                                 blockData,   
                                 nonce,
                                 rootInstances 
                                 )
            MineSuccess(minedBlock, rootInstances)         
}


var IsValidPOWChain = (blockchain, GENESIS_BLOCK, CONSENSUS_TYPE, BLOCKCHAIN_CONFIGURATION) => {
	LOGGER(blockchain,"isValidChain, blockchainToValidate")
    var genesis_to_compare = JSON.parse(JSON.stringify(GENESIS_BLOCK))
    if ( JSON.stringify(blockchain[0]) !== JSON.stringify(genesis_to_compare) ) {
        LOGGER("bc to validate's genesis block != to genesisBlock","isValidChain")
        return false;
    }
    var tempBlocks = [blockchain[0]];
    for (var i = 1; i < blockchain.length; i++) {
        if (IsValidNewBlock(blockchain[i], tempBlocks[i - 1], CONSENSUS_TYPE, BLOCKCHAIN_CONFIGURATION)) {
            tempBlocks.push(blockchain[i]);
            LOGGER("isValidNewBlock","isValidChain")
        } else {
            LOGGER("!isValidNewBlock","isValidChain")
            return false;
        }
    }
    return true;
}

var IsValidNewBlock = (newBlock, previousBlock, CONSENSUS_TYPE, BLOCKCHAIN_CONFIGURATION) => {
    var ValidityVerdict = false;
    switch (BLOCKCHAIN_CONFIGURATION.consensus) {
        case CONSENSUS_TYPE.PROOF_OF_WORK:
            if (previousBlock.header.blockIndex + 1 !== newBlock.header.blockIndex) {
                console.log('invalid index');
                ValidityVerdict = false;
            }
            else if (previousBlock.header.hash !== newBlock.header.previousHash) {
                console.log('invalid previoushash');
                ValidityVerdict = false
            } 
            else if (CalculateHashForBlock(newBlock) !== newBlock.header.hash) {
                console.log(typeof (newBlock.header.hash) + ' ' + typeof CalculateHashForBlock(newBlock));
                var hashForBlock = CalculateHashForBlock(newBlock)
                var hashForSubmittedBlock = newBlock.header.hash
                console.log('invalid hash: ' + hashForBlock + ' ' + hashForSubmittedBlock);
                ValidityVerdict = false;
            }
            ValidityVerdict = true;
            break
    }
    return ValidityVerdict
};

module.exports = {
	Mine,
	IsValidPOWChain
}