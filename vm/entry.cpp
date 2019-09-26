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

#include "entry.h"
using namespace std;
int main(int argc, char *argv[]){
	string contents = argv[1];
  	pair<vector<int32_t>, vector<string>> 
    KVM_Inst = KuntaScript::Parse(contents);
 	for(auto i : KVM_Inst.second)
	  cout << "KVM_Inst.second: " << i << endl;
    cout << "===[PARSED]==" << endl;
    VM vm; 
    vector<string> result = vm.EnterVM(KVM_Inst.first, 
    						 			KVM_Inst.second);
    cout << "VM Status: " << vm.Status() <<endl;
    cout << "Successfully ran EnterVM" << endl;
	return 0;
}


