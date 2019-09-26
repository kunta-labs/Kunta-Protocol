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

var Script = require("./Script.js")
var script = "31ded61dd07311e505f857b6c826368ddc83f82e2f0e687f83e7f33fb35122bb6cb38d0ec804b4a98f272642d607a491e05756fc568175390dd6779aecc698bcdd2413c7c00ae7f5634e35f19af46d509cd7c653bbb5c34e97ec98b55b8f6084b42d4d0b6e5aaa484e09d6c7f8947ced4fc042edde59d62343d5ec1f0cbaf6873bfdf4a4c8645f98cf06c3c86bf049f751b725798275c5bdbe8d518ea6375cd57ffef2a2777919b456e46ae433967c3ecb718e133766389161e2d47a7fe457b93f89cc59ce118f577b140bb0e2d68394b519bec6b7e1a2b64028be68a716b2a4f0a8649083b361e4ae43ad4b990082442a4657a643a5af5859bdac81c5939e20 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4 1 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4"
try{
	var BLOCKCHAIN_CONFIGURATION = {
          type: 1,
          options: {},
          consensus: 0,
          genesis_block: {},
          block_creation_time: 60000,
          vm_hash: "6a17d8206ee63cc9548efd2fa75f79e4c7fa1989c24f1da776423b892a5421c5",
          roots: [
            {
              "name": "vote",
              "access": 0,
              "code": "[SIG] [HASHPUBK] [CHECKSIG] [PUBKHASH]",
              "return": "votes",
              "aspects": [
                {
                  "description": "holding the total number of votes at a time",
                  "aspect": "votes",
                  "default_value": 1200
                },
                {
                  "description": "votes can only happen if 1",
                  "aspect": "able_to_vote",
                  "default_value": 1
                }
              ]
            },
            {
              "name": "verdict",
              "access": 0,
              "code": "[EXTERN_STATE] [PARAMETER] OP_ATLEAST_ZERO OP_VERIFY",
              "return": "#BLANK#",
              "aspects": [
                {
                  "description": "refer to extern state, grab v, sum",
                  "aspect": "end_date",
                  "default_value": 1826387363
                }
              ]
            }
          ],
          chainscript: {
              functions: [
                  {"Create": {
                    "hash": "74e236ee07ca952268b24b1e39f1d8c1e9406e5c21461a243740c1002a2f21b3",
                    "body": {
                        "code": "OP_FUNCCALL [FUNC_NAME] [PARAM] OP_RETURN [VALUE]",
                        "script": "OP_FUNCCALL log \"created...\" OP_RETURN True"
                    },
                    "return": {
                        "code": "[ACCOUNT]",
                        "script": "votes"
                    }
                  }},
                  {"testFunc": {
                    "hash": "74e236ee07ca952268b24b1e39f1d8c1e9406e5c21461a243740c1002a2f21b3",
                    "body": {
                        "code": "Nonce answer = b.nonce; return answer;",
                        "script": "Nonce answer = b.nonce; return answer;"
                    },
                    "return": {
                        "code": "[ACCOUNT]",
                        "script": "votes"
                    }
                  }},
                  {"OnNewBlock": {
                    "hash": "74e236ee07ca952268b24b1e39f1d8c1e9406e5c21461a243740c1002a2f21b3",
                    "body": {
                        "code": "ONB_Param1 ONB_Param2",
                        "script": "ONB_Param1 ONB_Param2"
                    },
                    "return": {
                        "code": "",
                        "script": ""
                    }
                  }}
              ]
          }
        }
	for(var i = 0; i < 1000; i++){
		console.log("running: "+i)
		Script.EXECUTE(BLOCKCHAIN_CONFIGURATION,
					   "VM",
					   script, 
					   function(EXECUTION_RESULT){
			console.log("SCRIPTTEST")
			console.log(EXECUTION_RESULT)
		})
}

}catch(e){
	console.log("ERROR")
	throw new Error("Error: [VerifyFemaleRootInstance]: "+e)
}
