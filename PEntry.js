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

'use strict';

var url = require('url');
var http = require('http');
var merkle = require("merkle")
var express = require("express");
var bodyParser = require('body-parser');
var http_port = process.env.HTTP_PORT || 3001;
var LOGGER = require('./Logger.js')
var BlockProperties = require('./BlockProperties.js')
var Protocol = require('./Protocol.js')
var Actor = require('./Actor.js')
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
var VERSION_NUMBER = Protocol.VERSION_NUMBER
const ACCESS_TYPE = Protocol.ACCESS_TYPE
const CONSENSUS_TYPE = Protocol.CONSENSUS_TYPE
const ROOT_TYPE = Protocol.ROOT_TYPE
const BLOCKCHAIN_COMMUNICATION_TYPE = Protocol.BLOCKCHAIN_COMMUNICATION_TYPE
const BLOCKCHAIN_TYPE = Protocol.BLOCKCHAIN_TYPE
const CHOICE_TYPE = Protocol.CHOICE_TYPE
var calculateHashForBlock = Protocol.CalculateHashForBlock
var calculateHash = Protocol.CalculateHashForBlock
var generateGenesisBlock = Protocol.GenerateGenesisBlock
var cryptoObj = Protocol.CryptoObj
var getLastRootInstanceIndex = Protocol.GetLastRootInstanceIndex
var generateNextBlock = Protocol.GenerateNextBlock
var initHttpServer = () => {
    var app = express();
    app.use(bodyParser.json());
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();

    });
    app.post('/getBlocksExplorer', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        LOGGER(req.data,"QUERIED BY PEER", true)
        res.send(JSON.stringify(Protocol.GetBlockchain()))
        res.end()
    });
    app.post('/verifyChain', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        LOGGER(req.data,"Asking to Verify Chain", true)
        var shouldFurtherChain = true; 
        try{
            Protocol.VerifyAllBlocks(Protocol.GetLatestBlock().header.blockIndex)
            res.send({
                verified: true
            })
        }catch(e){
            console.log("ERROR IN VERIFY ALL BLOCKS verifyChain api")
            console.log(e)
            res.send({
                verified: false
            })
        }
        res.end()
    });
    app.post('/getBlocks', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        LOGGER(req.body.data,"QUERIED BY PEER", true)  
        var Blockchain = Protocol.GetBlockchainWithWindow(100)
        res.send(JSON.stringify(Blockchain))    
        res.end()
    });
    app.post('/getUnprocessedTransactions', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");        
        LOGGER(req.body.data,"QUERIED FOR UNPROCESSED TRANSACTIONS FROM PEER, GIVING", true)
        var parsedRootInstancesForWrite = []
        Protocol.GetUnprocessedRoots().forEach((rootInstanceToParse) => {
            parsedRootInstancesForWrite.push(JSON.parse(rootInstanceToParse))
        })
        res.send(parsedRootInstancesForWrite)
        res.end()
    });
    app.post('/getBCTransactions', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");        
        LOGGER(req.body.data,"QUERIED FOR BC TRANSACTIONS FROM PEER, GIVING", true)
        var parsedBCRootsForWrite = []
        var rootInstancesByBlock = Protocol.GetAllRootInstancesInChain()
        for(var blockIndex = 0; blockIndex < rootInstancesByBlock.length; blockIndex++ ){
            var blockIndexKey = "block_"+blockIndex 
            console.log(blockIndexKey)
            var blockObjHolder = {};
            blockObjHolder[blockIndexKey] = rootInstancesByBlock[blockIndex];
            parsedBCRootsForWrite.push(blockObjHolder)
        }
        res.send(parsedBCRootsForWrite)
        res.end()
    });
    app.post('/addTransaction', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); 
        res.send(AddNewRootInstance(req))
        res.end()
    });
    app.post('/addTransactions', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");     
        console.log("addTransactions: req.body")
        console.log(typeof(req.body))
        console.log(req.body)
        req.body.forEach(ri => {
            console.log("addTransactions: req.body.forEach")
            console.log(ri)
            console.log( typeof(ri) )
            ri = JSON.parse(ri)
            console.log(ri.type)
            console.log(ri)
            console.log(ri.type)
            AddNewRootInstanceBatch(ri)  
        })
        res.send(req.body)
        res.end()
    });
    app.post('/findRootInstance', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); 
        var rootInstanceToFind = req.body
        console.log(rootInstanceToFind)
        console.log(rootInstanceToFind.hash)
        Protocol.FindRI(rootInstanceToFind.hash, function(result){
            res.send(result)
        })
        res.end()
    });
    app.post('/verifyTransaction', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        LOGGER(cryptoObj.publicKeyPem, "publicKeyPem")
        LOGGER(cryptoObj.privateKeyPem, "privateKeyPem")
        LOGGER(cryptoObj.pubkey, "pubkey")
        LOGGER(cryptoObj.privkey, "privkey")
        LOGGER(cryptoObj.digitalSignature, "digitalSignature", true)
        LOGGER(cryptoObj.pubkeyHash, "digitalSignature", true)
        console.log("////load txs for block requested")
        var url_parts = url.parse(req.url, true);
        LOGGER(url_parts,"URL PARTS", true)
        var query = url_parts.query;
        var blockIndex = query.b;
        var txPool = Protocol.GetBlockchain()[blockIndex].data.Transactions
        LOGGER(txPool,"TXPOOL",true)
        var txToFind = "--HERES A NEW TRANSACTION--"
        var txExistsInBlock = (txPool.indexOf(txToFind) > -1);
        LOGGER(txExistsInBlock,"search txs for specific hash",true)
        if (txExistsInBlock){
        
        }else{ 
        
        }
        console.log("////if found tx, return details")    
        console.log("calculate merkle tree")
        var txTree = merkle('sha256').sync(txPool);
        LOGGER(txTree.root(), "txTreeRoot", true)
        LOGGER(req.body.data, "Verify Transaction from PEER: "+Protocol.GetBlockchain()[Protocol.GetBlockchain().length - 1]
        .data
        .Transactions, true)
        res.end()
    })
    app.get('/fetchData', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        LOGGER(req.body.data,"DATA FETCHED BY PEER", true)
        var Blockchain = Protocol.GetBlockchain()
        LOGGER(Blockchain,"fetchData, returned data from GetBlockchain")
        res.send(JSON.stringify(Blockchain))
        res.end()
    });
    app.post('/addPeer', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        var peer = req.body
        console.log(peer)
        console.log(peer.newPeer)
        Actor.ConnectToPeers([peer.newPeer]);
        res.send(Protocol.Sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
        res.end()
    });
    app.post('/peers', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.send(Protocol.Sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
        res.end()
    });
    app.post('/GetChainHash', (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.send(Protocol.CurrentChainHash());
        res.end()
    });
    try {
        app.listen(http_port, () => console.log('Listening http on port for peers: ' + http_port));
    }catch(e){
        console.log("error setting up http port, might be already used...")
    }
};

var addBlock = Protocol.AddBlock
var isValidNewBlock = Protocol.IsValidNewBlock
var isValidChain = Protocol.IsValidChain
var getLatestBlock = Protocol.GetLatestBlock
function BlockDecision(callback){
    try{
            Protocol.GenerateNextBlock((function(newBlock){
                console.log("/mineNewBlock")
                console.log(newBlock)
                addBlock(newBlock);
                try{
                }catch(e){
                    console.log("error  PENTRY BlockDecision: "+e)
                }
                Protocol.BroadcastAll( Protocol.ResponseLatestMsg() );
                callback(JSON.stringify({
                                          "message" : "success"
                                        }))
            }), (function(e){
                LOGGER(e, "error in mineNewBlock")
            }))
    }catch(e){
        console.log("[FAILED] ERROR IN BlockDecision: "+e)
    }
}

function AddNewRootInstance(req){
    var incomingRootInstance = req.body
    LOGGER(incomingRootInstance, "AddNewRootInstance: RECEIVED TRANSACTIONS FROM invokation, ADDING", true)
    var riTime = new Date().getTime() 
    var referencedRoot = Protocol.RootToReference(incomingRootInstance.type)
    var rootInstance = null
    if(referencedRoot != undefined){
        if(referencedRoot.access == ACCESS_TYPE.PRIVATE){
            switch (incomingRootInstance.class) {
                case "female":
                    var rootToEncrypt = {
                                  "type": incomingRootInstance.type, 
                                  "class": incomingRootInstance.class, 
                                  "script": incomingRootInstance.script, 
                                  "destination": incomingRootInstance.destination,
                                  "source": incomingRootInstance.source, 
                                  "timestamp": riTime,
                    }
                    var encryptedMessage = cryptoObj.privkey.encrypt(incomingRootInstance.message, 'utf8', 'base64');
                    rootToEncrypt["message"] = encryptedMessage
                    rootInstance = rootToEncrypt//JSON.stringify(rootToEncrypt)
                    break;
                case "male":
                    var rootToEncrypt = {
                                  "type": incomingRootInstance.type,
                                  "class": incomingRootInstance.class,
                                  "script": incomingRootInstance.script,
                                  "destination": incomingRootInstance.destination, 
                                  "source": incomingRootInstance.source, 
                                  "timestamp": riTime,
                                  "partner": incomingRootInstance.partner
                    }
                    var encryptedMessage = cryptoObj.privkey.encrypt(incomingRootInstance.message, 'utf8', 'base64');
                    rootToEncrypt["message"] = encryptedMessage
                    rootInstance = rootToEncrypt
                    break;
            }
        }else if (referencedRoot.access == ACCESS_TYPE.PUBLIC){
            console.log("incomingRootInstance.class: "+incomingRootInstance.class)
            switch (incomingRootInstance.class) {
                case "female":
                    var rootToProcess = {
                                      "type": incomingRootInstance.type,
                                      "class": incomingRootInstance.class,
                                      "script": incomingRootInstance.script,
                                      "destination": incomingRootInstance.destination,
                                      "source": incomingRootInstance.source,
                                      "timestamp": riTime,
                    }
                    rootToProcess["message"] = incomingRootInstance.message
                    rootInstance = rootToProcess
                    console.log("INSIDE FEMALE")
                    console.log(rootInstance)
                    break;
                case "male":
                    var rootToProcess = {
                                      "type": incomingRootInstance.type,
                                      "class": incomingRootInstance.class,
                                      "script": incomingRootInstance.script,
                                      "destination": incomingRootInstance.destination,
                                      "source": incomingRootInstance.source,
                                      "timestamp": riTime,
                                      "partner": incomingRootInstance.partner
                    }
                    rootToProcess["message"] = incomingRootInstance.message
                    rootInstance = rootToProcess
                    break;
            }
        }
        LOGGER(rootInstance, "rootInstance after SWITCH(Private/public)")
        var listOfUnprocessedRIs = Protocol.GetUnprocessedRoots()
        console.log("listOfUnprocessedRIs:")
        console.log(listOfUnprocessedRIs)
        if( !(listOfUnprocessedRIs.indexOf(rootInstance) > -1) ){
            LOGGER(cryptoObj.pubkeyHash, "digitalSignature", true)
            Protocol.AddToUnprocessedRoots( rootInstance ) 
            LOGGER(Protocol.GetUnprocessedRoots(), "ADDED TX TO NEWTX TO BE MINED", true)      
        } else {
            LOGGER(rootInstance, "TX ALREADY EXISTED", true)
        }
        var parsedRootsForWrite = []
        Protocol.GetUnprocessedRoots().forEach((rootInstanceToParse) => {
            parsedRootsForWrite.push(rootInstanceToParse)
        })
        return parsedRootsForWrite
    }else{
        LOGGER("EXCEPTION: rootToReference many not be defined","add transaction error")
        return false
    }
}

function AddNewRootInstanceBatch(ri){
    var incomingRootInstance = ri
    LOGGER(incomingRootInstance, "AddNewRootInstanceBatch: RECEIVED TRANSACTIONS FROM invokation, ADDING", true)
    var riTime = new Date().getTime() 
    var referencedRoot = Protocol.RootToReference(incomingRootInstance.type)
    var rootInstance = null
    if(referencedRoot != undefined){
        if(referencedRoot.access == ACCESS_TYPE.PRIVATE){
            switch (incomingRootInstance.class) {
                case "female":
                    var rootToEncrypt = {
                      "type": incomingRootInstance.type, 
                      "class": incomingRootInstance.class, 
                      "script": incomingRootInstance.script, 
                      "destination": incomingRootInstance.destination, 
                      "source": incomingRootInstance.source, 
                      "timestamp": riTime,
                    }
                    var encryptedMessage = cryptoObj.privkey.encrypt(incomingRootInstance.message, 'utf8', 'base64');
                    rootToEncrypt["message"] = encryptedMessage
                    rootInstance = rootToEncrypt
                    break;
                case "male": 
                    var rootToEncrypt = {
                      "type": incomingRootInstance.type,
                      "class": incomingRootInstance.class,
                      "script": incomingRootInstance.script,
                      "destination": incomingRootInstance.destination, 
                      "source": incomingRootInstance.source, 
                      "timestamp": riTime,
                      "partner": incomingRootInstance.partner
                    }
                    var encryptedMessage = cryptoObj.privkey.encrypt(incomingRootInstance.message, 'utf8', 'base64');
                    rootToEncrypt["message"] = encryptedMessage
                    rootInstance = rootToEncrypt
                    break;
            }
        }else if (referencedRoot.access == ACCESS_TYPE.PUBLIC){
            console.log("incomingRootInstance.class: "+incomingRootInstance.class)
            switch (incomingRootInstance.class) {
                case "female":
                    var rootToProcess = {
                      "type": incomingRootInstance.type,
                      "class": incomingRootInstance.class,
                      "script": incomingRootInstance.script,
                      "destination": incomingRootInstance.destination,
                      "source": incomingRootInstance.source,
                      "timestamp": riTime,
                    }
                    rootToProcess["message"] = incomingRootInstance.message
                    rootInstance = rootToProcess
                    console.log("INSIDE FEMALE")
                    console.log(rootInstance)
                    break;
                case "male":
                    var rootToProcess = {
                      "type": incomingRootInstance.type,
                      "class": incomingRootInstance.class,
                      "script": incomingRootInstance.script,
                      "destination": incomingRootInstance.destination,
                      "source": incomingRootInstance.source,
                      "timestamp": riTime,
                      "partner": incomingRootInstance.partner
                    }
                    rootToProcess["message"] = incomingRootInstance.message
                    rootInstance = rootToProcess//JSON.stringify(rootToProcess)
                    break;
            }
        }
        LOGGER(rootInstance, "rootInstance after SWITCH(Private/public)")
        var listOfUnprocessedRIs = Protocol.GetUnprocessedRoots()
        console.log("listOfUnprocessedRIs:")
        console.log(listOfUnprocessedRIs)
        if( !(listOfUnprocessedRIs.indexOf(rootInstance) > -1) ){
            if(listOfUnprocessedRIs.length < 200){
                LOGGER(cryptoObj.pubkeyHash, "digitalSignature", true)
                Protocol.AddToUnprocessedRoots( JSON.stringify(rootInstance) ) 
                LOGGER(Protocol.GetUnprocessedRoots(), "ADDED TX TO NEWTX TO BE MINED", true)      
            }else{
                console.log("Too Many TX in memory, didn't add")
            }
        } else {
            LOGGER(rootInstance, "TX ALREADY EXISTED", true)
        }
        Protocol.BroadcastAll(Protocol.ResponseAllTXsMsg())
        var parsedRootsForWrite = []
        Protocol.GetUnprocessedRoots().forEach((rootInstanceToParse) => {
            parsedRootsForWrite.push(rootInstanceToParse)
        })
        return parsedRootsForWrite
    }else{
        LOGGER("EXCEPTION: rootToReference many not be defined","add transaction error")
        return false
    }
}

function getBCConfig(bcc, callback){
    if(bcc == null){
        const BLOCKCHAIN_IDENTIFIER  = "aSDSASAF"
        var KAPI_OPTIONS = {
          host: 'www.kunta.io',
          path: '/api/?E=GetBlockchainConfigurationByHash&h='+BLOCKCHAIN_IDENTIFIER
        };
        var KAPI_CALLBACK = function(response) {
          var str = '';
          response.on('data', function (chunk) {
            str += chunk;
          });
          response.on('end', function () {
                console.log("str: "+str)
                LOGGER(str, "inside 'end' in KAPI_CALLBACK");
                callback(JSON.parse(str))
          });
          response.on('error', function (e) {
                console.log(`Got error: ${e.message}`);
          });
        }
        http.request(KAPI_OPTIONS, KAPI_CALLBACK).end()
    }else{
        callback(bcc)
    }
}

const BLOCK_CREATION_TIMEOUT = 20000
var cease_protocol = false;
var isSyncing = false;
function callBlockDecision(BlockDecisionInterval){
    var isProtocolSyncing = Protocol.getIsSyncing()
    console.log("callBlockDecision: isSyncing: "+isProtocolSyncing)
    var BLOCK_CREATION_TIMEOUT = BlockDecisionInterval
    if(!isProtocolSyncing){
        var shouldFurtherChain = true; 
        try{
            Protocol.VerifyAllBlocks(Protocol.GetLatestBlock().header.blockIndex)
        }catch(e){
            console.log("ERROR IN VERIFY ALL BLOCKS PENTRY")
            console.log(e)
            shouldFurtherChain = false
        }
        if(shouldFurtherChain){
            BlockDecision((function(result){
                console.log("BlockDecision")
                console.log(result)
                if(!cease_protocol){ 
                    setTimeout((function(){
                        callBlockDecision(BLOCK_CREATION_TIMEOUT)
                    }), BLOCK_CREATION_TIMEOUT)
                }else{
                    console.log("PROTOCOL CEASED, RESET")
                    cease_protocol = false;
                }
            }))
        } 
        else{
            if(!cease_protocol){ 
                setTimeout((function(){
                    callBlockDecision(BLOCK_CREATION_TIMEOUT)
                }), BLOCK_CREATION_TIMEOUT)
            }else{
                console.log("PROTOCOL CEASED, RESET")
                cease_protocol = false;
            }
        }
    }else{
        console.log("callBlockDecision, else isSync, SHOULD BE SYNCING: "+isProtocolSyncing)
        LOGGER(Protocol.GetPeerBlocks(),"peer_blocks")
        var peer_blocks_keys = Object.keys(Protocol.GetPeerBlocks())
        var peer_with_greater_block = false
        peer_blocks_keys.forEach(k => {
            var peer_single_block = Protocol.GetPeerBlocks()[k]
            LOGGER({
                k: peer_single_block
            }, "PEER blocks ids")
            if(peer_single_block.header.blockIndex > Protocol.GetLatestBlock().header.blockIndex){
                Protocol.BroadcastSingle(Protocol.QuerySync(Protocol.GetLatestBlock().header.blockIndex + 1));
                console.log("should've broadcasted already")
            }else{
                try{
                    var my_version_of_peer_block = Protocol.GetBlockByID(peer_single_block.header.blockIndex)
                    if(peer_single_block.header.hash != my_version_of_peer_block.header.hash){
                        Protocol.BroadcastSingle(Protocol.QuerySync(peer_single_block.header.blockIndex));
                    }else{
                        LOGGER( {
                            peer: peer_single_block.header.hash,
                            mine: my_version_of_peer_block.header.hash
                        } , "peer block equal to ours: "+k)
                    }
                }catch(e){
                    console.log("ERROR IN peer_blocks_keys.forEach: "+e)
                }
            }
        })
        setTimeout((function(){
            callBlockDecision(BLOCK_CREATION_TIMEOUT)
        }), BLOCK_CREATION_TIMEOUT)
    }
}

function CeaseProtocolInterval(){
    cease_protocol = true;
    console.log("stopping protocol interval")
}

function Entry(){
    getBCConfig(null, (function(result){
        Actor.ConnectToPeers(initialPeers)
        Actor.InitP2PServer()
        try{
            initHttpServer()
        }catch(e){
            console.log("error initing http server, might be already used...")
        }
        console.log("getBCConfig")
        console.log(result.result.configuration)
        var BLOCKCHAIN_CONFIGURATION = result.result.configuration;
        
        //DEV
        var BLOCKCHAIN_CONFIGURATION = {
          type: 1,
          options: {},
          consensus: 0,
          genesis_block: {},
          block_creation_time: 60000 * 0.1,
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
                        "code": "ONB_Param1 ONB_Param2 ONB_Param3 ONB_Param4",
                        "script": "ONB_Param1 ONB_Param2 ONB_Param3 ONB_Param4"
                    },
                    "return": {
                        "code": "",
                        "script": ""
                    }
                  }}
              ]
          }
        }
        //END DEV


        Protocol.Begin(BLOCKCHAIN_CONFIGURATION)
        var BlockDecisionInterval = BLOCKCHAIN_CONFIGURATION.block_creation_time;
        setTimeout((function(){
            callBlockDecision(BlockDecisionInterval);
        }), BlockDecisionInterval)

    }))
}


var broadcastInterval = 100
Protocol.ActuallyBroadcastNextInBQ(broadcastInterval)

setInterval(function () {
  console.log("Before:",process.memoryUsage());
  try{
    gc();
  }catch(e){
    console.log("error when calling GC, trying global")
    global.gc()
  }
  
  console.log(" After:",process.memoryUsage());
},30000);

module.exports = {
    Entry,
    CeaseProtocolInterval,
}

