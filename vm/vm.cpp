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

#include "vm.h"

VM::VM() {
	memory.reserve(1000000);
	constants.reserve(1000000);
	returnConstants.reserve(1000000);
}

int32_t VM::getType(int32_t instruction) {
	int32_t type = 0xc0000000;
	type = (type & instruction) >> 30;
	return type;
}

int32_t VM::getData(int32_t instruction) {
	int32_t data = 0x3fffffff;
	data = data & instruction;
	return data;
}

void VM::fetch() {
	pc++;
}

void VM::decode() {
	int32_t max_command_number = 1073741840;
	if( memory[pc] < max_command_number){
		cout << "SMALLER than " << max_command_number << ", before VM::getType: " << memory[pc] << endl;
		typ = getType(memory[pc]);
		dat = getData(memory[pc]);
	}else{
		cout << "BIGGER than or equal " << max_command_number << ", before VM::getType: " << memory[pc] << endl;
		typ = 3; //memory[pc];
		dat = memory[pc];
	}
}

void VM::execute() {
	cout << "VM::execute typ: " << typ << " - " << dat << endl;
	if (typ == 0 || typ == 2) {
		sp++;
		memory[sp] = dat;
		cout << "[INTEGER]: " << dat <<  endl;
	} else if (typ == 3) {
		sp++;
		memory[sp] = dat;
		cout << "[LARGE NUMBER, MAYBE TIMESTAMP]: " << dat <<  endl;
	}else {
		PrimitiveInstruction();
	}
}

void VM::PrimitiveInstruction() {
	byte code = KVM_OP_CODES::GetOperations()[dat];
	cout << "PrimitiveInstruction - GetOps[" << dat << "] " << code << endl;
	cout << "[PrimitiveInstruction] sp1: " << memory[sp] << endl;
	switch (code) {
		int32_t stack_top;
		int32_t stack_top_under;
		case OPERATION::OP_HALT:
			cout << "[HALT]: " << dat << endl;
			running = 0;
			break;
		case OPERATION::OP_ADD:
			{
				cout << "[OP_ADD]: " << memory[sp - 1] << " " << memory[sp] << endl;
				auto sum = memory[sp - 1] + memory[sp];
				cout << "[sum]: " << sum << endl;
				memory[sp - 1] = sum;
				sp--; 
				cout << "[OP_ADD] SP: [" << sp << "]" << memory[sp] << endl;
				break;
			}
		case OPERATION::OP_SUB: 
			cout << "[OP_SUB]: " << memory[sp - 1] << " " << memory[sp] << endl;
			memory[sp - 1] = memory[sp - 1] - memory[sp];
			sp--;
			break;
		case OPERATION::OP_MUL:
			cout << "[OP_MUL]: " << memory[sp - 1] << " " << memory[sp] << endl;
			memory[sp - 1] = memory[sp - 1] * memory[sp];
			sp--;
			break;
		case OPERATION::OP_DIV: 
			cout << "[OP_DIV]: " << memory[sp - 1] << " " << memory[sp] << endl;
			memory[sp - 1] = memory[sp - 1] / memory[sp];
			sp--;
			break;
		case OPERATION::OP_EQUAL: 
			{
				cout << "[OP_EQUAL]: " << constants[cp - 1] << " " << constants[cp] << endl;
				auto stackItemsEqual = (constants[cp] == constants[cp-1]);
				cout << "[stackItemsEqual]: " << stackItemsEqual << endl;
				cout << "[OP_EQUAL] PRE sp++: " << sp << endl;
				sp++;
				memory[sp] = stackItemsEqual;
				cout << "[OP_EQUAL]: POST sp++" << sp << endl;
				break;
			}	
		case OPERATION::OP_VERIFY:
			cout << "[OP_VERIFY]: " << endl;	
			stack_top = memory[sp];
			memory[sp - 1] = (stack_top == 1);
			sp--; 
			break; 
		case OPERATION::OP_CONST:
			cout << "[OP_CONST] constants size: " << constants.size() << endl;
			cout << "[OP_CONST]: "<< constants[cp] << endl;
			cout << "[CP]: "<< cp << endl;
			cout << "[OP_CONST] memory[pc]: " << memory[pc] << endl;
			break;
		case OPERATION::OP_DUP:
			cout << "[OP_DUP] constants size: " << constants.size() << endl;			
			cout << "[OP_DUP] constant {" << cp << "}: " << constants[cp] << endl;
			cp++;
			break;
		case OPERATION::OP_EQUALVERIFY:
			cout << "[OP_EQUALVERIFY]: " << endl;
			cout << "[OP_EQUALVERIFY] constant {" << cp << "}: " << constants[cp] << endl;
			break;
		case OPERATION::OP_CONST_EQUAL_DROP:
			{
				cout << "[OP_CONST_EQUAL_DROP] pre-cp: " << cp << endl;
				cout << "[OP_CONST_EQUAL_DROP]: [" << constants[cp] << "] [" << constants[cp - 1] << "]" << endl;
				auto stackItemsEqual = (constants[cp] == constants[cp - 1]);
				cout << "[stackItemsEqual]: " << stackItemsEqual << endl;
				if(stackItemsEqual){
					constants.erase(constants.begin() + cp);
					cp--;
					constants.erase(constants.begin() + cp);
					cp--;
				}else{

				}
				cout << "[OP_CONST_EQUAL_DROP] post-cp: " << cp << endl;
				cout << "[constant[" << cp << "]] " << constants[cp] << endl;
				break;
			}
		case OPERATION::OP_CRITICAL_VERIFY:
			{
				cout << "[OP_CRITICAL_VERIFY]: " << endl;
				cout << "[OP_CRITICAL_VERIFY] sp {" << sp << "}: " << memory[sp] << endl;
				stack_top = memory[sp];
				bool critical_verified = (stack_top == 1);
				if( !critical_verified ){
					returnConstants.push_back( FAILURE_RETURN_CODE );
				}
				memory[sp] = critical_verified;
				break;
			}
		case OPERATION::OP_GREATER_ZERO:
			cout << "[OP_GREATER_ZERO]" << endl;
			memory[sp] = (memory[sp] > 0) ? 1 : 0; 
			break;
		case OPERATION::OP_STORE:
			{
				cout << "[OP_STORE]" << endl;
				cout << "[OP_STORE]: " << memory[sp] << endl;
				auto value = memory[sp];
				cout << "[OP_STORE value]: " << value << endl;
				returnConstants.push_back( to_string(value) );
				break;
			}
		case OPERATION::OP_ATLEAST_ZERO:
			{
				cout << "[OP_ATLEAST_ZERO]" << endl;
				memory[sp] = (memory[sp] >= 0) ? 1 : 0; 
				break;
			}
		case OPERATION::OP_TIME_GREATER:
				cout << "[OP_TIME_GREATER]: " << memory[sp] << endl;
				time_t t = std::time(0);
			    long int now = static_cast<long int> (t);
			    cout << "[OP_TIME_GREATER]: " << now << endl;
				memory[sp] = (now >= memory[sp]) ? 1 : 0; 
				break;
	}
	cout << "[PrimitiveInstruction] sp2: " << sp << endl;
}

vector<string> VM::run() {
	pc -= 1;
	while (running == 1) {
		fetch(); 
		decode();
		execute();
	}
	cout << "[MEMORY IN RUN]: " << memory.size() << endl;
	cout << "[constants IN RUN]: " << constants.size() << endl;
	cout << "[returnConstants IN RUN]: " << returnConstants.size() << endl;
	return returnConstants;
}


void VM::loadProgram(vector<int32_t> prog,
					 vector<string> consts) {
	for (int32_t i = 0; i < prog.size(); i++) {
		memory[pc + i] = prog[i]; 
	}	
	constants = consts;
	cp = constants.size() - 1;
	cout << "cp: " << cp << endl;
}

vector<string> VM::EnterVM(vector<int32_t> &inst, 
				 vector<string> &constants){
	cout << "EnterVM() Running now.." << endl;
	loadProgram(inst, constants);
	vector<string> execution = run();
	for(auto i : execution)
		cout << "[EXECUTION RESULT]: " << i << endl;
	return execution;
}


