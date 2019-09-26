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
var fs = require('fs')
const crypto2 = require('crypto2');
var CryptographicUtility = require('./Crypto.js')
const KLOC = "storage/KEYS/"
const PRIVATEKEY = "PRIVATE.kk"
const PUBLICKEY = "PUBLIC.kk"
var readPrivateKey = fs.readFileSync(KLOC+PRIVATEKEY).toString()
var readPublicKey = fs.readFileSync(KLOC+PUBLICKEY).toString()
var private_key = readPrivateKey
var public_key = readPublicKey

var test = async (cb) => {
	//const { privateKey, publicKey } = await crypto2.createKeyPair();
	console.log("1")
	const privateKey = await crypto2.readPrivateKey(KLOC+PRIVATEKEY);
	console.log("2")
	const publicKey = await crypto2.readPublicKey(KLOC+PUBLICKEY);
	const encodedPK = CryptographicUtility.BASE64ENCODE(publicKey)
	const publicKeyHash = await crypto2.hash.sha256(encodedPK);
	cb({
		private: privateKey,
		public: publicKey,
		publicKH: publicKeyHash,
		publicEncode: encodedPK
	})
}


test(async function(obj){
	console.log(obj)
	console.log("3")
	console.log("/////////////////////////////")
	var SIGNEDCONTENT = 'the native web'
	const signature1 = await crypto2.sign.sha256(SIGNEDCONTENT, obj.private);
	console.log("sig 1: "+signature1)
	const isSignatureValid1 = await crypto2.verify.sha256(SIGNEDCONTENT, obj.public, signature1);
	console.log("sig 1 true: "+isSignatureValid1)
	console.log("/////////////////////////////")
	testWASM1 = fs.readFileSync("<ROOT>/rs/OnCreate/target/wasm32-unknown-unknown/release/OnCreate.wasm").toString()
	const hash1 = await crypto2.hash.sha256(testWASM1);
	console.log("wasm1: "+hash1)
	testWASM2 = fs.readFileSync("<ROOT>/rs/OnNewBlock/target/wasm32-unknown-unknown/release/on_new_block.wasm").toString()
	const hash2 = await crypto2.hash.sha256(testWASM2);
	console.log("wasm2: "+hash2)
	testWASM3 = fs.readFileSync("<ROOT>/rs/VirtualMachine/target/wasm32-unknown-unknown/release/virtual_machine.wasm").toString()
	const hash3 = await crypto2.hash.sha256(testWASM3);
	console.log("wasm3: "+hash3)
})


