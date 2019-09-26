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
var level = require("level-browserify");
var levelgraph = require("levelgraph");
var fs = require('fs')
var Protocol = require('./Protocol.js')
var CryptographicUtility = require('./Crypto.js')
const BCDB = "core/storage/BC/" //Blockchain
const A = "core/storage/A" //Addresses
const U = "core/storage/U" //Unconfirmed Root Instances
const STATE = "core/storage/S/" //State Based Storage
var RI_TARGETED = levelgraph(level("core/storage/RI_TARGETED"));
var B_CREATED = levelgraph(level("core/storage/B_CREATED"));
var RI_STOREDIN = levelgraph(level("core/storage/RI_STOREDIN"));
var A_MINED = levelgraph(level("core/storage/A_MINED"));
var ResyncBC = (CurrentBlockchain, newBlock, callback) => {	
	 if(VerifyCurrentBlockchainFiles(CurrentBlockchain)){
	 	var commitmentResult = CommitBlock(newBlock)
	 	callback(GetBlockchain())
	 }else{
	 	console.log("VerifyCurrentBlockchainFiles doesnt work")
	 }
}
var VerifyCurrentBlockchainFiles = (CurrentBlockChain) => {
	filenames = ReadFileNamesInDirectory()
	filenames.forEach(fileName => {
		 if(!VerifyBlock(fileName)){
		 	return false
		 }	
	})
	return true
}
var VerifyBlock = (fn) => {
	var blockNumber = parseInt( fn.replace('.kb','') )
	try {
		LoadBlock(blockNumber)	
	}catch(e){
		return false
	}
}
var CommitBlock = (BlockToCommit) => {
	if(BlockToCommit.header.blockIndex == 0){
		console.log("COMMIT BLOCK: WRITING GENESIS BLOCK")
		WriteBlock(BlockToCommit)
	}
	else{
		var anscestorBlock = LoadBlock( (BlockToCommit.header.blockIndex - 1) )
		var anscestorHash = anscestorBlock.header.hash
		LOGGER({
			hash: BlockToCommit.header.previousHash,
			anscHash: anscestorHash
		}, "CommitBlock: block compare: "+BlockToCommit.header.blockIndex)
		if(BlockToCommit.header.previousHash == anscestorHash){
			var shouldFurtherChain = true; 
			try{
				console.log(Protocol)
	            VerifyAllBlocks(anscestorBlock.header.blockIndex)
	        }catch(e){
	            console.log("ERROR IN VERIFY ALL BLOCKS CommitBlock")
	            console.log(e)
	            shouldFurtherChain = false
	        }
	        if(shouldFurtherChain){
	    		WriteBlock(BlockToCommit)
			}else{
				LOGGER(BlockToCommit, "ERROR: COULDN'T WRITE COMMIT BLOCK, shouldFurtherChain IS FALSE!!")
			}
		}else{
			LOGGER(BlockToCommit, "ERROR: COULDN'T WRITE COMMIT BLOCK, ANSCESTOR BLOCK NOT VALID")
		}
	}
}
var ReplaceBlockchain = (B) => {
	B.forEach( block => {
		CommitBlock(block)
	})
}
var GetBlockchain = () => {
	return LoadBlockchain()
}
var TopBlock = () => {
	var fns = ReadFileNamesInDirectory()
	var height = GetBlockHeight(fns)
	console.log("TopBlock: "+height)
	return LoadBlock(height)
}
var InitiateBlockchain = (B, callback) => {
	console.log("InitiateBlockchain")
	console.log(B)
	if(CommitBlock(B)){
		var loadResult = LoadBlock(0)
		if(!loadResult){
			callback("ERROR MAKING GENESIS")
		}else{
			callback(loadResult)
		}
	}
}
var WriteBlock = (Block) =>{
	fs.writeFileSync(BCDB+Block._bid+".kb", JSON.stringify(Block, null, 2), 'utf-8')
	var BlockRootInstances = Block.body.rootInstances
	BlockRootInstances.forEach(RootInstance => {
		console.log("BlockRootInstances iteration")
		console.log(RootInstance)
		var insertForGraph = { 
								subject: RootInstance.source, 
								predicate: "RI_TARGETED", 
								object: RootInstance.destination 
		}
		GraphInsert(RI_TARGETED, insertForGraph)
		
		var SourceDestination_B_CREATED = { 
								subject: RootInstance.source, 
								predicate: "B_CREATED", 
								object: RootInstance.hash 
		}
		GraphInsert(B_CREATED, SourceDestination_B_CREATED)
		
		var SourceDestination_RI_STOREDIN = { 
								subject: RootInstance.hash, 
								predicate: "RI_STOREDIN", 
								object: Block._bid 
		}
		GraphInsert(RI_STOREDIN, SourceDestination_RI_STOREDIN)
		
		var SourceDestination_A_MINED = { 
								subject: Block.body.data.owner, 
								predicate: "A_MINED", 
								object: Block._bid  
		}
		GraphInsert(A_MINED, SourceDestination_A_MINED)

	})
}
var LoadBlockchain = () => {
	var ReadBlock = undefined
	try{
		ReadBlock = LoadBlock(0)
	}catch(e){
		console.log("Database.LoadBlockchain: "+e+" : Error READING BLOCK ")
	}
	return (ReadBlock != null) 
			? LoadAllBlocks() 
			: false
}
var LoadAllBlocks = () => {
	var fns = ReadFileNamesInDirectory()
	console.log("fns: "+fns)
	var blockHeight = 0
	var BlockchainHolder = []
	for(var BlockIterator = 0; BlockIterator <= blockHeight; BlockIterator++){
		BlockchainHolder.push(LoadBlock(BlockIterator))
	}
	return BlockchainHolder
}
var GetBlockHeight = (filenames) => {
	try{
		var sortedBlockFileNames = []
		filenames.forEach(fileName => {
			var replacedFileName = fileName.replace('.kb','')
			var parsedBlockNumber = parseInt( replacedFileName )
			sortedBlockFileNames.push( parsedBlockNumber )
		})
		var maximumBlock = Math.max.apply(null, sortedBlockFileNames)
		console.log("maximumBlock: "+maximumBlock)
		return maximumBlock
	}catch(e){
		throw "ERROR GETTING BLOCK HEIGHT: "+e
	}
}
var ReadFileNamesInDirectory = () => {
	var blockFiles = []
	fs.readdirSync(BCDB).forEach(file => {
	  if (file.includes(".kb")) {
	  	blockFiles.push(file)
	  } else {
	  	LOGGER(file, "Error: Not a KB Block File")
	  }
	})
	return blockFiles
}
var LoadBlock = (BlockNumber) => {
	var filename = BCDB+BlockNumber+".kb"
	try{
		return JSON.parse(fs.readFileSync(filename).toString())
	}catch(e){
		throw "ERROR LOADING BLOCK "+BlockNumber
	}
}

var StoreStatefulObject = (stateFile, stateContent) => {
	var stateFileLocation = STATE+stateFile+".ks"
	console.log("stateFileLocation: "+stateFileLocation)
	fs.writeFileSync(stateFileLocation, JSON.stringify(stateContent, null, 2), 'utf-8')
}

var FetchStatefulObject = (stateFile) => {
	var stateFileLocation = STATE+stateFile+".ks"
	console.log("stateFileLocation: "+stateFileLocation)
	return JSON.parse(fs.readFileSync(stateFileLocation).toString())
}

var GraphInsert = (db, q) => {
	console.log("GraphInsert")
	console.log(q)
	db.put(q, function(err) {
	  GraphGet(db, q, function(result){
	  	console.log(result)
	  })
	});
}

var GraphGet = (db, q, callback) => {
	console.log("GraphGet")
	console.log(q)
	db.get(q, function(err, list) {
	  console.log("GraphGet Results")
	  callback(list)
	});
}

var GraphSearch = (db) => {
	var query = {
	    subject: db.v("a"),
	    predicate: "friend",
	    object: db.v("x")
	}
	db.search(query, { limit: 4, offset: 2 }, function(err, list) {
	  console.log(list);
	});
}

var GraphDelete = (db) => {
	var query = { 
		subject: "a", 
		predicate: "b", 
		object: "c" 
	}
	db.del(query, function(err) {

	});
}

var SearchForRootInstance = (hash, callback, error = null) => {
	LOGGER(hash, "inside SearchForRootInstance("+hash+")")
	GraphGet(RI_STOREDIN, {subject: hash}, function(result){
		if (result == undefined || result == null || result.length == 0){
			try{
				throw new Error("[SearchForRootInstance]: result == undefined || result == null || result.length == 0")
			} catch(e) {
				error("[SearchForRootInstance]: "+e)	
			}
		}else{
			LOGGER(result, "SearchForRootInstance, GraphGet, RI_STOREDIN")
			var blockNumber = result[0].object
			var blockToReference = LoadBlock(blockNumber)
			var allBlockRIs = blockToReference.body.rootInstances
			console.log("searching for RootInstance")
			console.log(allBlockRIs)
			var FoundRootInstance = () => {
				return allBlockRIs.find(function(root) {
			      return root.hash == hash;
			    });
			}
			callback(FoundRootInstance())
		}	
	})
}

var RebuildGraphFromBlockchain = () => {} 

function VerifyAllBlocks(topBlock){
    console.log("VerifyAllBlocks to block #:"+topBlock)
    var beginningBlock = -1;
    var lookbackWindow = 100
    if(topBlock < lookbackWindow){
    	beginningBlock = 1;
    }else{
    	beginningBlock = (topBlock - lookbackWindow) + 1;
    }
    for(var i = beginningBlock; i <= topBlock; i++){
        var iblock = LoadBlock(i)
        var prevBlock = LoadBlock(i-1)
        var blockHash = iblock.header.hash
        var blockPrevHash = iblock.header.previousHash
        var calcHashBlock = CryptographicUtility.CalculateHashForBlock(iblock)
        var calcHashPrevBlock = CryptographicUtility.CalculateHashForBlock(prevBlock)
        console.log("block: "+i)
        console.log({
            blockHash: blockHash,
            blockPrevHash: blockPrevHash,
            calcHashBlock: calcHashBlock,
            calcHashPrevBlock: calcHashPrevBlock
        })
        if(calcHashBlock == blockHash){
            console.log("calcHashBlock == blockHash")
        }else{
            throw new Error(JSON.stringify({
                message: "calcHashBlock DOES NOT blockHash",
                line: __line,
                code: 1
            }))
        }
        if(blockPrevHash == calcHashPrevBlock){
            console.log("blockPrevHash == calcHashPrevBlock")
        }else{
            throw new Error(JSON.stringify({
                message: "blockPrevHash DOES NOT calcHashPrevBlock",
                line: __line,
                code: 1
            }))
        }
        if(topBlock == iblock.header.blockIndex){
            LOGGER({
                topBlock: topBlock,
                currentBlock: iblock.header.blockIndex
            }, "CHAIN VALID IN VERIFYALLBLOCKS")
            return true;
        }
    }
}

module.exports = {
	ResyncBC,
	GetBlockchain, 
	InitiateBlockchain,
	GetBlockchain,
	TopBlock,
	CommitBlock,
	SearchForRootInstance,
	StoreStatefulObject,
	FetchStatefulObject,
	ReplaceBlockchain,
	LoadBlock
}
