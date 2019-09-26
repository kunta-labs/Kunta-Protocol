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

#ifndef VM_H
#define VM_H

#include <iostream>
#include <vector>
#include <fstream>
#include <unordered_map>
#include <string>
#include <ctime>

using namespace std;
typedef uint8_t byte;
const string FAILURE_RETURN_CODE = "<<$FAILURE$>>";

class KVM_Result {

	enum class KVM_STATUS {
					 Success, 
					 Error 
					};

	KVM_STATUS state = KVM_STATUS::Success;
	public:
		KVM_Result(){}
		string GetStatus(){
			string statusResult;
			switch(state){
				case KVM_STATUS::Success:
					statusResult = "Success";
					break;
				case KVM_STATUS::Error:
					statusResult = "Error";
					break;
			}
			return statusResult;
		}

		bool SetError(){
			state = KVM_STATUS::Error;
			return true;
		}
};

class KVM_LOG {
	public:
		static void WRITE(string c){
			cout << c << endl;
		} 
};

enum OPERATION : byte {
				OP_HALT,
				OP_MUL,
				OP_SUB,
				OP_ADD,
				OP_DIV,
				OP_EQUAL,
				OP_VERIFY,
				OP_CONST,
				OP_DUP,
				OP_EQUALVERIFY,
				OP_CONST_EQUAL_DROP,
				OP_CRITICAL_VERIFY,
				OP_GREATER_ZERO,
				OP_STORE,
				OP_ATLEAST_ZERO,
				OP_TIME_GREATER
			};

class KVM_OP_CODES {
	public:
		static unordered_map<int, byte> GetOperations(){
			unordered_map<int, byte> OP_CODES = {
				{ 0, OPERATION::OP_HALT },
		        { 1, OPERATION::OP_ADD },
		        { 2, OPERATION::OP_SUB },
		        { 3, OPERATION::OP_MUL },
		        { 4, OPERATION::OP_DIV },
		        { 5, OPERATION::OP_EQUAL },
		        { 6, OPERATION::OP_VERIFY },
		        { 7, OPERATION::OP_CONST },
		        { 8, OPERATION::OP_DUP },
		        { 9, OPERATION::OP_EQUALVERIFY },
		        { 10, OPERATION::OP_CONST_EQUAL_DROP },
		        { 11, OPERATION::OP_CRITICAL_VERIFY },
		        { 12, OPERATION::OP_GREATER_ZERO },
		        { 13, OPERATION::OP_STORE },
		        { 14, OPERATION::OP_ATLEAST_ZERO },
		        { 15, OPERATION::OP_TIME_GREATER }
			};
			return OP_CODES;
		}
};

template <typename T> class KVM_STACK{
	public:
		KVM_STACK(){}
		void push(T item){
			static_cast<T *>(this)->push();
		}
		void pop(){
			static_cast<T *>(this)->pop();
		}
};

class KVM_INTEGER_STACK : public KVM_STACK<KVM_INTEGER_STACK>{
	vector<int32_t> data;
	public:
		void push(int32_t item){
				data.push_back(item);
		}
		void pop(){
			cout << "EVM_INTEGER_STACK" << endl;
		}
};

class KVM_CONSTANT_STACK : public KVM_STACK<KVM_INTEGER_STACK>{
	vector<string> data;
	public:
		void push(string item){
				data.push_back(item);
		}
		void pop(){
			cout << "KVM_CONSTANT_STACK" << endl;
		}
};

class VM {

	int32_t pc = 100; 
	int32_t sp = 0; 
	int32_t cp = 0;
	vector<int32_t> memory;
	vector<string> constants;
	vector<string> returnConstants;
	KVM_INTEGER_STACK iStack; 
	KVM_CONSTANT_STACK sStack; 
	int32_t typ = 0;
	int32_t dat = 0;
	int32_t running = 1;
	KVM_Result status;
	int32_t getType(int32_t instruction);
	int32_t getData(int32_t instruction);
	void fetch();
	void decode();
	void execute();
	void PrimitiveInstruction();
	public:
		VM();
		vector<string> run();
		void loadProgram(std::vector<int32_t> prog, vector<string> consts);
		vector<string> EnterVM(vector<int32_t> &inst, vector<string> &constants);
		string Status(){
			return status.GetStatus();
		}
};

#endif
