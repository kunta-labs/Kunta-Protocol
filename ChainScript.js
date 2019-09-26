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

var OnNewBlockFunction = require('./NativeFunctions/OnNewBlock.js')
var OnCreateFunction = require('./NativeFunctions/OnCreate.js')

class ChainScript {

	constructor(callback){
		console.log("ChainScript Constructor Initiated")
	}

	InvokeNativeFunction(BCC, NativeFunction, NewBlock = null, callback){
		var BuiltInFunction = {
			OnCreate: (function(bcc, b, cb){
				var OC = new OnCreateFunction.OnCreate()
				OC.Invoke(bcc, b, function(res){
					cb(res)
				})
				//callback(OC.Invoke(bcc, b))
			}),
			OnNewBlock: (function(bcc, b, cb){
				var ONB = new OnNewBlockFunction.OnNewBlock()
				ONB.Invoke(bcc, b, function(res){
					cb(res)
				})
				//callback(OC.Invoke(bcc, b))
			})
		}

		if(NativeFunction == "OnCreate"){
			BuiltInFunction.OnCreate(BCC, NewBlock, function(res){
				callback(res)
			})
		}else if(NativeFunction == "OnNewBlock"){
			BuiltInFunction.OnNewBlock(BCC, NewBlock, function(res){
				callback(res)
			})
		}
	}

	I(ChainScriptObject){}
	E(ChainScriptObject){}
}
module.exports = {
	ChainScript
}
