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

var CryptographicUtility = require('../Crypto.js')
var fs = require('fs')
//const say = require('say')
var fileLocation = "./core/storage/BC/"
var blockIndex = 0;
var ThrowError = (e) => {
	throw new Error(JSON.stringify(e))
} 

function verifyAllBlocks(topBlock){
	var beginningBlock = 1;
	for(var i = beginningBlock; i <= topBlock; i++){
		var iblock = JSON.parse(fs.readFileSync(fileLocation+i+".kb").toString())
		var prevBlock = JSON.parse(fs.readFileSync(fileLocation+(i - 1)+".kb").toString())
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
			say.speak("calcHashBlock DOES NOT blockHash")
			ThrowError({
				message: "calcHashBlock DOES NOT blockHash",
				line: __line,
				code: 1
			})
		}
		if(blockPrevHash == calcHashPrevBlock){
			console.log("blockPrevHash == calcHashPrevBlock")
		}else{
			say.speak("blockPrevHash DOES NOT calcHashPrevBlock")
			ThrowError({
				message: "blockPrevHash DOES NOT calcHashPrevBlock",
				line: __line,
				code: 1
			})
		}
	}
}

verifyGoal = 1000000

function go(){
	try{
		verifyAllBlocks(verifyGoal)
	}catch(e1){
		//try{
		console.info("got an error: "+e1)
		if(e1.code == 1){
			say.speak('Got MANUAL ERROR CODE: KILLING: '+e1)
			throw("GOT E1")
		}else{
			//say.speak('Got a file Error!: '+e1)
			console.error(e1)
		}
		//}catch(e2){
		//	console.log("E.CODE DOES NOT EXIST")
		//	throw(e2)
		//}
	}
	setTimeout(go, 5000)
}

//say.speak('Starting Verification')

go()
