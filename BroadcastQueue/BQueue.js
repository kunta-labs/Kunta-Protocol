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

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
var CreateTable = () => {
	db.run("CREATE TABLE broadcasts ("+
	             "broadcast_id INTEGER PRIMARY KEY,"+
	             "ws TEXT NOT NULL,"+
	             "payload TEXT NOT NULL,"+
	             "done TEXT NOT NULL"+
             ");");
}
var InsertIntoQueue = (ws, payload) => {
    db.serialize(function() {
      stmt1 = db.prepare("SELECT broadcast_id, ws, done, payload "+
      		  			"FROM broadcasts "+
    		  			"WHERE ws = ?"+
    		  			"AND done = 'no' "+
    		  			"AND payload = ? "+
    		  			"LIMIT 1");
	  stmt1.each(ws, payload, function(err, row) {
	  	  console.log("stmt1 row:")
	      console.log(row);
	  }, function(err, count) {
	      //stmt1.finalize();
	      console.log("stmt1 count: "+count)
	      if(count == 0){
	      	var stmt = db.prepare("INSERT or IGNORE INTO broadcasts "+
      						"VALUES (NULL, ?, ?, ?) ");
		    stmt.run(ws, payload, "no");
		    stmt.finalize();
		    db.each("SELECT rowid AS id, broadcast_id FROM broadcasts WHERE done = 'no'", function(err, row) {
		        console.log(row.id + ": " + row.broadcast_id);
		    });
	      }
	  });
    });
    //db.close();
}

var ChooseNextBroadcast = (callback) => {
	db.serialize(function() {
	  var chosen_broadcast = null
      db.each("SELECT broadcast_id, ws, done, payload "+
      		  "FROM broadcasts "+
    		  "WHERE done = 'no' LIMIT 1", function(err, rowToBroadcast) {
          	  console.log(rowToBroadcast)
          	  console.log("broadcast_id: "+rowToBroadcast.broadcast_id);
          	  //RESET TO YES
          	  chosen_broadcast = rowToBroadcast.broadcast_id
          	  console.log("setting "+chosen_broadcast+" to yes")
		      var stmt = db.prepare("UPDATE broadcasts "+
									"SET done = 'yes' "+
									"WHERE broadcast_id = ? ");
		      stmt.run(chosen_broadcast);
		      stmt.finalize();
		      db.each("SELECT broadcast_id, ws, done, payload "+
      		  	"FROM broadcasts WHERE done = 'no'", function(err, row) {
      		  	console.log(row)
    		  })
    		  callback(rowToBroadcast)
      } , function(err, count) {
  			if (count == 0) {
  				callback(null)
  			}else{
  				//console.log("BQUEUE DUPLICATE")
  			}
      });
    });
    //db.close();
}

var BeginBroadcastInterval = () => {

}

var SetBroadcastToDone = () => {

}

//
CreateTable() 

module.exports = {
	InsertIntoQueue,
	ChooseNextBroadcast
}


