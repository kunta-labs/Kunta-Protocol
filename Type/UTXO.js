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
var Crypto = CryptographicUtility.Crypto
var CryptoObj = CryptographicUtility.CRYPTOOBJ
var Script = require('../Script/Script.js')
var Database = require('../Database.js')
var merkle = require("merkle")
var Consensus = require('../Consensus.js')
class UTXO {
	constructor(){

	}
}

var RootToReference = (rootName, BLOCKCHAIN_CONFIGURATION) => {
    return BLOCKCHAIN_CONFIGURATION.roots.find(function(root) {
      return root.name == rootName;
    });
}

var Process = (blockData,
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
				   callback) => {
	if(rootInstancesToIndex.length == 0){
		Consensus.RUN([], 
    				 blockData, 
    				 nextIndex, 
    				 previousBlock.header.hash,
    				 nextTimestamp, 
    				 rootSet,
				 	 BLOCKCHAIN_CONFIGURATION,
            	 	 CONSENSUS_TYPE,
            	 	 difficulty, (function(MinedBlock){
	    	callback(MinedBlock);
	    }))
	}else{
		console.log(rootInstancesToIndex, "rootInstancesToIndex inside try")
		console.log(rootInstancesToIndex.length)
		var finishedRootInstances = false
    	var originalRILength = rootInstancesToIndex.length
		rootInstancesToIndex.forEach((root_instance,rii) => {
	    	var rIterator = rii
	    	var ri = rootInstancesToIndex[rIterator]
	        var RI = JSON.parse(ri)
	        console.log("RI")
	        console.log(RI)
	        var scriptSplit = RI.script.split(" ")
	        LOGGER(scriptSplit, "scriptSplit before switch(RI.class)")
	        if(RI.class == "female"){
	        	LOGGER(RI, "FEMALE, UTXO")
	    		console.log("RI KEYS: "+Object.keys(RI))
	            var verified = VerifiedFemaleRootInstance(RI.script)
	            if(verified){
		    		var publicKeyHash = scriptSplit[2] 
		    		RI.hash = CryptographicUtility.SHA256( ri )
		            RI.index = ++lastIndexedRootInstanceIndex
		            LOGGER(RI,"inside rootInstancesToIndex");
	    			rootInstanceInterim.push( JSON.stringify(RI) )
				    rootInstances = rootInstanceInterim
				    console.log("AFTER ROOTINSTANCEINTERM, Before merkle")
				    console.log(rootInstances)
				    for(var rootIndex = 0; rootIndex < BLOCKCHAIN_CONFIGURATION.roots.length; rootIndex++){
				        LOGGER(rootIndex, "generate next block, root iteration", true)
				        var rootTree = merkle('sha256').sync(rootInstances);
				        rootSet.push(rootTree.root())
				    }
	            } else{
					LOGGER(rootInstances, "Not verified for Male: ")
				}
    			console.log("male rii: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
				if( rIterator == rootInstancesToIndex.length - 1 ){
					console.log("male rii == rootInstancesToIndex.length : "+rIterator)
					finishedRootInstances = true
				}else{
					console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
				}
	        }else if(RI.class == "male"){
				var publickey = scriptSplit[1]
				Database.SearchForRootInstance(
											RI.partner, 
										(function(partnerRootInstance){
					LOGGER(partnerRootInstance, "MALE, UTXO, AFTER SearchForRootInstance")
					if(!partnerRootInstance){ 
						callback(false) 
					}
					var partnerScript = partnerRootInstance.script
					var splitPartnerScript = partnerScript.split(" ")
					LOGGER(splitPartnerScript,"MALE: splitPartnerScript")
					var scriptPublicKeyHash = splitPartnerScript[2] //<pubKeyHash>
					LOGGER(scriptPublicKeyHash,"MALE: scriptPublicKeyHash")
					var hashedMalePubkey = CryptographicUtility.SHA256(publickey)
					LOGGER(hashedMalePubkey,"MALE: hashedMalePubkey (hash of base64)")
					if( scriptPublicKeyHash == hashedMalePubkey ){ 
						console.log("scriptPublicKeyHash == hashedMaleRootInstancePubkey") 
					}else{
						console.log("scriptPublicKeyHash != hashedMaleRootInstancePubkey") 
					}
					RI.hash = CryptographicUtility.SHA256( ri )
					RI.index = partnerRootInstance.index
					var partnerHash = partnerRootInstance.hash
					var partnerNumber = 0
					var fullPublicKey = publickey
					var value = (function(){
						return 1
					})
					try{
						var referencedRoot = RootToReference(RI.type,BLOCKCHAIN_CONFIGURATION)
						var rootName = referencedRoot.name
						var rootIsIndexed = referencedRoot.index
						var rootType = referencedRoot.type
						var rootAccessType = referencedRoot.access
						var rootCode = referencedRoot.code
						LOGGER(
						{
							"root name": rootName,
							"root is indexed": rootIsIndexed,
							"root type": rootType,
							"root access type": rootAccessType,
							"root code": rootCode
						}
						, "MALE REFERENCED ROOT")
						var marriageScript = RI.script+" "+partnerScript	
						var processedScript = Script.PREPROCESS(rootCode,
																marriageScript,
																ri)
						LOGGER({
								 "root code": referencedRoot.code,
								 "marriageScript": marriageScript,
								 "processedScript": processedScript
								} , "after SCRIPT.PREPROCESS")
						var fullKVMScript = processedScript 
					}catch(e){
						console.log("ERROR IN MALE referencedRoot: "+e)
					}
					var verified = VerifiedMaleRootInstance(fullKVMScript)
					console.log("Verified: "+verified)
	                if(verified){
						console.log("PUSHING INTO interim: "+RI.hash)
	        			rootInstanceInterim.push( JSON.stringify(RI) )
					    rootInstances = rootInstanceInterim
					    console.log("AFTER ROOTINSTANCEINTERM, Before merkle")
					    console.log(rootInstances)
					    for(var rootIndex = 0; rootIndex < BLOCKCHAIN_CONFIGURATION.roots.length; rootIndex++){
					        LOGGER(rootIndex, "generate next block, root iteration", true)
					        var rootTree = merkle('sha256').sync(rootInstances);
					        rootSet.push(rootTree.root())
					    }
					}else{
						LOGGER(rootInstances, "[ERROR]: NOT VERIFIED FOR MALE: "+fullKVMScript)
					} 
        			console.log("male rii: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
					if( rIterator == rootInstancesToIndex.length - 1 ){
						console.log("male rii == rootInstancesToIndex.length : "+rIterator)
						finishedRootInstances = true
					}else{
						console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
					}	
				})) ///END OF Database.SearchForRootInstance
			} ///END IF MALE OR FEMALE
	    }) //END for each root instance
		var intervalCount = 0;
		var riInterval;
	    var rootInstanceInterval = () => {
	    	if(finishedRootInstances){
			    rootInstances = rootInstanceInterim
			    console.log("AFTER ROOTINSTANCEINTERM, Before merkle")
			    console.log(rootInstances)
			    var rootSet = []
			    for(var rootIndex = 0; rootIndex < BLOCKCHAIN_CONFIGURATION.roots.length; rootIndex++){
			        LOGGER(rootIndex, "generate next block, root iteration", true)
			        var rootTree = merkle('sha256').sync(rootInstances);
			        rootSet.push(rootTree.root())

			    }
			    Consensus.RUN(rootInstances, 
			    				 blockData, 
			    				 nextIndex, 
			    				 previousBlock.header.hash,
			    				 nextTimestamp, 
			    				 rootSet,
		    				 	 BLOCKCHAIN_CONFIGURATION,
		                	 	 CONSENSUS_TYPE,
		                	 	 difficulty, (function(MinedBlock, RIToRemove){
		 			intervalGuardian(riInterval)
			    	callback(MinedBlock, RIToRemove);
			    }))
			}
	    }
	    riInterval = setInterval((function(){
	    	rootInstanceInterval()
	    }), 100)
	}
}

var intervalGuardian = (intervalToClear) => {
	clearInterval(intervalToClear)
}

var GenerateGenesis = (
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
		        	   CONSENSUS_TYPE,
		        	   callback) => {
	console.log("ACCESS TYPE")
	console.log(ACCESS_TYPE)
	var genesis_rootInstanceType = "tx"
    var genesis_rootInstanceClass = "female"
    var genesis_rootInstanceScript = "OP_DUP OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_EQUAL OP_VERIFY"
    var referencedRoot = RootToReference(genesis_rootInstanceType, BLOCKCHAIN_CONFIGURATION)
    if(RootToReference != undefined){
        var rootInstances = []
        if(referencedRoot.access == ACCESS_TYPE.PRIVATE){
            var rootToEncrypt = {
                          "type": genesis_rootInstanceType,
                          "class": genesis_rootInstanceClass,
                          "script": genesis_rootInstanceScript,
                          "destination": CryptoObj.pubkeyHash,
                          "source": CryptoObj.pubkeyHash,
                          "timestamp": startingTimestamp,
                          "index": 0,
                          "version": VERSION_NUMBER,
            }
            var encryptedRootInstance = CryptoObj.privkey.encrypt(JSON.stringify(rootToEncrypt), 
            													 'utf8', 
            													 'base64');
            rootToEncrypt["message"] = encryptedRootInstance
            rootToEncrypt["hash"] = CryptographicUtility.HASHDATA(JSON.stringify(rootToEncrypt))
            rootInstances = [rootToEncrypt]
        }else if(referencedRoot.access == ACCESS_TYPE.PUBLIC){
            var rootToProcess = {
                          "type": genesis_rootInstanceType,
                          "class": genesis_rootInstanceClass,
                          "script": genesis_rootInstanceScript,
                          "destination": CryptoObj.pubkeyHash,
                          "source": CryptoObj.pubkeyHash,
                          "timestamp": startingTimestamp,
                          "index": 0,
                          "version": VERSION_NUMBER,
            }
            var rootInstance = "rootInstance";
            rootToProcess["message"] = rootInstance
            rootToProcess["hash"] = CryptographicUtility.HASHDATA(JSON.stringify(rootToProcess))
            rootInstances = [rootToProcess]
        }
    }else{
    	LOGGER(RootToReference, "RootToReference is undefined", true)
    }
    for(var rootIndex = 0; rootIndex < BLOCKCHAIN_CONFIGURATION.roots.length; rootIndex++){
        LOGGER(rootIndex, "genesis block, root iteration", true)
        var rootTree = merkle('sha256').sync(rootInstances);
        rootSet.push(rootTree.root())
    }
    LOGGER(JSON.stringify(BLOCKCHAIN_CONFIGURATION),"GENERSIS BLOCK CREATION, BLOCKCHAIN_CONFIGURATION")
    Consensus.RUN(rootInstances, 
    				 startingBlockData, 
    				 startingIndex, 
    				 startingHash,
    				 startingTimestamp, 
    				 rootSet,
    				 BLOCKCHAIN_CONFIGURATION,
                	 CONSENSUS_TYPE,
                	 difficulty, (function(MinedBlock){
    	callback(MinedBlock);
    }))
}

var VerifiedFemaleRootInstance = (script) => {
	try{
		var kvm_result = Script.EXECUTE(script)
		return Script.EXECUTE(script)
	}catch(e){
		LOGGER(e,"[FAILED] VerifiedFemaleRootInstance")
		return false
	}	
}

var VerifiedMaleRootInstance = (script) => {
	try{
		var kvm_result = Script.EXECUTE(script)
		return Script.EXECUTE(script)
	}catch(e){
		LOGGER(e,"[FAILED] VerifiedMaleRootInstance")
		return false
	}	
}

module.exports = {
	GenerateGenesis,
	Process
}

