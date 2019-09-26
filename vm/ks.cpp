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

#include "ks.h"
KuntaScript::KuntaScript(){}

pair<vector<int32_t>, vector<string>> KuntaScript::Parse(string contents){	
	Lexer lexer;
	strings lexemes = lexer.lex(contents);
	cout << "[Parsed Instruction Steps]: " << endl;
	for(auto i : lexemes)
		cout << "[LEX]: " << i << endl;
	pair<vector<int32_t>, vector<string>> instructions = CompileToInstructions(lexemes);
	string instructionString = InstructionToString(instructions.first);
	return instructions;
}

pair<vector<int32_t>, vector<string>>  KuntaScript::CompileToInstructions(strings s) {
	vector<int32_t> instructions;
	vector<string> stringMemory;
	for (int32_t i = 0; i < s.size(); i++) {
		if (IsInteger(s[i])) {
			instructions.push_back( stoi(s[i]) );
		} else {
			int32_t instruction = MapToNumber( s[i] );
			if (instruction != -1) {
				instructions.push_back( instruction );
			} else {
				cout << "Instruction Not Integer, Not Valid Instruction, must be CONST:  [" << s[i] << "]" << endl;
				stringMemory.push_back( s[i].c_str() );
			}
		}
	}
	
	instructions.push_back(0x40000000); 
	cout << "End of CompileToInstructions: " << endl;
	pair<vector<int32_t>, vector<string>> pairToReturn = make_pair( instructions, stringMemory );
	return pairToReturn;
}

bool KuntaScript::IsInteger(string s) {
	for (int32_t i = 0; i < s.length(); i++) {
		if (!isdigit(s[i])) {
			return false;
		}
	}
	return true;
}

int32_t KuntaScript::MapToNumber(string s) {
	if (       s == "OP_ADD" ) {
		return 0x40000001;
	} else if (s == "OP_SUB") {
		return 0x40000002;
	} else if (s == "OP_MUL") {
		return 0x40000003;
	} else if (s == "OP_DIV") {
		return 0x40000004;
	} else if (s == "OP_EQUAL") {
		return 0x40000005;
	} else if (s == "OP_VERIFY") {
		return 0x40000006;
	} else if (s == "OP_CONST") {
		return 0x40000007;
	} else if (s == "OP_DUP") {
		return 0x40000008;
	} else if (s == "OP_EQUALVERIFY") {
		return 0x40000009;
	} else if (s == "OP_CONST_EQUAL_DROP") {
		return 0x4000000A;
	} else if (s == "OP_CRITICAL_VERIFY") {
		return 0x4000000B;	
	} else if (s == "OP_GREATER_ZERO") {
		return 0x4000000C;
	} else if (s == "OP_STORE") {
		return 0x4000000D;
	} else if (s == "OP_ATLEAST_ZERO") {
		return 0x4000000E;
	} else if (s == "OP_TIME_GREATER") {
		return 0x4000000F;
	} else if (s == "OP_FUNCCALL") { // 40000010
		return 0x40000010;
	} else if (s == "OP_RETURN") { // 40000010
		return 0x40000011;
	}

	return -1; // invalid instruction
}

string KuntaScript::InstructionToString(vector<int32_t> instructions){
	ostringstream oss;
	if (!instructions.empty()){
	    copy(instructions.begin(), 
    		 instructions.end() - 1,
	         ostream_iterator<int>(oss, ","));
	    oss << instructions.back();
	}else{
		cout << "ERROR: instructions vector is empty";
	}
	cout << "instruction string" << endl;
	cout << oss.str() << endl;
	return oss.str();
}
