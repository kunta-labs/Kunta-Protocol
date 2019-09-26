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

var LOGGER = require('../core/Logger.js')
var CryptographicUtility = require('../core/Crypto.js')
var MineAttempt = CryptographicUtility.MineAttempt
var BlockProperties = require('../core/BlockProperties.js')
var Block = BlockProperties.Block
var CalculateHashForBlock = CryptographicUtility.CalculateHashForBlock
var CalculateHash = CryptographicUtility.CalculateHash

async function threadMine(
								 mails, 
								 MineSuccess,
								 constraintStringOrig,
								 difficulty,
								 rootInstances,
								 blockData,
								 nextIndex,
								 previousBlockHeaderHash,
								 nextTimestamp,
			                     rootSet, 
			                     BLOCKCHAIN_CONFIGURATION,
			                     CONSENSUS_TYPE,
								 ) {

	var Database = require('../core/Database.js')

	///CHECK
	console.log("threadMine:")
	console.log(mails)
	console.log(MineSuccess)
	console.log(constraintStringOrig)
	console.log(difficulty)
	//console.log(rootInstances)
	//console.log(blockData)
	console.log("nexti: "+nextIndex)
	console.log(previousBlockHeaderHash)
	console.log(nextTimestamp)
	//console.log(rootSet)
	//console.log(BLOCKCHAIN_CONFIGURATION)
	console.log(CONSENSUS_TYPE)

	///END CHECK



	CryptographicUtility.SOLVED_BY_ANOTHER = false

	// var solved = false
    var nonce = 0
    
    var constraintString = constraintStringOrig

    ///array of objects with quotations around keys
    
    var RIOBJS = []

    //[Delete]
    //TODO: is this necessary because RIs are passed as objects
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

    /////////todo: FINALIZE blockdata
    var stringedblockData = JSON.stringify(blockData)

    //////TODO: POTENTIAL TO MINE ON OTHER THREAD
    ////////////////////////////////////////////////////////


    
   var solved = false
   var topBlockHash = {}
   
   if(nextIndex != 0){
   	topBlockHash = Database.TopBlock().header.hash;
   }

   while(!solved){ 

       var nextHash = MineAttempt(nextIndex, 
                                   previousBlockHeaderHash,  //(previousBlock)
                                   nextTimestamp, 
                                   stringedblockData,        //blockData
                                   stringedRIs,
                                   nonce);
                                    

       if(nextHash.substring(0, difficulty) == constraintString){
            console.log("SOLVED")
            solved = true
       }else{
            //TODO increment nonce by 1
            nonce++
            
            if(nextIndex != 0){
	            if(topBlockHash != Database.TopBlock().header.hash){
	            	throw new Error("TOP BLOCK CHANGED DURING MINING")
	            }
        	}

       }
        
   }
    

   //TODO 2019: we want to calculate the nonce in wasm/rust
   //return the nonce, and finalize block

   console.log("block exists")
   console.log(Block)

   var minedBlock = new Block(
                         nextIndex, 
                         nextHash,
                         0.0,
                         previousBlockHeaderHash, 
                         rootSet,
                         nextTimestamp, 
                         blockData,    //NOT STRINGED
                         nonce,
                         rootInstances //NOT STRINGED
                         )

   //MineSuccess(minedBlock, rootInstances)



   // logic for
   // sending multiple mails
   //return sendMails;
   return minedBlock
}

// receive message from master process
process.on('message', async (message) => {

  try{
  		const minedBlock = await threadMine(
								  	message.mails,
								  	message.MineSuccess,
								  	message.constraintString,
								  	message.difficulty,
								  	message.rootInstances,
								  	message.blockData,
                    				message.nextIndex,
                    				message.previousBlockHeaderHash,
                    				message.nextTimestamp,
				                    message.rootSet, 
				                    message.BLOCKCHAIN_CONFIGURATION,
				                    message.CONSENSUS_TYPE,
								  ); 
  
		// send response to master process
		process.send({ 
	  				newBlock: minedBlock 
		});

  }catch(e){
  		console.log("ERROR POW_MINE_THREAD: "+e)
  }


});

module.exports = {
	threadMine
}