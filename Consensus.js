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

var LOGGER = require('./Logger.js')
var POW = require("./Consensus/POW.js")
var CS = require("./ChainScript.js")
var ChainScript = new CS.ChainScript()
var MM = require("./MemoryMonitor.js")
var MemoryMonitor = new MM.MemoryMonitor()
var Database = require('./Database.js')
var CryptographicUtility = require('./Crypto.js')
var RUN = (rootInstances, 
						blockData, 
						nextIndex, 
						previousBlockHeaderHash, 
						nextTimestamp, 
						rootSet, 
                        BLOCKCHAIN_CONFIGURATION,
                        CONSENSUS_TYPE,
                        difficulty,
                        callback) => {
    LOGGER(JSON.stringify(BLOCKCHAIN_CONFIGURATION),"NEXT BLOCK CREATION, BLOCKCHAIN_CONFIGURATION")
    switch (BLOCKCHAIN_CONFIGURATION.consensus) {
        case CONSENSUS_TYPE.PROOF_OF_WORK: 
            try{
                var stateHolder = []
                console.log("BLOCKCHAIN_CONFIGURATION")
                console.log(BLOCKCHAIN_CONFIGURATION)
                BLOCKCHAIN_CONFIGURATION.roots.forEach(root => {
                    LOGGER(root, "STATE ITERATION ROOTS")
                    var stateObjectToSummarize = Database.FetchStatefulObject(root.name)
                    LOGGER(stateObjectToSummarize, "data stateObjectToSummarize: "+root.name)
                    LOGGER(CryptographicUtility.SHA256(JSON.stringify(stateObjectToSummarize)), "Consensus: stateObjectToSummarize ")
                    stateHolder.push(stateObjectToSummarize)                    
                })
                var stateFormatToHash = JSON.stringify(stateHolder)
                LOGGER(stateFormatToHash, "Consensus: stateFormatToHash")
                LOGGER(CryptographicUtility.SHA256(stateFormatToHash), "Consensus: stateHolder hash")
                LOGGER(blockData, "BLOCKDATA CONTENT: "+typeof(blockData))
                blockData.STATE_HASH = CryptographicUtility.SHA256(stateFormatToHash)
    	        POW.Mine(rootInstances, 
                        blockData, 
                        nextIndex, 
                        previousBlockHeaderHash, 
                        nextTimestamp, 
                        rootSet, 
                        BLOCKCHAIN_CONFIGURATION,
                        CONSENSUS_TYPE,
                        difficulty, 
                        (function(MinedBlock, RIToRemove){
                            LOGGER(MinedBlock, "POW.Mine callback - MinedBlock")
                            LOGGER(RIToRemove, "POW.Mine callback - RIToRemove")            
                            ChainScript.InvokeNativeFunction(BLOCKCHAIN_CONFIGURATION,
                                                             "OnNewBlock",
                                                             NewBlock = MinedBlock,
                                                             (function(result){
                                                                console.log("ONNEWBLOCK CONSENSUS: "+result)
                                                             }))
                            MemoryMonitor.MemoryUsage()
                            callback(MinedBlock, RIToRemove)
                        }))
            }catch(e){
                console.log("[ERROR] CONSENSUS_TYPE.PROOF_OF_WORK: "+e )
            }
            break;
    }
    //callback(minedBlock) ? 
}

var IsValidChain = (blockchain, BLOCKCHAIN_CONFIGURATION, CONSENSUS_TYPE, GENESIS_BLOCK) => {
    switch (BLOCKCHAIN_CONFIGURATION.consensus) {
        case CONSENSUS_TYPE.PROOF_OF_WORK:
            return POW.IsValidPOWChain(blockchain, 
                                       GENESIS_BLOCK, 
                                       CONSENSUS_TYPE, 
                                       BLOCKCHAIN_CONFIGURATION)
            break;
    }
};

module.exports = {
    RUN,
    IsValidChain
}
