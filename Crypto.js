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

var CryptoJS = require("crypto-js");
const crypto2 = require('crypto2');
var LOGGER = require('./Logger.js')
var CRYTPOJSSHA256 = require("crypto-js/sha256");
var fs = require('fs')
const KLOC = "core/storage/KEYS/"
const PRIVATEKEY = "PRIVATE.kk"
const PUBLICKEY = "PUBLIC.kk"
var saveKeys = (privateKey, publicKey) => {
    try{
        fs.writeFileSync(KLOC+PRIVATEKEY, privateKey, 'utf-8')
        fs.writeFileSync(KLOC+PUBLICKEY, publicKey, 'utf-8')
    }catch(e){
        console.log("saveKeys error")
    }
}
var CRYPTOOBJ;
var privkeypem;
var pubkeypem;
var SOLVED_BY_ANOTHER = false

var MineAttempt = (index, previousHash, timestamp, data, rootInstances, nonce) => {
    var contentForHash = (index + previousHash + timestamp + data + rootInstances + nonce)    
    var SHA256HashofBlock = SHA256(contentForHash)
    return SHA256HashofBlock;
};

var CalculateHash = (index, previousHash, timestamp, data, rootInstances, nonce) => {
    var contentForHash = (index + previousHash + timestamp + data + rootInstances + nonce)
    var SHA256HashofBlock = SHA256(contentForHash)
    LOGGER("Result from 'SHA256' hash: "+SHA256HashofBlock, "SHA256")
    return SHA256HashofBlock;
};

var CalculateHashForBlock = (block) => {
    LOGGER(JSON.stringify(block), "CALCULATEHASHFORBLOCK")
    console.log("CALCULATEHASHFORBLOCK:")
    console.log(block)
    var RIOBJS = []
    block.body.rootInstances.forEach(ri => {
        console.log("block.body.rootInstances.forEach")
        console.log(ri)
        try{
            RIOBJS.push(JSON.parse(ri))
        }catch(e){
            RIOBJS.push(ri)
        }
    })
    console.log("RIOBJS")
	console.log(block.body.rootInstances)
	console.log(RIOBJS)
	console.log(JSON.stringify(RIOBJS))
    var hashResult = CalculateHash(block.header.blockIndex, 
                                   block.header.previousHash,
                                   block.header.timestamp, 
                                   JSON.stringify(block.body.data), 
                                   JSON.stringify(RIOBJS),
                                   block.header.nonce)
    return hashResult;
};

var HASHDATA = (content) => {
	return SHA256(content)
}

var SHA256 = (content) => {
	return CRYTPOJSSHA256(content).toString()
}

var BASE64ENCODE = (content) => {
	return Buffer.from(content).toString('base64')
}

var BASE64DECODE = (content) => {
	return Buffer.from(content, 'base64').toString('ascii')
}

class Crypto{
    constructor() { 
        this.publicKeyPem = pubkeypem;
        this.privateKeyPem = privkeypem;
        this.privkey = "PRIVKEY"
        this.pubkey = "PUBKEY"
        this.pubkeyHash = SHA256(this.pubkey)
        this.digitalSignature = CryptoJS.SHA256(this.publicKey+this.privateKey).toString();
    }

}

CRYPTOOBJ = new Crypto()

var getKeys = async (cb) => {
    try{
        console.log("inside getkeys")
        //var readPrivateKey = fs.readFileSync(KLOC+PRIVATEKEY).toString()
        //var readPublicKey = fs.readFileSync(KLOC+PUBLICKEY).toString()

        ///////////TODO: IF KEYS EXIST:
        const privateKey = await crypto2.readPrivateKey(KLOC+PRIVATEKEY);
        const publicKey = await crypto2.readPublicKey(KLOC+PUBLICKEY);

        //TODO: if not
        //const { privateKey, publicKey } = await crypto2.createKeyPair();
        //saveKeys(privateKey, publicKey)

        cb({
            private: privateKey,
            public: publicKey
        })
    }catch(err){
        ///keys prob don't exist, CREATE THEM
        console.log("keys error: "+err)

        var privateKey = "PRIVATEKEYPEM"//key.toPrivatePem().toString('ascii');
        var publicKey = "PUBKEYPEM"//key.toPublicPem().toString('ascii');
        
        //saveKeys(privateKey, publicKey)

        /////////////TODO: if not
        //const { privateKey, publicKey } = await crypto2.createKeyPair();
        //saveKeys(privateKey, publicKey)
        
        cb({
            private: privateKey,
            public: publicKey
        })        
    }
}

//TODO: ONLY CALL GETKEYS WHEN ON START
getKeys(async function(keysObj){
    LOGGER(keysObj, "keysObj")
    privkeypem = keysObj.private;
    pubkeypem = keysObj.public;
    console.log(keysObj)
    console.log("3")

    /////////////////////// SIGN EXAMPLE
    // const signature = await crypto2.sign.sha256('the native web', 
    //                                             keysObj.private);
    // LOGGER(signature, "getKeys:signature")

    // const isSignatureValid = await crypto2.verify.sha256('the native web', 
    //                                                      keysObj.public, 
    //                                                      signature);
    
    // LOGGER(isSignatureValid, "isSignatureValid")

    // LOGGER(BASE64ENCODE(privkeypem), "BASE64ENCODE(privkeypem)")
    // LOGGER(BASE64ENCODE(pubkeypem), "BASE64ENCODE(pubkeypem)")

}).catch(err => {
    console.log(err)
})

var getSolvedByAnother = () => {
    return SOLVED_BY_ANOTHER
}

var setSolvedByAnother = (sba) => {
    SOLVED_BY_ANOTHER = sba
}

module.exports = {
	Crypto,
	MineAttempt,
	CalculateHashForBlock,
	CalculateHash,
	CRYPTOOBJ,
	CryptoJS,
	SHA256,
	BASE64ENCODE,
	BASE64DECODE,
	HASHDATA,
	SOLVED_BY_ANOTHER,
    getSolvedByAnother,
    setSolvedByAnother
}
