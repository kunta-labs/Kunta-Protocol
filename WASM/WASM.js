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

var fs = require("fs")
const fetch = require('node-fetch');
var URL = require('url').URL;
var hash_sha256 = require('../Crypto.js').SHA256
var LOGGER = require('../Logger.js')
var types = {
  "VirtualMachine": "virtual_machine",
  "OnNewBlock": "on_new_block"
}
const FAILURE_CODE_CONSTANT = "<<$FAILURE$>>"
const { TextEncoder } = require('text-encoding');

const memoryManager = (memory) => {
  var base = 0;
  base += 4;
  return {
    encodeString: (jsString) => {      
      var base = 0;
      base += 4;
      console.log("base")
      console.log(base)
      console.log("\n\n")
      const encoder = new TextEncoder();
      const encodedString = encoder.encode(jsString);
      console.log("encodedString")
      console.log(encodedString)
      console.log("\n\n")
      const asU32 = new Uint32Array(memory.buffer, base, 2);
      console.log("asU32")
      console.log(asU32)
      console.log("\n")
      const asBytes = new Uint8Array(memory.buffer, 
                                     asU32.byteOffset + asU32.byteLength, 
                                     encodedString.length);
      console.log("asBytes")
      console.log(asBytes)
      console.log("\n")
      asBytes.set(encodedString);
      console.log("asBytes 2")
      console.log(asBytes)
      console.log("\n")
      asU32[0] = asBytes.byteOffset;
      console.log("asU32")
      console.log(asU32)
      console.log("\n")
      asU32[1] = asBytes.length;
      console.log("asU32 2")
      console.log(asU32)
      console.log("\n")
      // Update our memory allocator base address for the next call
      const originalBase = base;
      console.log("originalBase")
      console.log(originalBase)
      console.log("\n")
      base += asBytes.byteOffset + asBytes.byteLength;
      console.log("base 2")
      console.log(base)
      console.log("\n")
      return originalBase;
    }
  };
};

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); 
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function Invoke_WASM(bcc, type, SCRIPT, callback){
  var memory = new WebAssembly.Memory({ initial: 20, 
                                        maximum: 21 });
  const importObject = {
    env: { memory }
  };
  const myMemory = memoryManager(memory);
  var expectedHash = ""; 
  LOGGER(expectedHash, "WASM: EXPECTED HASH 1: "+type)
  if(type == "VirtualMachine"){
    expectedHash = bcc.vm_hash;
  }else{
    bcc.chainscript.functions.forEach((k, v) => {
        console.log("native functions forEach")
        var keyForObj = Object.keys(k)[0]
        if(keyForObj == type){
          expectedHash = k[keyForObj].hash
        }
    })
  }
  LOGGER(expectedHash, "WASM: EXPECTED HASH 2: "+type)
  var root = "./core"
  var wasm_loc = root+'/rs/'+type+'/target/wasm32-unknown-unknown/release/'+types[type]+'.wasm';
  var buf = fs.readFileSync(wasm_loc);
  var buf_b64 = buf.toString('base64')
  var module_hash = hash_sha256(buf_b64)
  console.log("hash buf ["+type+"] - "+module_hash)
  LOGGER( {
      "type": type,
      "expectedHash": expectedHash,
      "module_hash": module_hash
    }, "Before WASM SECURITY CHECKS" )
  if(module_hash != expectedHash){
    console.log(FAILURE_CODE_CONSTANT)
    var e_msg = "[ERROR] WASM ERROR ["+type+"] EXPECTED HASH != TO MODULE HASH, FAILING GRACEFULLY"
    console.log(e_msg)
    var error_return = "[\""+FAILURE_CODE_CONSTANT+"\"]"
    console.log(error_return)
    //callback(error_return)
    throw new Error(e_msg)
  } 
  else if (expectedHash == ""){
    console.log(FAILURE_CODE_CONSTANT)
    var e_msg = "[ERROR] WASM ERROR ["+type+"] EXPECTED HASH IS NOT PRESENT IN BCC, FAILING GRACEFULLY"
    console.log(e_msg)
    var error_return = "[\""+FAILURE_CODE_CONSTANT+"\"]"
    console.log(error_return)
    throw new Error(e_msg)
  } 
  else{
    LOGGER( {
      "type": type,
      "expectedHash": expectedHash,
      "module_hash": module_hash
    }, "WASM MODULE SECURITY CHECKS COMPLETE" )
  }
  console.log("validate: "+WebAssembly.validate( new Uint8Array(buf) ))
  const config = {
      __wbindgen_placeholder__: {
          DYNAMICTOP_PTR: 0,
          STACKTOP: 0,
          STACK_MAX: 0,
          abort: function() {},
          enlargeMemory: function() {},
          getTotalMemory: function() {},
          abortOnCannotGrowMemory: function() {},
          ___lock: function() {},
          ___syscall6: function() {},
          ___setErrNo: function() {},
          ___syscall140: function() {},
          _emscripten_memcpy_big: function() {},
          ___syscall54: function() {},
          ___unlock: function() {},
          ___syscall146: function() {},
          __wbindgen_placeholder__: function() {},
          //memory: new WebAssembly.Memory({initial: 256, maximum: 32767}),
          table: new WebAssembly.Table({initial: 6, element: 'anyfunc', maximum: 6}),
          memoryBase: 0,
          tableBase: 0,
          __wbindgen_describe: console.log,
      },
      env: {memory}
    }
  var c = WebAssembly.compile( new Uint8Array(buf) )
  console.log("=============================")
  c
  .then(bytes => {
    var bytes_hash = hash_sha256(bytes)
    console.log("hash bytes ["+type+"] - "+bytes_hash)
    console.log("bytes:")
    console.log(bytes)
    //return WebAssembly.instantiate( bytes , config )
    return WebAssembly.instantiate( bytes , importObject )
  })
  .then((instance) => {
    console.log('[Finished compiling WASM VM]: '+type);
    console.log(instance.exports)
    console.log('\n');
    const linearMemory = instance.exports.memory;
    try {
      console.log("[memory]")
      console.log(memory)
      console.log(memory.buffer)
      console.log(typeof(memory))
      console.log(Object.keys(memory))
      const testStr = "TEST1 TEST 4 5"
      const argString = str2ab(testStr)
      console.log("byteLength: "+argString.byteLength)
      console.log("argString")
      console.log(argString)
      const input = myMemory.encodeString(SCRIPT);
      console.log("input")
      console.log(input)
      const execution_result = instance.exports.execute(input);
      console.log("["+type+"]execution_result: "+execution_result+"\n")
      console.log("FINISHED WASM: "+type)
      var success_return = "[\""+execution_result+"\"]"
      callback(success_return)
    }catch(e){
      console.log(FAILURE_CODE_CONSTANT)
      console.log("[ERROR] WASM EXECUTION ERROR, FAILING GRACEFULLY: "+e)
      var error_return = "[\""+FAILURE_CODE_CONSTANT+"\"]"
      console.log(error_return)
      callback(error_return)
    }
  });
}

var HASH_ALL_USED_WASM = () => {
  //var hashed_wasm = CryptographicUtility.SHA256(all_wasm)
  //return hashed_wasm
}

module.exports = {
  Invoke_WASM,
  HASH_ALL_USED_WASM
}