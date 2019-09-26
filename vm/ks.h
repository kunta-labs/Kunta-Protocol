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

#ifndef KuntaScript_H
#define KuntaScript_H
#include <iostream>
#include <vector>
#include <fstream>
#include "lexer.h"
#include <algorithm>
#include <sstream>
#include <iterator>
using namespace std;
class KuntaScript {
	static pair<vector<int32_t>, vector<string>> CompileToInstructions(strings s);
	static bool IsInteger(string s);
	static bool isPrimimitive(string s);
	static int32_t MapToNumber(string s); 
	static string InstructionToString(vector<int32_t> instructions);
	public:
		KuntaScript();
		static pair<vector<int32_t>, vector<string>> Parse(string contents);
		class KVM_STACK_ITEM {
			int32_t number;
			string constant;
		};
};

#endif