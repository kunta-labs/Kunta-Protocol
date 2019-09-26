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
var CryptographicUtility = require('./Crypto.js')
var merkle = require("merkle")
var http = require('http');
var BlockProperties = require('./BlockProperties.js')
var Database = require('./Database.js')
var Consensus = require('./Consensus.js')
var UTXO = require('./Type/UTXO.js')
var ACCOUNT = require('./Type/ACCOUNT.js')
var CS = require("./ChainScript.js")
var ChainScript = new CS.ChainScript()
var PEntry = require("./PEntry.js")
var _isSyncing = false
var BQ = require("./BroadcastQueue/BQueue.js")
var fs = require('fs')

var node_ip = "_blank_"
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  node_ip = add;
  console.log('addr: '+node_ip);
})

var peer_blocks = {}
var CURRENT_STATE = {}
var difficulty = BlockProperties.difficulty
var VERSION_NUMBER = 0.0

const ACCESS_TYPE = {
    PUBLIC: 0,
    PRIVATE: 1,
}

const CONSENSUS_TYPE = {
    PROOF_OF_WORK: 0,
    PROOF_OF_STAKE: 1,
    PROOF_OF_BURN: 2,
    DELEGATED_PROOF_OF_STAKE: 3,
    GHOST: 4,
    CUSTOM: 999,
}


const BLOCKCHAIN_COMMUNICATION_TYPE = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    QUERY_BLOCKCHAIN: 3,
    QUERY_TRANSACTION: 4,
    RESPONSE_TRANSACTION: 5,
    QUERY_BLOCK: 6,
    RESPONSE_BLOCK: 7,
    QUERY_SYNC: 8,
    RESPONSE_SYNC: 9
};

const BLOCKCHAIN_TYPE = {
    UTXO: 0,
    ACCOUNT: 1
}


const VALUE_TYPE = {
	STATIC: 0,
	DYNAMIC: 1
}

const GENDER_RELATIONSHIP_TYPE = {
	FULL: 0,
	PARTIAL: 1
}

//CREATE BLANK BCC GLOBAL
var BLOCKCHAIN_CONFIGURATION = {}
var UnprocessedRoots = [] 
var GENESIS_BLOCK = null
var Blockchain = []
var Sockets = [];
var Crypto = CryptographicUtility.Crypto
var CryptoObj = CryptographicUtility.CRYPTOOBJ //new Crypto()
var CalculateHashForBlock = CryptographicUtility.CalculateHashForBlock
var CalculateHash = CryptographicUtility.CalculateHash

var RootToReference = (rootName) => {
    return BLOCKCHAIN_CONFIGURATION.roots.find(function(root) {
      return root.name == rootName;
    });
}

var GetLastRootInstanceIndex = () => {
        var maxID = -1
        try{
            var lastRootInstances = GetLatestBlock().body.rootInstances
            for (var ri of lastRootInstances) {
                maxID = (ri.index > maxID) ? ri.index : maxID
                LOGGER(ri,"inside rootInstancesToIndex: maxID: "+maxId);
            }
        } catch (err) {
            LOGGER("MAX ID cannot be set, defaulting to zero, most likely gen block with no root instances","lastIndexedRootInstanceIndex")
            maxID = 0
        }
        return maxID
}

var GenerateGenesisBlock = (callback) => {
    LOGGER(BLOCKCHAIN_CONFIGURATION, "inside GenerateGenesisBlock, view BLOCKCHAIN_CONFIGURATION")
    var startingHash = "00000000000000000000";
    var startingIndex = 0;
    var startingTimestamp = 1517273946273;
    var solved = false
    var nonce = 0
    var rootSet = []
    var blockToAdd = null

    switch(GetBlockChainConfig().type){
        case BLOCKCHAIN_TYPE.UTXO:
        	var startingBlockData = { 
                                owner: CryptoObj.digitalSignature,
                                CONFIG: BLOCKCHAIN_CONFIGURATION
            }
        	console.log("UTXO PROTOCOL GenerateGenesisBlock")
        	UTXO.GenerateGenesis(
        								   VERSION_NUMBER,
							        	   startingHash,
							        	   startingIndex,
							        	   startingTimestamp,
							        	   solved,
							        	   nonce,
							        	   startingBlockData,
							        	   rootSet,
							        	   blockToAdd,
							        	   difficulty,
        								   BLOCKCHAIN_CONFIGURATION,
        								   ACCESS_TYPE,
        								   CONSENSUS_TYPE,(function(MinedBlock){
        								   	 
                                             ResetUnprocessedRoots()

                                            ///TODO
                                            ///INVOKE ONCREATE NATIVE FUNCTION
                                            ChainScript.InvokeNativeFunction(
                                                BLOCKCHAIN_CONFIGURATION,
                                                "OnCreate",
                                                NewBlock = MinedBlock
                                            )

        								   	 callback(MinedBlock)
        								   })
		    )

        	console.log("ACCESS TYPE GENESIS")
			console.log(ACCESS_TYPE)

		    break;

		case BLOCKCHAIN_TYPE.ACCOUNT:
			var startingBlockData = { 
                                owner: CryptoObj.digitalSignature,
                                CONFIG: BLOCKCHAIN_CONFIGURATION,
                                STATE: {

                                }
            }

	    	console.log("ACCOUNT PROTOCOL GenerateGenesisBlock")
	        ACCOUNT.GenerateGenesis(
				   VERSION_NUMBER,
	        	   startingHash,
	        	   startingIndex,
	        	   startingTimestamp,
	        	   solved,
	        	   nonce,
	        	   startingBlockData,
	        	   rootSet,
	        	   blockToAdd,
	        	   difficulty,
				   BLOCKCHAIN_CONFIGURATION,
				   ACCESS_TYPE,
				   CONSENSUS_TYPE,(function(MinedBlock, RIToRemove){
				   	 ResetUnprocessedRoots(RIToRemove)

                    ///TODO
                    ///INVOKE ONCREATE NATIVE FUNCTION
                    ChainScript.InvokeNativeFunction(
                        BLOCKCHAIN_CONFIGURATION,
                        "OnCreate",
                        NewBlock = MinedBlock
                    )

				   	 callback(MinedBlock)
				   })
		    )
	        break;
    }
    return blockToAdd
};

var GenerateNextBlock = (callback, error = null) => {
    var blockData = { 
        owner: CryptoObj.digitalSignature
    }
    var previousBlock = GetLatestBlock();
    LOGGER(previousBlock,"previousBlock")
    var nextIndex = previousBlock.header.blockIndex + 1;
    var nextTimestamp = new Date().getTime() 
    console.log(Blockchain)
    console.log("typeof(Blockchain): "+typeof(Blockchain))
    LOGGER(previousBlock.body,"GenerateNextBlock, previousBlock.body")
    LOGGER(blockData,"CONSOLIDATE TRANSACTIONS, blockData")
    let rootInstancesToIndex = GetUnprocessedRoots()
    let lastIndexedRootInstanceIndex = GetLastRootInstanceIndex()
    var rootSet = []
    var rootInstances = []
    var rootInstanceInterim = []
    switch(GetBlockChainConfig().type){
        case BLOCKCHAIN_TYPE.UTXO:
        	console.log("GenerateNextBlock BLOCKCHAIN_TYPE.UTXO, about to Process")
		    try{
		    	UTXO.Process(
    				blockData,
    				previousBlock,
    				nextIndex,
    				nextTimestamp,
    				rootInstancesToIndex,
    				lastIndexedRootInstanceIndex,
    				rootSet,
    				rootInstances,
    				rootInstanceInterim,
    				difficulty,
    				BLOCKCHAIN_CONFIGURATION,
    				CONSENSUS_TYPE,
    				(function(result){
    					ResetUnprocessedRoots()
    					callback(result)
    				})
				)
		    }catch (err) {
		        LOGGER("ERROR IN PROCESSING rootInstancesToIndex: "+err)
		        throw new Error("ERROR IN PROCESSING rootInstancesToIndex: "+err)
		    }
		    console.log("Generating next block for UTXO")
	    	break;
        case BLOCKCHAIN_TYPE.ACCOUNT:
        	console.log("GenerateNextBlock BLOCKCHAIN_TYPE.ACCOUNT, about to Process")
	        ACCOUNT.Process(
    				blockData,
    				previousBlock,
    				nextIndex,
    				nextTimestamp,
    				rootInstancesToIndex,
    				lastIndexedRootInstanceIndex,
    				rootSet,
    				rootInstances,
    				rootInstanceInterim,
    				difficulty,
    				BLOCKCHAIN_CONFIGURATION,
    				CONSENSUS_TYPE,
    				(function(result, RIToRemove = null){
                        LOGGER(GetUnprocessedRoots(), "ResetUnprocessedRoots look at")
                        ResetUnprocessedRoots()   
                        callback(result)
    				}), 
    				(function(e){
    					error(e)
    				})
				)
	        console.log("Generating next block for ACCOUNT")
	    	break;
    } 
};

var GetBlockchain = () => {
	return Database.GetBlockchain()
}

var GetBlockchainWithWindow = (window) => {
    var windowedBlockchain = []
    var topblock = GetLatestBlock();
    if(topblock.header.blockIndex < window){
        for(var i = 0; i < topblock.header.blockIndex; i++){
            windowedBlockchain.push(Database.LoadBlock(i))
        }
    }else{
        for(var i = (topblock.header.blockIndex-window); i < topblock.header.blockIndex; i++){
            windowedBlockchain.push(Database.LoadBlock(i))
        }
    }
    return windowedBlockchain;
}

var HandleTransactionResponse = (message) => {
    var receivedTXs = JSON.parse(message.data)
    LOGGER(receivedTXs, "HERE ARE THE TRANSACTIONS I HAVE RECEIVED", true)
    var newOnes = []
    LOGGER(GetUnprocessedRoots(), "HandleTransactionResponse, GetUnprocessedRoots")
    for(var i = 0; i < receivedTXs.length; i++){
        if( !(GetUnprocessedRoots().indexOf( JSON.stringify(receivedTXs[i]) ) > -1) ){
            newOnes.push( JSON.stringify(receivedTXs[i]) )
            console.log("HandleTransactionResponse typeof receivedTXs")
            console.log( typeof(receivedTXs[i]) )
            try{
                console.log("HandleTransactionResponse typeof( GetUnprocessedRoots()[0] )")
                console.log( typeof( GetUnprocessedRoots()[0] ) )
            }catch(e){
                console.log("[ERROR] on typeof(GetUnprocessedRoots()[0]")
            }
        }
    }
    LOGGER(GetUnprocessedRoots(), "MY NEW TXs MEMORY BEFORE UNION, IF ANY", true)
    if (newOnes.length > 0){
        LOGGER(newOnes, "WE'VE GOTTEN TXS WE DO NOT HAVE YET FROM PEER", true)
    }
}

var SynchGoal = -1;
var HandleBlockchainResponse = (message) => {
    var latestBlockReceived = JSON.parse(message.data)[0]; //their block
    var latestBlockHeld = GetLatestBlock();
    peer_blocks[ ""+message.node_ip ] = latestBlockReceived
    if( (latestBlockReceived.header.blockIndex - 1) == latestBlockHeld.header.blockIndex){
        CryptographicUtility.setSolvedByAnother(true);
    }
    LOGGER(latestBlockReceived, "HandleBlockchainResponse latestBlockReceived:", true)
    LOGGER(latestBlockHeld, "HandleBlockchainResponse latestBlockHeld:", true)
    if (latestBlockReceived.header.blockIndex > latestBlockHeld.header.blockIndex) {
        console.log('blockchain possibly behind. We have b_id: ' + latestBlockHeld.header.blockIndex + ' Peer has b_id: ' + latestBlockReceived.header.blockIndex);
        if (latestBlockHeld.header.hash === latestBlockReceived.header.previousHash) {              
            LOGGER("HandleBlockchainResponse 1: my latest block, is equal to your previous block, and YOUR chain is longer than mine, adding YOUR top block", "BLOCK ANALYSIS", true);
            Database.CommitBlock(latestBlockReceived)
            _isSyncing = false;
            var previousBlock = GetLatestBlock();
            LOGGER(previousBlock,"HandleBlockchainResponse 1: previousBlock")
            LOGGER(previousBlock.body,"HandleBlockchainResponse 1, previousBlock.body")
            let lastIndexedRootInstanceIndex = GetLastRootInstanceIndex()      
            var rootInstances = []
            var rootInstanceInterim = []
            console.log("HandleBlockchainResponse 1: 809")
            ACCOUNT.ProcessRootInstancesForPeerBlock( latestBlockReceived.body.rootInstances, 
                                                      rootInstanceInterim, 
                                                      BLOCKCHAIN_CONFIGURATION,
                                                      "HandleBlockchainResponse", 
                                                      (function(result){
                BroadcastAll( ResponseLatestMsg() );
            }) )
        } 
        else { 
            LOGGER("HandleBlockchainResponse 1: YOUR blockchain is longer than MY blockchain [POSSIBLE TWO DIFFERENT CHAINS]", "BLOCKCHAIN RESPONSE", true);
            SynchGoal = latestBlockReceived.header.blockIndex;
            _isSyncing = true
            var lookbackWindow = 50
            BroadcastSingle( QuerySync( (latestBlockHeld.header.blockIndex < lookbackWindow) ? 0 : (latestBlockHeld.header.blockIndex - lookbackWindow)  ) );
        }
    } 
    else if (latestBlockReceived.header.blockIndex == latestBlockHeld.header.blockIndex) {
    } 
    else { 
        LOGGER('HandleBlockchainResponse 3: YOUR blockchain is not longer than MY blockchain', "BLOCKCHAIN RESPONSE", true);
        if (latestBlockHeld.header.hash === latestBlockReceived.header.hash){
            LOGGER("HandleBlockchainResponse 3: YOUR recent HASH IS EQUAL to MINE","BLOCKCHAIN RESPONSE", true);
        } else {
        }
    }
};

var AnalyzeBlockResponse = (block) => {
    var latestBlockReceived = block; //their block
    var latestBlockHeld = GetLatestBlock();
    LOGGER(latestBlockReceived, "AnalyzeBlockResponse latestBlockReceived:", true)
    LOGGER(latestBlockHeld, "AnalyzeBlockResponse latestBlockHeld:", true)
    if (latestBlockReceived.header.blockIndex > latestBlockHeld.header.blockIndex) {
        console.log('AnalyzeBlockResponse. We have b_id: ' + latestBlockHeld.header.blockIndex + ' Peer has b_id: ' + latestBlockReceived.header.blockIndex);
        if (latestBlockHeld.header.hash === latestBlockReceived.header.previousHash) {                     
            var err = new Error();
            LOGGER(latestBlockReceived, "AnalyzeBlockResponse: my latest block, is equal to your previous block, and YOUR chain is longer than mine, adding YOUR queried/analyzed block", true);
            SynchGoal = -1;
            Database.CommitBlock(latestBlockReceived)
            latestBlockHeld = GetLatestBlock();
            console.log("886")
            console.log(message)
            var previousBlock = GetLatestBlock();
            LOGGER(previousBlock,"AnalyzeBlockResponse: previousBlock")
            LOGGER(previousBlock.body,"AnalyzeBlockResponse: GenerateNextBlock, previousBlock.body")
            let lastIndexedRootInstanceIndex = GetLastRootInstanceIndex()    
            var rootInstances = []
            var rootInstanceInterim = []
            console.log("AnalyzeBlockResponse: 1049")
            ACCOUNT.ProcessRootInstancesForPeerBlock( latestBlockReceived.body.rootInstances, 
                                                      rootInstanceInterim, 
                                                      BLOCKCHAIN_CONFIGURATION, 
                                                      "AnalyzeBlockResponse",
                                                      (function(result){
            }) )
        } else { 
            LOGGER(latestBlockReceived, "ANALYZE BLOCK RESPONSE: Analyze Block: Block previous doesnt equal mine [TWO DIFFERENT CHAINS] MUST SYNC", true);
            SynchGoal = latestBlockReceived.header.blockIndex;
            _isSyncing = true
            console.log("AnalyzeBlockResponse: _isSyncing 1103: "+_isSyncing)
            var lookbackWindow = 50
            BroadcastSingle( QuerySync( (latestBlockHeld.header.blockIndex < lookbackWindow) ? 0 : (latestBlockHeld.header.blockIndex - lookbackWindow)  ) );
        }
    } 

    else if (latestBlockReceived.header.blockIndex == latestBlockHeld.header.blockIndex) {
        console.log('AnalyzeBlockResponse: blockchain IS THE SAME HEIGHT. We have b_id: ' + latestBlockHeld.header.blockIndex + ' Peer has b_id: ' + latestBlockReceived.header.blockIndex);
        if (latestBlockHeld.header.previoushash == latestBlockReceived.header.previoushash) {         
            LOGGER("AnalyzeBlockResponse: our latest blocks are the same, and YOUR chain is the same length, adding YOUR top block", "BLOCK ANALYSIS", true);
            Database.CommitBlock(latestBlockReceived)
            _isSyncing = false;
            console.log("915")
            console.log(message)
            var previousBlock = GetLatestBlock();
            LOGGER(previousBlock,"previousBlock")
            LOGGER(previousBlock.body,"AnalyzeBlockResponse, previousBlock.body")
            let lastIndexedRootInstanceIndex = GetLastRootInstanceIndex()
            var rootInstances = []
            var rootInstanceInterim = []
            ACCOUNT.ProcessRootInstancesForPeerBlock( latestBlockReceived.body.rootInstances, 
                                                      rootInstanceInterim, 
                                                      BLOCKCHAIN_CONFIGURATION,
                                                      "AnalyzeBlockResponse", 
                                                      (function(result){

            }) )  
        } 
    }
    else { 
        LOGGER('YOUR blockchain is not longer than MY blockchain', "ANALYZE BLOCK RESPONSE", true);
        if (latestBlockHeld.header.hash === latestBlockReceived.header.hash){
            LOGGER("AnalyzeBlockResponse: YOUR recent HASH IS EQUAL to MINE","BLOCKCHAIN RESPONSE", true);
        }else{
            LOGGER("AnalyzeBlockResponse: YOUR recent HASH IS NOT EQUAL to MINE","BLOCKCHAIN RESPONSE", true);
        }
    }
};

var HandleQueryBlockResponse = (message) => {
    LOGGER(message, "HandleQueryBlockResponse", true)
    var latestBlockHeld = GetLatestBlock();
    var latestBlockReceived = JSON.parse(message.data); //their block
    if(latestBlockHeld.header.blockIndex == latestBlockReceived.header.blockIndex){
        LOGGER(message, "B_IDs ARE EQUAL, DON'T ANALYZE BLOCK QUERY RESPONSE", true)
    }else{
        LOGGER(message, "B_IDs ARE [NOT] EQUAL, ANALYZE BLOCK QUERY RESPONSE", true)
        AnalyzeBlockResponse(latestBlockReceived)
    }
}

var HandleSynchResponse = (message) => {
    LOGGER(message, "HandleSynchResponse message", true)
    var peerBlock = JSON.parse(message.data); //their block
    var nodeBlock = GetLatestBlock()
    if(peerBlock.header.blockIndex == 0){
        LOGGER(peerBlock, "HandleSynchResponse, MUST BE GENESIS", true)
        var myGenesis = Database.LoadBlock(peerBlock.header.blockIndex)
        LOGGER(peerBlock.header.hash+" : "+myGenesis.header.hash, "HandleSynchResponse, MUST BE GENESIS", true)
        if(peerBlock.header.hash == myGenesis.header.hash){
            LOGGER(peerBlock, "HandleSynchResponse, GENESIS IS EQUAL, sync chain further", true)
            BroadcastSingle(QuerySync(peerBlock.header.blockIndex + 1));
        }else{
            console.log("HandleSynchResponse: GENESIS ARE NOT EQUAL, DIFFERENT CHAIN SPEC, Don't sync")
            _isSyncing = false
            console.log("_isSyncing 841: "+_isSyncing)
        }
    }else{
        var prev_index = peerBlock.header.blockIndex - 1
        var my_prev_block = Database.LoadBlock(prev_index)
        if(peerBlock.header.previousHash == my_prev_block.header.hash){
            LOGGER(peerBlock, "HandleSynchResponse: PREV_BLOCK HASH IS CORRECT, COMMIT")
            try{
                var myVersionOfPeerBlockIndex = Database.LoadBlock(peerBlock.header.blockIndex)
                if(peerBlock.header.hash == myVersionOfPeerBlockIndex.header.hash){
                    LOGGER({
                        "peer_hash": peerBlock.header.hash,
                        "my_block_hash": myVersionOfPeerBlockIndex.header.hash
                    }, "block hashes are equal, i have it already, [don't commit]")
                }else{
                    LOGGER({
                        "peer_hash": peerBlock.header.hash,
                        "my_block_hash": myVersionOfPeerBlockIndex.header.hash
                    }, "block hashes are NOT equal, i DONT HAVE it already, [commit BLOCK]")
                    Database.CommitBlock(peerBlock)
                    var previousBlock = GetLatestBlock();
                    LOGGER(previousBlock,"previousBlock")
                    LOGGER(previousBlock.body,"HandleSynchResponse, previousBlock.body")
                    let lastIndexedRootInstanceIndex = GetLastRootInstanceIndex()      
                    var rootInstances = []
                    var rootInstanceInterim = []
                    console.log("HandleSynchResponse: 1316")
                }
            }catch(e){
                console.log("HandleSynchResponse, else genesis, try/catch error: "+e)
                Database.CommitBlock(peerBlock)
                var previousBlock = GetLatestBlock();
                LOGGER(previousBlock,"previousBlock")
                LOGGER(previousBlock.body,"HandleSynchResponse, previousBlock.body")
                let lastIndexedRootInstanceIndex = GetLastRootInstanceIndex()
                var rootInstances = []
                var rootInstanceInterim = []
                console.log("HandleSynchResponse: 1372")
                ACCOUNT.ProcessRootInstancesForPeerBlock( peerBlock.body.rootInstances, 
                                                          rootInstanceInterim, 
                                                          BLOCKCHAIN_CONFIGURATION, 
                                                          "HandleSynchResponse",
                                                          (function(result){
                    LOGGER(UnprocessedRoots, "HandleSynchResponse, else, catch: "+e)
                }))
            }
            if(peerBlock.header.blockIndex == SynchGoal){
                LOGGER(peerBlock, "BLOCK SYNC IS ALL CAUGHT UP, reset synch goal")
                SynchGoal = -1
                _isSyncing = false;
                console.log("_isSyncing 929: "+_isSyncing)
                console.log("1145")
                console.log(message)
            }else{
                BroadcastSingle(QuerySync(peerBlock.header.blockIndex + 1));
            }
        }
        else{
            LOGGER(peerBlock, "HandleSynchResponse: PREV_BLOCK HASH IS WRONG, DONT ADD")
            var lookbackWindow = 50
            BroadcastSingle( QuerySync( (nodeBlock.header.blockIndex < lookbackWindow) ? 0 : (nodeBlock.header.blockIndex - lookbackWindow)  ) );
            console.log("_isSyncing 961: "+_isSyncing)
        } 
    }  
}

var AddBlock = (newBlock) => {
    if (IsValidNewBlock(newBlock, GetLatestBlock())) {
        LOGGER(newBlock.body.rootInstances, "addblock, newBlock: ", true)  
        var rootInstances = []
        try {
            for(var i = 0; i < newBlock.body.rootInstances.length; i++){
                rootInstances.push(JSON.parse(newBlock.body.rootInstances[i]))
            }
        }catch(err) {
            LOGGER("cannot iterate over empty root instance, rootinstance stays empty", "addBlock")
        }
        newBlock.body.rootInstances = rootInstances
        LOGGER(newBlock, "addblock, newBlock before GetBlockchain: ", true)
        Database.CommitBlock(newBlock)
    }
};

var IsValidNewBlock = (newBlock, previousBlock) => {
    switch (BLOCKCHAIN_CONFIGURATION.consensus) {
        case CONSENSUS_TYPE.PROOF_OF_WORK:
            if (previousBlock.header.blockIndex + 1 !== newBlock.header.blockIndex) {
                console.log('invalid index');
                return false;
            } 
            else if (previousBlock.header.hash !== newBlock.header.previousHash) {
                console.log('invalid previoushash');
                return false;
            } 
            else if (CalculateHashForBlock(newBlock) !== newBlock.header.hash) {
                console.log(typeof (newBlock.header.hash) + ' ' + typeof CalculateHashForBlock(newBlock));
                var hashForBlock = CalculateHashForBlock(newBlock)
                var hashForSubmittedBlock = newBlock.header.hash
                console.log('invalid hash: ' + hashForBlock + ' ' + hashForSubmittedBlock);
                return false;
            }
            return true;
       	 	break
    }
};


var SyncRootsWithPeers = () => {
    if(ResponseAllTXsMsg().data.length > 0){
        var rootsToBroadcast = ResponseAllTXsMsg()
        LOGGER(rootsToBroadcast, "syncRootsWithPeers, responseAllTXsMsg NOT NULL", true)
        BroadcastAll(ResponseAllTXsMsg())    
    }
}

var GetAllRootInstancesInChain = () => {
    console.log("GetAllRootInstancesInChain")
	var allRootInstances = []
	for(var block = 0 ; block < GetBlockchain().length; block++){
        var rootInstancesOfBlock = Database.LoadBlock(block).body.rootInstances
        LOGGER(rootInstancesOfBlock, "BLOCK NUM: "+block)
        if(rootInstancesOfBlock.length > 0){
            allRootInstances.push(rootInstancesOfBlock)
        }	
	}
	return allRootInstances
}

var SyncBlockchainToDB = () => {}

var GetBlockChainConfig = () => {
	return 	BLOCKCHAIN_CONFIGURATION
}

var ActuallyBroadcastNextInBQ = (broadcastInterval = 100) => {
    try{
        console.log("ATTEMPTING TO BROADCAST NEXT SIGNAL...")
        var broadcastLimit = 100;
        BQ.ChooseNextBroadcast( (function(B){
                if(B != null){
                    console.log("BOUT TO BROADCAST to "+B.ws)
                    var targetedWS = null
                    Sockets.map(s => {
                        if(B.ws == "ws://"+s._socket.remoteAddress + ':' + s._socket.remotePort){
                            targetedWS = s
                        }
                    })
                    if(targetedWS != null){
                        var json_payload = JSON.parse(B.payload)
                        console.log("Broadcast Payloads")
                        console.log(B.payload)
                        console.log(json_payload)
                        targetedWS.send( JSON.stringify(json_payload) )
                    }else{
                        console.log("targetedWS is NULL")
                    }
                    setTimeout(ActuallyBroadcastNextInBQ, broadcastInterval)
                }else{
                    setTimeout(ActuallyBroadcastNextInBQ, broadcastInterval)
                }
            }) 
        )
    }catch(e){
        console.log("error in actually broadcasting: "+e)
    }
}


var Write = (ws, message) => {
    var toPeer = "ws://"+ws._socket.remoteAddress + ':' + ws._socket.remotePort; 
    LOGGER(message, "Write to: "+toPeer, true)
    if(message.type == BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCKCHAIN){
        ws.send(JSON.stringify(message));
    }
    else if(message.type == BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCK){
        ws.send(JSON.stringify(message));
    }
    else{
        BQ.InsertIntoQueue( toPeer , JSON.stringify(message) )
    }
}

var GetLatestBlock = () => {
	return Database.TopBlock()
}

var GetBlockByID = (bid) => {
    return Database.LoadBlock(bid)
}

var GetUnprocessedRoots = () => {
	return UnprocessedRoots
}

var GetSpecificBlock = (BlockNumber) => {
    return Database.LoadBlock(BlockNumber)
}

var CurrentChainHash = () => {
    return {'hash': CryptographicUtility
                    .SHA256(CryptographicUtility
                    .BASE64ENCODE(
                        JSON.stringify(GetLatestBlock())
                        ))};
}

var AddToUnprocessedRoots = (roots) => {
	UnprocessedRoots.push(roots)
}

var ResetUnprocessedRoots = (risToRemove = []) => {
    LOGGER(risToRemove, "ResetUnprocessedRoots, RIToRemove")
	LOGGER(UnprocessedRoots, "ResetUnprocessedRoots")
	UnprocessedRoots = []
    LOGGER(UnprocessedRoots, "ResetUnprocessedRoots after!!")
}

var QueryChainLengthMsg = () => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_LATEST,
    'message': "how long is your chain?",
    "node_ip": node_ip
});

var ResponseAllTXsMsg = () => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_TRANSACTION, 
    'data': UnprocessedRoots,
    "node_ip": node_ip
});

var ResponseLatestMsg = () => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify( [ GetLatestBlock() ] ),
    'node_ip': node_ip,
});

var ResponseChainMsg = () =>({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify(Blockchain),
    'node_ip': node_ip
});

var QueryAllMsg = () => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_ALL,
    'node_ip': node_ip
});

var QueryBlock = (BlockNumber) => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_BLOCK, 
    'data': BlockNumber,
    'node_ip': node_ip
});

var ResponseQueryBlock = (BlockNumber) => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCK, 
    'data': JSON.stringify(GetSpecificBlock(BlockNumber)),
    'node_ip': node_ip
});

var QuerySync = (BlockNumber) => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_SYNC, 
    'data': BlockNumber,
    'node_ip': node_ip
});

var ResponseQuerySync = (BlockNumber) => ({
    'type': BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_SYNC, 
    'data': JSON.stringify(GetSpecificBlock(BlockNumber)),
    'node_ip': node_ip,
});

var BroadcastSingle = (message) => {
    if(Sockets.length == 0){
    }else if(Sockets.length == 1){
        Write(Sockets[0], message)
    }else{
        var chosenPeer = Sockets[Math.floor(Math.random()*Sockets.length)];
        Write(chosenPeer, message)
    }
};

var BroadcastAll = (message) => {
    var sockets_unsorted = Sockets;
    sockets_unsorted.sort(function(a, b){
        return 0.5 - Math.random()
    });
    sockets_unsorted.forEach(socket => {
        Write(socket, message)
    })
};

var BroadcastMaxTwo = (message) => {
    var sockets_unsorted = Sockets;
    sockets_unsorted.sort(function(a, b){return 0.5 - Math.random()});
    if(sockets_unsorted.length == 0){
        //DO NOTHING
    }else if(sockets_unsorted.length == 1){
        Write(sockets_unsorted[0], message)
    }else if(sockets_unsorted.length > 1){
        Write(sockets_unsorted[0], message)
        Write(sockets_unsorted[1], message)
    }
};

var Begin = (bcc) => {
	console.log("pre blockchain_config")
	console.log(BLOCKCHAIN_CONFIGURATION)

    ///////PROD MODE
	//BLOCKCHAIN_CONFIGURATION = JSON.parse(CryptographicUtility.BASE64DECODE(bcc))

    ///////
    BLOCKCHAIN_CONFIGURATION = bcc;

	console.log("post blockchain_config")
	console.log(BLOCKCHAIN_CONFIGURATION)
	console.log("last blockchain_config")
	console.log(bcc)
	console.log(typeof(bcc))

	var genesisCheck = GetBlockchain()
	if(!genesisCheck){
		LOGGER(genesisCheck, "!GENESIS")
		GenerateGenesisBlock((function(GenesisBlock){
	                console.log("GenerateGenesisBlock callback")
	                console.log(GenesisBlock)
	                GENESIS_BLOCK = GenesisBlock
	                var result = Database.InitiateBlockchain(GenesisBlock, (function(IniationResult){
								LOGGER(IniationResult, "After Initiated Blockchain")
								Blockchain = GetBlockchain()							
					}))
	    }))
	}
	LOGGER(Blockchain, "Either Loaded, or initiated Blockchain")
}

var FindRI = (hash, callback) => {
	try{
		Database.SearchForRootInstance(hash, (function(partnerInstance){
			callback(partnerInstance)
		}), (function(e){
			console.log(("FindRI, Database.SearchForRootInstance [ERROR]: "+e))
		}))	
	}catch(e){
		console.log("[ERROR] FindRI: "+e)
	}
}

var getIsSyncing = () => {
    return _isSyncing
}

var GetPeerBlocks = () => {
    return peer_blocks
}

var SetCurrentState = (cs) => {
    CURRENT_STATE = cs
}

var GetCurrentState = () => {
    return CURRENT_STATE
}

var VerifyAllBlocks = () => Database.VerifyAllBlocks;
var FetchStatefulObject = (rn) => {
    return Database.FetchStatefulObject(rn)
}

module.exports = {
	VERSION_NUMBER,
	ACCESS_TYPE,
	CONSENSUS_TYPE,
	BLOCKCHAIN_COMMUNICATION_TYPE,
	BLOCKCHAIN_TYPE,
	GetBlockChainConfig,
	CalculateHashForBlock,
	RootToReference,
	GenerateGenesisBlock,
	GenerateNextBlock,
	GetUnprocessedRoots,
	AddToUnprocessedRoots,
	ResetUnprocessedRoots,
	CryptoObj,
	GetLatestBlock,
    GetBlockByID,
	GetBlockchain,
    GetBlockchainWithWindow,
	GetLastRootInstanceIndex,
	GetAllRootInstancesInChain,
	AddBlock,
	IsValidNewBlock,
    getIsSyncing,
	FindRI,
    CurrentChainHash,
	HandleTransactionResponse,
	HandleBlockchainResponse,
    HandleQueryBlockResponse,
    HandleSynchResponse,
	SyncRootsWithPeers,
	Write,
	QueryChainLengthMsg,
	ResponseAllTXsMsg,
	ResponseLatestMsg,
	ResponseChainMsg,
    ResponseQueryBlock,
    QuerySync,
    ResponseQuerySync,
	QueryAllMsg,
    QueryBlock,
	BroadcastAll,
    BroadcastSingle,
    BroadcastMaxTwo,
	Sockets,
	Begin,
    VerifyAllBlocks,
    GetPeerBlocks,
    SetCurrentState,
    GetCurrentState,
    FetchStatefulObject,
    CryptographicUtility,
    GetSpecificBlock,
    ActuallyBroadcastNextInBQ
}   

