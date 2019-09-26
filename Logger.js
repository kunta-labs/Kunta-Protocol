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

var production = true
var prettyjson = require('prettyjson');
var pjson_options = { noColor: false };

Object.defineProperty(global, '__stack', {
get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
get: function() {
        return __stack[1].getFunctionName();
    }
});

var LOGGER = (msg, LOGTYPE, logIt=false, LINE="NO LINE PASSED") => {
   if(!production && logIt || production){     
        console.log("")
        console.log("")
        console.log("/////////// ["+LOGTYPE+"] //////////////")
        console.log("")
        if(typeof(msg)=="object"){
            try{
                console.log(prettyjson.render(msg, pjson_options))
            }catch (err){
                console.log(msg)
            }
        }else{
            console.log(msg)
        }
        console.log("")
        console.log("//////////// [FINISH "+LOGTYPE+"] /////////")
        console.log("")
        console.log("")
    }
}

module.exports = LOGGER
