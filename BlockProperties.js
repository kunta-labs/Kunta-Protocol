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

var merkle = require("merkle")
var difficulty = 3 
class Block {
    constructor(
                blockIndex,
                hash,
                version,
                previousHash, 
                rootSet,
                timestamp, 
                data, 
                nonce,
                rootInstances) { 
        this._bid = blockIndex
        this.header = {
            blockIndex: blockIndex,
            hash: hash.toString(),
            version: version,
            previousHash: previousHash,
            rootSetMerkleRoot: merkle('sha256').sync(rootInstances).root(),
            rootSet: rootSet,
            timestamp: timestamp,
            difficulty: difficulty,
            nonce: nonce,
        }
        this.body = {
            data: data, 
            rootInstances: rootInstances
        }
    }
}

module.exports = {
    difficulty,
    Block
}