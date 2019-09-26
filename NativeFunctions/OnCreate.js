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

var LOGGER = require('../Logger.js')
var NH = require("./NativeHelper.js")
var NativeHelper = new NH.NativeHelper()

class OnCreate{
	constructor(){
		LOGGER("ON CREATE IS CALLED","CALLEDIT")
	}
	Invoke(bcc, b, callback){
		NativeHelper.FetchCodeToExecute(bcc, b, "OnCreate","On Create",function(res){
			callback(res)
		})
	}
}

module.exports = {
	OnCreate
}