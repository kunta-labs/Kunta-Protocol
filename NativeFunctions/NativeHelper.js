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
var Script = require('../Script/Script.js')
const FAILURE_CODE_CONSTANT = Script.FAILURE_CODE_CONSTANT//"<<$FAILURE$>>"
class NativeHelper{
	constructor(){

	}

	FetchCodeToExecute(bcc, b, target, label, callback){
		var functions = bcc.chainscript.functions
		functions.forEach((k, v) => {
			console.log("native functions forEach")
			var keyForObj = Object.keys(k)[0]
			console.log(keyForObj)
			console.log(k[keyForObj].body.code)
			if(keyForObj == target){
				LOGGER(k,label+" IS INVOKED")
				this.PassToVM(
					bcc,
					k[keyForObj].body.code,
					k[keyForObj].body.script,
					target, 
					function(script_result){
						callback(script_result)
					})
			}else{
				console.log("NOT "+label+", SKIPPING TO NEXT K")
			}
		})
	}

	PassToVM(bcc, script, instructions, target, callback){
		console.log("cb1")
		console.log(callback)
		try{
			console.log(callback)	
			var processedScript = Script.PREPROCESS(
										script, 
										instructions, 
										null,
										"0GENESIS_vote",
										"vote")
			LOGGER( processedScript, "["+target+" Before PassToVM]")
			Script.EXECUTE(bcc, target, processedScript, function(script_result){
				LOGGER( script_result, "["+target+" After PassToVM]")
				var foundFailureCode = false
				script_result.forEach( (v, i) => {
	        		if(v[i] == Script.FAILURE_CODE_CONSTANT){
	        			foundFailureCode = true
	        		}
	        	})
				if (script_result.indexOf(FAILURE_CODE_CONSTANT) > -1 || foundFailureCode) {
				    throw new Error("FAILURE_CODE_CONSTANT FOUND IN KVM RESULT: ["+script_result.indexOf(FAILURE_CODE_CONSTANT)+"]")
				}else{
					
				}
				var returnKeys = Object.keys(script_result)
			    var numOfReturnKeys = returnKeys.length
	        	if(!foundFailureCode){
	    			LOGGER(script_result, "PASSTOVM NATIVEHELPER:"+target)
	    			callback(script_result)
	    		}else{
	    			callback(script_result)
	    		}
			})
		}catch(e){
			throw new Error("Error: ["+target+" PassToVM]: "+e)
		}
	}
}

module.exports = {
	NativeHelper
}