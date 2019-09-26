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

var WebSocket = require("ws");
var LOGGER = require('./Logger.js')
var Protocol = require('./Protocol.js')
var p2p_port = process.env.P2P_PORT || 6001;
var node_ip = "_blank_"

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  node_ip = add;
  console.log('addr: '+node_ip);
})

var checkForDuplicatePeer = () => {

}

var ConnectToPeers = (newPeers) => {
    LOGGER(newPeers,"CONNECT TO PEERS")

    var allPeers = Protocol.Sockets.map(s => {
        return "ws://"+s._socket.remoteAddress + ':' + s._socket.remotePort
    })

    LOGGER(allPeers, "CONNECT TO PEERS, which peers do I have?")
    newPeers.forEach((peer) => {

        if(peer != "ws://undefined:6001"){
            if( allPeers.includes(peer) ){
                LOGGER(allPeers, "already have peer "+peer+", dont add")
            }else{
                var ws = new WebSocket(peer);
                LOGGER(ws, "we dont have peer "+peer+", so add them")
                ws.on('open', () => InitConnection(ws));
                ws.on('error', () => {
                    console.log('connection failed')
                });
            }
        }
    });
};

var InitP2PServer = () => {
    try{
        var server = new WebSocket.Server({port: p2p_port});
        server.on('connection', ws => InitConnection(ws));
        console.log('listening websocket p2p port on: ' + p2p_port);
    }catch(e){
        console.log("error setting up P2P, might be already allocated...")
    }
};

var MessageHandler = (ws) => {
    ws.on('message', (data) => {
        try{
            var message = JSON.parse(data);
            LOGGER(message, "MSG Invoked, MessageHandler", true);
            switch (message.type) {
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_LATEST:
                    //Protocol.Write(ws, Protocol.ResponseLatestMsg());
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_ALL:
                    //Protocol.Write(ws, Protocol.ResponseChainMsg());
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCKCHAIN:
                    Protocol.HandleBlockchainResponse(message);
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_BLOCKCHAIN:
                    Protocol.HandleBlockchainResponse(message);
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_TRANSACTION:
                    Protocol.HandleTransactionResponse(message);
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_TRANSACTION:
                    Protocol.HandleTransactionResponse(message);
                    break;    
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_BLOCK:
                    //Protocol.Write(ws, Protocol.ResponseLatestMsg())
                    if(message.data <= Protocol.GetLatestBlock().header.blockIndex){
                        Protocol.Write(ws, Protocol.ResponseQueryBlock(message.data));
                    }
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_BLOCK:
                    Protocol.HandleQueryBlockResponse(message);
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.QUERY_SYNC:
                    //Protocol.Write(ws, Protocol.ResponseLatestMsg())
                    if(message.data <= Protocol.GetLatestBlock().header.blockIndex){
                        Protocol.Write(ws, Protocol.ResponseQuerySync(message.data));
                    }
                    break;
                case Protocol.BLOCKCHAIN_COMMUNICATION_TYPE.RESPONSE_SYNC:
                    Protocol.HandleSynchResponse(message);
                    break;
            }
        }catch(e){
            console.log("ERROR IN ACTOR MESSAGEHANDLER: "+e)
        }
    });
};


var InitErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        Protocol.Sockets.splice(Protocol.Sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};


var InitConnection = (ws) => {
    Protocol.Sockets.push(ws);
    MessageHandler(ws);
    InitErrorHandler(ws);
    //Protocol.Write(ws, Protocol.QueryChainLengthMsg());
    //Protocol.SyncRootsWithPeers()
};

module.exports = {
	ConnectToPeers,
	InitP2PServer,
	InitConnection,
    node_ip
}