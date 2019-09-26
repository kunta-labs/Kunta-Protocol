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
class ACCOUNT {
	constructor(){

	}
}

var RootToReference = (rootName, BLOCKCHAIN_CONFIGURATION) => {
    return BLOCKCHAIN_CONFIGURATION.roots.find(function(root) {
      return root.name == rootName;
    });
}

var GetStatefulObject = (type, callback) => {
	callback(Database.FetchStatefulObject(type))
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
				   callback, 
				   error = null) => {
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
	    	console.log("NEVER: "+rIterator)
	    	try{
		    	var ri = rootInstancesToIndex[rIterator]
		        var RI = JSON.parse(ri)
		        console.log("RI")
		        console.log(RI)
		        console.log("98: rii: "+rIterator)
		        var scriptSplit = RI.script.split(" ")
		        LOGGER(scriptSplit, "scriptSplit before switch(RI.class)")
		        if(RI.class == "female"){
		        	LOGGER(RI, "FEMALE, ACCOUNT-BASED")
		    		console.log("FEMALE, RI KEYS: "+Object.keys(RI))
		    		RI.hash = CryptographicUtility.SHA256( ri )
		            var verified = true //VerifyFemaleRootInstance(RI.script)
		            if(verified){
						var rootName = RI.type
						var stateobj = Database.FetchStatefulObject(rootName) 
						LOGGER(stateobj, "FEMALE CURRENT STATE: "+rootName)
						var testKVMResult = [1, 1] 
						var rootAspectHolder = {}
						var rootAspects = RootToReference(RI.type, BLOCKCHAIN_CONFIGURATION).aspects
						for(var ra = 0; ra < rootAspects.length; ra++){
							rootAspectHolder[ rootAspects[ra].aspect ] = rootAspects[ra].default_value
						}
						var identifier = RI.hash //CryptoObj.pubkeyHash
						stateobj[identifier] = rootAspectHolder	
						Database.StoreStatefulObject(rootName, stateobj ) 
			    		var publicKeyHash = scriptSplit[2] //obsolete
			            RI.index = 0
			            LOGGER(RI,"inside rootInstancesToIndex");
		    			rootInstanceInterim.push( JSON.stringify(RI) )
		            } else{
						LOGGER(rootInstances, "Not verified for Female: ")
					}
        			console.log("female rii 247: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
					if( rIterator == (rootInstancesToIndex.length - 1) ){
						console.log("female rii == rootInstancesToIndex.length : "+rIterator)
						finishedRootInstances = true
					}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
						console.log("female else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
						finishedRootInstances = true
					}else{
						console.log("female else: "+rIterator+ " length: "+rootInstancesToIndex.length)
					}
		        }else if(RI.class == "male"){
					var publickey = scriptSplit[1]
					LOGGER(publickey, "Male, account-based publickey")
					Database.SearchForRootInstance(
										RI.partner, (async function(partnerInstance){
						LOGGER(partnerInstance, "MALE, ACCOUNT-BASED, partnerInstance")
						if(!partnerInstance){ 
							callback(false) 
						}
						var partnerScript = partnerInstance.script
						RI.hash = CryptographicUtility.SHA256( ri )
						RI.index = partnerInstance.index
						var partnerHash = partnerInstance.hash
						var partnerNumber = 0
						var value = (function(){
							return 1
						})								
						var preprocess_error = false;
						try{
							var referencedRoot = RootToReference(RI.type, BLOCKCHAIN_CONFIGURATION)
							var rootName = referencedRoot.name
							var rootIsIndexed = referencedRoot.index
							var rootType = referencedRoot.type
							var rootAccessType = referencedRoot.access
							var rootReturn = referencedRoot.return
							var rootCode = referencedRoot.code

							LOGGER(
							{
								"root name": rootName,
								"root is indexed": rootIsIndexed,
								"root type": rootType,
								"root access type": rootAccessType,
								"root return structure": rootReturn,
								"root code": rootCode
							}
							, "MALE REFERENCED ROOT")
							var marriageScript = RI.script+" "+partnerScript
							var identifier = RI.destination //CryptoObj.pubkeyHash
							var processedScript = await Script.PREPROCESS(
																	rootCode,
																	marriageScript,
																	ri,
																	identifier,
																	rootName)
							LOGGER({
									 "root code": referencedRoot.code,
									 "marriageScript": marriageScript,
									 "processedScript": processedScript
									} , "after SCRIPT.PREPROCESS")
							var fullKVMScript = processedScript 
						}catch(e){
							console.log("ERROR IN MALE referencedRoot or PREPROCESS error, male not added: "+e)
							preprocess_error = true;
						}
						try{
							if(!preprocess_error){ 
								VerifyMaleRootInstance(BLOCKCHAIN_CONFIGURATION, 
													   fullKVMScript, 
													   function(verified){
									LOGGER(verified, "[Male Verified]")
									if(verified){
					                	var returnKeys = Object.keys(verified)
					                	var numOfReturnKeys = returnKeys.length
					                	console.log("rootReturn: "+rootReturn)
					                	var splitRootReturnCode = rootReturn.split(" ")
					                	console.log(verified)
					                	var foundFailureCode = false
					                	verified.forEach( (v, i) => {
					                		if(v[i] == Script.FAILURE_CODE_CONSTANT){
					                			foundFailureCode = true
					                		}
					                	})
										if(foundFailureCode){
											msgToThrow = Script.FAILURE_CODE_CONSTANT+": IS PRESENT in "+JSON.stringify(verified)
											console.log(msgToThrow)
										}
					                	if( numOfReturnKeys != splitRootReturnCode.length){
					                		msgToThrow = "numOfReturnKeys != rootReturn.split().length"
					                		console.log(msgToThrow)
					                	}
					                	if((!foundFailureCode) && (numOfReturnKeys == splitRootReturnCode.length)){
						                	console.log("numOfReturnKeys: "+numOfReturnKeys)
						                	var StatefulObject = Database.FetchStatefulObject(rootName)
						                	var currentStateObjectHolder = {}
						                	for (var KVMReturnObjKey = 0 ; KVMReturnObjKey < numOfReturnKeys; KVMReturnObjKey++) {
						                		var iteratedKey = returnKeys[KVMReturnObjKey] 
											    if (verified.hasOwnProperty( iteratedKey )) {
											        LOGGER( verified[KVMReturnObjKey], "[KVMReturnObject]" )
											        console.log("identifier: "+identifier)
											        console.log("splitRootReturnCode[KVMReturnObjKey]: "+splitRootReturnCode[KVMReturnObjKey])
											        console.log("iteratedKey: "+iteratedKey)
											        console.log("verified[iteratedKey]:")
											        console.log(verified[iteratedKey]) //ITERATES OVER ARRAY OF OBJECTS
											        console.log("KVMReturnObjKey: "+KVMReturnObjKey)
											        console.log("verified[iteratedKey][KVMReturnObjKey]: "+verified[iteratedKey][KVMReturnObjKey])
											        
											        //NOTE: This is the the element inside of an array of objects,
											        //of which we select, and then select the key from it, and take that value
											        //[{'0':'1'}], select first object, 0, and then the '0' key's value
											        //verified[iteratedKey][KVMReturnObjKey]

											        try{
											        	StatefulObject[identifier][ splitRootReturnCode[KVMReturnObjKey] ] = verified[iteratedKey]
											        }catch(e){
											        	LOGGER(StatefulObject, "[ERROR]: StatefulObject ASSIGNMENT POST VM")
											        }
											    }
											}
											Database.StoreStatefulObject( rootName, StatefulObject )
											console.log("PUSHING INTO interim: "+RI.hash)
						        			rootInstanceInterim.push( JSON.stringify(RI) )
						        		} 
									} else{
										LOGGER(rootInstances, "[ERROR]: NOT VERIFIED FOR MALE: "+fullKVMScript)
									} 
				        			console.log("male rii 558: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
									if( rIterator == rootInstancesToIndex.length - 1 ){
										console.log("male rii == rootInstancesToIndex.length : "+rIterator)
										finishedRootInstances = true
									}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
										console.log("male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
										finishedRootInstances = true
									}else{
										console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
									}
								})
							}else{ 
								console.log("ERROR, COULDNT EXECUTE RI: "+RI.hash+" due to preprocess error found!")
			        			console.log("male rii 600: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
								if( rIterator == rootInstancesToIndex.length - 1 ){
									console.log("PREPROCESS error: male rii == rootInstancesToIndex.length-1 : "+rIterator)
									finishedRootInstances = true
								}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
									console.log("PREPROCESS error: male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
									finishedRootInstances = true
								}else{
									console.log("PREPROCESS error: male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
								}
							}
						}catch(e){
							console.log("[ERROR] male no verified: "+e)
		        			console.log("male rii 626: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
							if( rIterator == rootInstancesToIndex.length - 1 ){
								console.log("male rii == rootInstancesToIndex.length : "+rIterator)
								finishedRootInstances = true
							}else{
								console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
							}
						}		
					})
					, 
					(function(e){
						console.log(("Database.SearchForRootInstance [ERROR]: "+e))
						console.log("DELETED ROOT INSTANCE BECAUSE OF ERROR: ")
						console.log(rootInstancesToIndex)
						rootInstancesToIndex.splice(rii)
						console.log("AFTER DELETED ROOT INSTANCE BECAUSE OF ERROR: ")
						console.log(rootInstancesToIndex)
	        			console.log("male rii 669: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
						if( rIterator == rootInstancesToIndex.length - 1 ){
							console.log("male rii == rootInstancesToIndex.length : "+rIterator)
							finishedRootInstances = true
						}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
							console.log("male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
							finishedRootInstances = true
						}else{
							console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
						}
					})
					) 
				} 
			} catch (e) { 
				console.log("Process foreach(RI) [ERROR]: "+e)
    			console.log("male rii 703: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
				if( rIterator == rootInstancesToIndex.length - 1 ){
					console.log("male rii == rootInstancesToIndex.length : "+rIterator)
					finishedRootInstances = true
				}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
					console.log("male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
					finishedRootInstances = true
				}else{
					console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
				}
			}
	    }) 
		var intervalCount = 0;
		var riInterval;
	    var rootInstanceInterval = () => {
	    	if(finishedRootInstances){
			    rootInstances = rootInstanceInterim
			    console.log("Process: AFTER ROOTINSTANCEINTERM, Before merkle")
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
	var initial_state_object = startingBlockData.STATE
	var initial_root_states = []
	for(var rii = 0; rii < BLOCKCHAIN_CONFIGURATION.roots.length; rii++){
		var rootName = BLOCKCHAIN_CONFIGURATION.roots[rii].name
		console.log("GenerateGenesis: "+rootName)
		var rootAspectHolder = {}
		var rootAspects = BLOCKCHAIN_CONFIGURATION.roots[rii].aspects
		for(var ra = 0; ra < rootAspects.length; ra++){
			rootAspectHolder[ rootAspects[ra].aspect ] = rootAspects[ra].default_value // TODO: [DEFAULT VALUE]
		}
		var initialIterationState = {}
		initialIterationState["0GENESIS_"+rootName] = rootAspectHolder
		Database.StoreStatefulObject(rootName, initialIterationState )  
		initial_state_object = Database.FetchStatefulObject(rootName) 
		initial_root_states.push(initial_state_object)
	}

	var genesis_rootInstanceType = "vote"
    var genesis_rootInstanceClass = "female"
    var genesis_rootInstanceScript = "[CHECKSIG] 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4"
    var initial_message = "Never you mind, boy, never you mind. Let’s get on back to home. I got enough trouble teaching you the difference between manure and massa. ‘Course there ain’t all that much difference when you gets right down to it."
    var referencedRoot = RootToReference(genesis_rootInstanceType, BLOCKCHAIN_CONFIGURATION)
    if(RootToReference != undefined){
        var rootInstances = []
        if(referencedRoot.access == ACCESS_TYPE.PRIVATE){
            var rootToEncrypt = {
                          "type": genesis_rootInstanceType,
                          "class": genesis_rootInstanceClass,
                          "script": genesis_rootInstanceScript,
                          "destination": "GENSIS",//CryptoObj.pubkeyHash,
                          "source": "GENESIS",//CryptoObj.pubkeyHash,
                          "timestamp": startingTimestamp,
                          "index": 0,
                          "version": VERSION_NUMBER,
            }
            var encryptedMessage = cryptoObj.privkey.encrypt(initial_message, 'utf8', 'base64');
            rootToEncrypt["message"] = encryptedMessage
            rootToEncrypt["hash"] = CryptographicUtility.HASHDATA(JSON.stringify(rootToEncrypt))
            rootInstances = [rootToEncrypt]
        }else if(referencedRoot.access == ACCESS_TYPE.PUBLIC){
            var rootToProcess = {
                          "type": genesis_rootInstanceType,
                          "class": genesis_rootInstanceClass,
                          "script": genesis_rootInstanceScript,
                          "destination": "GENESIS", //CryptoObj.pubkeyHash,
                          "source": "GENESIS", //CryptoObj.pubkeyHash,
                          "timestamp": startingTimestamp,
                          "index": 0,
                          "version": VERSION_NUMBER,
            }
            rootToProcess["message"] = initial_message
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

var VerifyFemaleRootInstance = (BLOCKCHAIN_CONFIGURATION, script, callback) => {
	try{
		Script.EXECUTE(BLOCKCHAIN_CONFIGURATION, "VM", script, function(EXECUTION_RESULT){
			callback(EXECUTION_RESULT)
		})
	}catch(e){
		throw new Error("Error: [VerifyFemaleRootInstance]: "+e)
	}
}

var VerifyMaleRootInstance = (BLOCKCHAIN_CONFIGURATION, script, callback) => {
	try{
		Script.EXECUTE(BLOCKCHAIN_CONFIGURATION, "VM", script, function(EXECUTION_RESULT){
			callback(EXECUTION_RESULT)
		})
	}catch(e){
		console.log("logging VerifyMaleRootInstance error...")
		throw new Error("Error: [VerifyMaleRootInstance]: "+e)
	}
}

var ProcessRootInstancesForPeerBlock = (rootInstancesToIndex, rootInstanceInterim, BLOCKCHAIN_CONFIGURATION, referrer, callback) => {
	if(rootInstancesToIndex.length == 0){
	 console.log("ProcessRootInstancesForPeerBlock: RootInstances are blank")
	 callback("no root instances");
	}else{
		console.log(rootInstancesToIndex, "rootInstancesToIndex inside try")
		console.log(rootInstancesToIndex.length)
		var finishedRootInstances = false
	    var originalRILength = rootInstancesToIndex.length
		rootInstancesToIndex.forEach((root_instance, rii) => {
	    	var rIterator = rii
	    	console.log("NEVER: "+rIterator)
	    	try{
		    	var ri = rootInstancesToIndex[rIterator]
		        var RI = ri //JSON.parse(ri)
		        console.log("RI")
		        console.log(RI)
		        console.log("98: rii: "+rIterator)
		        var scriptSplit = RI.script.split(" ")
		        LOGGER(scriptSplit, "scriptSplit before switch(RI.class)")
		        if(RI.class == "female"){
		        	LOGGER(RI, "FEMALE, ACCOUNT-BASED")
		    		console.log("FEMALE, RI KEYS: "+Object.keys(RI))
		    		RI.hash = CryptographicUtility.SHA256( ri )
		            var verified = true //VerifyFemaleRootInstance(RI.script)
		            if(verified){
						var rootName = RI.type
						var stateobj = Database.FetchStatefulObject(rootName) 
						LOGGER(stateobj, "FEMALE CURRENT STATE: "+rootName)
						var testKVMResult = [1, 1]
						var rootAspectHolder = {}
						var rootAspects = RootToReference(RI.type, BLOCKCHAIN_CONFIGURATION).aspects
						for(var ra = 0; ra < rootAspects.length; ra++){
							rootAspectHolder[ rootAspects[ra].aspect ] = rootAspects[ra].default_value
						}
						var identifier = RI.hash//CryptoObj.pubkeyHash
						stateobj[identifier] = rootAspectHolder	
						Database.StoreStatefulObject(rootName, stateobj ) 
			    		var publicKeyHash = scriptSplit[2] 
			            RI.index = 0//++lastIndexedRootInstanceIndex
			            LOGGER(RI,"inside rootInstancesToIndex");
		    			rootInstanceInterim.push( JSON.stringify(RI) )
		            } else{
						LOGGER(rootInstances, "Not verified for Female: ")
					}
        			console.log("female rii 247: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
					if( rIterator == (rootInstancesToIndex.length - 1) ){
						console.log("female rii == rootInstancesToIndex.length : "+rIterator)
						finishedRootInstances = true
					}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
						console.log("female else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
						finishedRootInstances = true
					}else{
						console.log("female else: "+rIterator+ " length: "+rootInstancesToIndex.length)
					}
		        }else if(RI.class == "male"){
					var publickey = scriptSplit[1]
					LOGGER(publickey, "Male, account-based publickey")
					Database.SearchForRootInstance(
										RI.partner, (async function(partnerInstance){
						LOGGER(partnerInstance, "MALE, ACCOUNT-BASED, partnerInstance")
						if(!partnerInstance){ 
							callback(false) 
						}
						var partnerScript = partnerInstance.script
						RI.hash = CryptographicUtility.SHA256( ri )
						RI.index = partnerInstance.index
						var partnerHash = partnerInstance.hash
						var partnerNumber = 0
						var value = (function(){
							return 1
						})
						var preprocess_error = false;
						try{
							var referencedRoot = RootToReference(RI.type, BLOCKCHAIN_CONFIGURATION)
							var rootName = referencedRoot.name
							var rootIsIndexed = referencedRoot.index
							var rootType = referencedRoot.type
							var rootAccessType = referencedRoot.access
							var rootReturn = referencedRoot.return
							var rootCode = referencedRoot.code
							LOGGER(
							{
								"root name": rootName,
								"root is indexed": rootIsIndexed,
								"root type": rootType,
								"root access type": rootAccessType,
								"root return structure": rootReturn,
								"root code": rootCode
							}
							, "MALE REFERENCED ROOT")
							var marriageScript = RI.script+" "+partnerScript
							var identifier = RI.destination //CryptoObj.pubkeyHash
							var processedScript = await Script.PREPROCESS(
																	rootCode,
																	marriageScript,
																	ri,
																	identifier, //ID - was StatefulObject[CryptoObj.pubkeyHash]
																	rootName)
							LOGGER({
									 "root code": referencedRoot.code,
									 "marriageScript": marriageScript,
									 "processedScript": processedScript
									} , "after SCRIPT.PREPROCESS")
							var fullKVMScript = processedScript 
						}catch(e){
							console.log("ERROR IN MALE referencedRoot or PREPROCESS error, male not added: "+e)
							preprocess_error = true;
						}
						try{
							if(!preprocess_error){ 
								VerifyMaleRootInstance(BLOCKCHAIN_CONFIGURATION, 
													   fullKVMScript, 
													   function(verified){
									LOGGER(verified, "[Male Verified]")
									if(verified){
					                	var returnKeys = Object.keys(verified)
					                	var numOfReturnKeys = returnKeys.length
					                	console.log("rootReturn: "+rootReturn)
					                	var splitRootReturnCode = rootReturn.split(" ")
					                	console.log(verified)
					                	var foundFailureCode = false
					                	verified.forEach( (v, i) => {
					                		if(v[i] == Script.FAILURE_CODE_CONSTANT){
					                			foundFailureCode = true
					                		}
					                	})
										if(foundFailureCode){
											msgToThrow = Script.FAILURE_CODE_CONSTANT+": IS PRESENT in "+JSON.stringify(verified)
											console.log(msgToThrow)
										}
					                	if( numOfReturnKeys != splitRootReturnCode.length){
					                		msgToThrow = "numOfReturnKeys != rootReturn.split().length"
					                		console.log(msgToThrow)
					                	}
					                	if((!foundFailureCode) && (numOfReturnKeys == splitRootReturnCode.length)){
						                	console.log("numOfReturnKeys: "+numOfReturnKeys)
						                	var StatefulObject = Database.FetchStatefulObject(rootName)
						                	var currentStateObjectHolder = {}
						                	for (var KVMReturnObjKey = 0 ; KVMReturnObjKey < numOfReturnKeys; KVMReturnObjKey++) {
						                		var iteratedKey = returnKeys[KVMReturnObjKey] //0,1
											    if (verified.hasOwnProperty( iteratedKey )) {
											        LOGGER( verified[KVMReturnObjKey], "[KVMReturnObject]" )
											        console.log("identifier: "+identifier)
											        console.log("splitRootReturnCode[KVMReturnObjKey]: "+splitRootReturnCode[KVMReturnObjKey])
											        console.log("iteratedKey: "+iteratedKey)
											        console.log("verified[iteratedKey]:")
											        console.log(verified[iteratedKey]) //ITERATES OVER ARRAY OF OBJECTS
											        console.log("KVMReturnObjKey: "+KVMReturnObjKey)
											        console.log("verified[iteratedKey][KVMReturnObjKey]: "+verified[iteratedKey][KVMReturnObjKey])
											        try{
											        	StatefulObject[identifier][ splitRootReturnCode[KVMReturnObjKey] ] = verified[iteratedKey]
											        }catch(e){
											        	LOGGER(StatefulObject, "[ERROR]: StatefulObject ASSIGNMENT POST VM")
											        }
											    }
											}
											Database.StoreStatefulObject( rootName, StatefulObject )
											console.log("PUSHING INTO interim: "+RI.hash)
						        			rootInstanceInterim.push( JSON.stringify(RI) )
						        		} 
									} else{
										LOGGER(rootInstances, "[ERROR]: NOT VERIFIED FOR MALE: "+fullKVMScript)
									} 
				        			console.log("male rii 558: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
									if( rIterator == rootInstancesToIndex.length - 1 ){
										console.log("male rii == rootInstancesToIndex.length : "+rIterator)
										finishedRootInstances = true
									}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
										console.log("male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
										finishedRootInstances = true
									}else{
										console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
									}
								}) 
							}else{ 
								console.log("ERROR, COULDNT EXECUTE RI: "+RI.hash+" due to preprocess error found!")
			        			console.log("male rii 600: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
								if( rIterator == rootInstancesToIndex.length - 1 ){
									console.log("PREPROCESS error: male rii == rootInstancesToIndex.length-1 : "+rIterator)
									finishedRootInstances = true
								}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
									console.log("PREPROCESS error: male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
									finishedRootInstances = true
								}else{
									console.log("PREPROCESS error: male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
								}
							}
						}catch(e){
							console.log("[ERROR] male no verified: "+e)
		        			console.log("male rii 626: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
							if( rIterator == rootInstancesToIndex.length - 1 ){
								console.log("male rii == rootInstancesToIndex.length : "+rIterator)
								finishedRootInstances = true
							}else{
								console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
							}
						}		
					})
					, 
					(function(e){
						console.log(("Database.SearchForRootInstance [ERROR]: "+e))
						console.log("DELETED ROOT INSTANCE BECAUSE OF ERROR: ")
						console.log(rootInstancesToIndex)
						rootInstancesToIndex.splice(rii)
						console.log("AFTER DELETED ROOT INSTANCE BECAUSE OF ERROR: ")
						console.log(rootInstancesToIndex)
	        			console.log("male rii 669: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
						if( rIterator == rootInstancesToIndex.length - 1 ){
							console.log("male rii == rootInstancesToIndex.length : "+rIterator)
							finishedRootInstances = true
						}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
							console.log("male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
							finishedRootInstances = true
						}else{
							console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
						}
					})
					) 
				} 
			} catch (e) { 
				console.log("ProcessRootInstancesForPeerBlock: foreach(RI) [ERROR]: "+e)
    			console.log("male rii 703: "+rIterator+" rootInstancesToIndex.length: "+rootInstancesToIndex.length)
				if( rIterator == rootInstancesToIndex.length - 1 ){
					console.log("male rii == rootInstancesToIndex.length : "+rIterator)
					finishedRootInstances = true
				}else if( (rIterator == rootInstancesToIndex.length) && (rootInstancesToIndex.length == 0)){
					console.log("male else if 0: "+rIterator+ " length: "+rootInstancesToIndex.length)
					finishedRootInstances = true
				}else{
					console.log("male else: "+rIterator+ " length: "+rootInstancesToIndex.length)
				}
			}
	    }) 
		var intervalCount = 0;
		var riInterval;
	    var rootInstanceInterval = () => {
	    	if(finishedRootInstances){
			    rootInstances = rootInstanceInterim
			    console.log("ProcessRootInstancesForPeerBlock: AFTER ROOTINSTANCEINTERM ["+referrer+"], Before merkle")
			    console.log(rootInstances)
			    var rootSet = []
			    for(var rootIndex = 0; rootIndex < BLOCKCHAIN_CONFIGURATION.roots.length; rootIndex++){
			        LOGGER(rootIndex, "generate next block, root iteration", true)
			        var rootTree = merkle('sha256').sync(rootInstances);
			        rootSet.push(rootTree.root())
			    }
			   	console.log("ProcessRootInstancesForPeerBlock: RootInstances non-empty, consensus")
		    	callback("root instances done in ProcessRootInstancesForPeerBlock");
			}
	    }
	    riInterval = setInterval((function(){
	    	rootInstanceInterval()
	    }), 100)
	} 
}

module.exports = {
	GenerateGenesis,
	Process,
	ProcessRootInstancesForPeerBlock
}
