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
var Database = require('../Database.js')
var CryptoObj = CryptographicUtility.CRYPTOOBJ
const crypto2 = require('crypto2');
const FAILURE_CODE_CONSTANT = "<<$FAILURE$>>"
var VM = require('./VM.js')
var ONB = require('./ONB.js')
var EXECUTE = (bcc, target, script, callback) => {
	try{
		if(target == "VM") {
			VM.EXECUTE(bcc, script, (function(EXECUTION_RESULT){
				LOGGER(EXECUTION_RESULT, "VM EXECUTION RESULT");
				var EXECUTION_RESULT = JSON.parse(EXECUTION_RESULT)
				if(EXECUTION_RESULT.length > 0){
					console.log("VM [EXECUTION_RESULT.length] == "+EXECUTION_RESULT.length)
				}else{
					console.log("VM [EXECUTION_RESULT.length] == 0")
					EXECUTION_RESULT.push(["-1"])
					LOGGER(EXECUTION_RESULT, "VM [EXECUTION_RESULT] SCRIPT")
				}	
				if (EXECUTION_RESULT.indexOf(FAILURE_CODE_CONSTANT) > -1) {
					console.log("VM FAILURE_CODE_CONSTANT FOUND IN KVM RESULT: ["+EXECUTION_RESULT.indexOf(FAILURE_CODE_CONSTANT)+"]")
					callback([])
				} else {
					callback(EXECUTION_RESULT)
				}
			}))
		} 
		else if(target == "OnNewBlock") {
			ONB.EXECUTE(bcc, script, (function(EXECUTION_RESULT){
				LOGGER(EXECUTION_RESULT, "OnNewBlock EXECUTION RESULT");
				var EXECUTION_RESULT = JSON.parse(EXECUTION_RESULT)
				if(EXECUTION_RESULT.length > 0){
					console.log("OnNewBlock [EXECUTION_RESULT.length] == "+EXECUTION_RESULT.length)
				}else{
					console.log("OnNewBlock [EXECUTION_RESULT.length] == 0")
					EXECUTION_RESULT.push(["-1"])
					LOGGER(EXECUTION_RESULT, "OnNewBlock [EXECUTION_RESULT] SCRIPT")
				}	
				if (EXECUTION_RESULT.indexOf(FAILURE_CODE_CONSTANT) > -1) {
					console.log("OnNewBlock FAILURE_CODE_CONSTANT FOUND IN KVM RESULT: ["+EXECUTION_RESULT.indexOf(FAILURE_CODE_CONSTANT)+"]")
					callback([])
				} else {
					callback(EXECUTION_RESULT)
				}
			}))
		} 
	}catch(ex){
		console.log("ERROR IN KVM EXECUTION SCRIPT 122: "+ex)
		throw new Error("SCRIPT ERROR: "+ex)
	}
}

var PREPROCESS_CODE = {
	HASHPUBK: "[HASHPUBK]", 
	PUBKHASH: "[PUBKHASH]", 
	CHECKSIG: "[CHECKSIG]", 
	ACCOUNT: "[ACCOUNT]", 
	ACCOUNT_DESTINATION: "[ACCOUNT_DST]",
	ACCOUNT_SOURCE: "[ACCOUNT_SRC]",
	INTEGER: "[INTEGER]", 
	EXTERN_STATE: "[EXTERN_STATE]", 
	PARAMETER: "[PARAMETER]", 
	UNIX_TIME: "[UNIX_TIME]" 
}

var PREPROCESS = async (code, script, ri, id = null, rootName = null) => {
	var separatedCode = code.split(" ")
	var separatedScript = script.split(" ")
	if(separatedCode.length === separatedScript.length){
		console.log("PREPROCESS CODE AND SCRIPT LENGTH [ARE] EQUAL")
		var finalInstructionString = ""
		for(var i = 0; i < separatedCode.length; i++) {
			var code_instruction = separatedCode[i]
			var prev_code_instruction = separatedCode[i - 1]
			var next_code_instruction = separatedCode[i + 1]
			var script_instruction = separatedScript[i]
			var prev_script_instruction = separatedScript[i - 1]
			var next_script_instruction = separatedScript[i + 1]
			LOGGER(code_instruction,"code_instruction, INSDE SCRIPT PREPROCESS")
			LOGGER(script_instruction,"script_instruction, INSDE SCRIPT PREPROCESS")
			switch(code_instruction){
				case PREPROCESS_CODE.HASHPUBK:
					console.log("SWITCH ON CODE_INSTRUCTION: HASHPUBK")
					var substitute = CryptographicUtility.SHA256(script_instruction)
					finalInstructionString = finalInstructionString+" "+substitute
					break
				case PREPROCESS_CODE.PUBKHASH:
					console.log("SWITCH ON CODE_INSTRUCTION: PUBKHASH")
					finalInstructionString = finalInstructionString+" "+script_instruction
					break;
				case PREPROCESS_CODE.CHECKSIG:
					var public_key = separatedScript[i - 1]
					var public_key_b64 = CryptographicUtility.BASE64DECODE(separatedScript[i - 1])
					LOGGER(public_key, "CHECKSIG, public_key")
					LOGGER(public_key_b64, "CHECKSIG, public_key_b64")
					var signature = separatedScript[i - 2]
					console.log("SCRIPT PREPROCESS AWAIT 1")
					LOGGER(signature, "CHECKSIG, signature")
					var RI = JSON.parse(ri)
					LOGGER(RI, "1: SCRIPT PREPROCESS, CHECKSIG, RI")
					LOGGER(RI, "2: SCRIPT PREPROCESS, CHECKSIG, RI")
					const isSignatureValid = await crypto2.verify.sha256('the native web', public_key_b64, signature);
					console.log("SCRIPT PREPROCESS AWAIT 2:isSignatureValid? "+isSignatureValid)
					var substitute = (isSignatureValid) ? 1 : 0
					finalInstructionString = finalInstructionString+" "+substitute
					break;
				case PREPROCESS_CODE.ACCOUNT_DESTINATION:
					break;
				case PREPROCESS_CODE.ACCOUNT_SOURCE:
					break;
				case PREPROCESS_CODE.ACCOUNT:
					var referencedObject = Database.FetchStatefulObject(rootName)[id]
					LOGGER(referencedObject, "PREPROCESS, referencedObject")
					LOGGER(referencedObject, "SWITCH ON CODE_INSTRUCTION: ACCOUNT: "+referencedObject)
					finalInstructionString = finalInstructionString+" "+referencedObject[script_instruction]
					break
				case PREPROCESS_CODE.EXTERN_STATE:
					var referencedObject = Database.FetchStatefulObject(script_instruction)[id]
					LOGGER(referencedObject, "SWITCH ON CODE_INSTRUCTION: EXTERN_STATE: "+next_script_instruction)					
					finalInstructionString = finalInstructionString+" "+referencedObject[next_script_instruction]
					break
				case PREPROCESS_CODE.PARAMETER:
					LOGGER(referencedObject, "[DO NOTHING] SWITCH ON CODE_INSTRUCTION: PARAMETER: "+referencedObject[script_instruction])					
					break
				case PREPROCESS_CODE.ACCOUNT_SUM:
					var referencedObject = Database.FetchStatefulObject(id)
					LOGGER(referencedObject, "SWITCH ON CODE_INSTRUCTION: ACCOUNT_SUM: "+referencedObject[script_instruction])					
					break	
				case PREPROCESS_CODE.INTEGER:
					console.log("SWITCH ON CODE_INSTRUCTION: INTEGER")
					finalInstructionString = finalInstructionString+" "+parseInt(script_instruction)
					break
				case PREPROCESS_CODE.UNIX_TIME:
					console.log("SWITCH ON CODE_INSTRUCTION: UNIX_TIME")
					finalInstructionString = finalInstructionString+" "+parseInt(script_instruction)
					break;
				default:
					console.log("SWITCH ON CODE_INSTRUCTION: NOT A PREPROCESS_CODE add script content")
					finalInstructionString = finalInstructionString+" "+script_instruction
					break
			}
		}
	}else{
		console.log("ERROR: PREPROCESS CODE AND SCRIPT LENGTH ARE [NOT] EQUAL:ABORT!")
		finalInstructionString = script
		throw new Error("PREPROCESS CODE AND SCRIPT LENGTH ARE [NOT] EQUAL:ABORT!")
	}
	console.log("finalInstructionString: "+finalInstructionString)
	return await finalInstructionString
}

module.exports = {
	EXECUTE,
	PREPROCESS,
	FAILURE_CODE_CONSTANT
}