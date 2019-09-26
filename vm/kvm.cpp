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

#include <nan.h>
#include <iostream>
#include <fstream>
#include <iostream> 
#include "vm.h"
#include "ks.h"
using namespace std;
void KVMMethod(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  cout << "METHOD IS RUNNING" << endl;
  Nan::HandleScope scope;
  if (info[0]->IsString()) {
    v8::String::Utf8Value KVM_SCRIPT(info[0]->ToString());
    printf("[KVM Node Invocation] - %s ", (const char*)(*KVM_SCRIPT));
	  string contents = (const char*)(*KVM_SCRIPT);
	  pair<vector<int32_t>, vector<string>> 
    KVM_Inst = KuntaScript::Parse(contents);
 	  for(auto i : KVM_Inst.second)
      cout << "KVM_Inst.second: " << i << endl;
    cout << "===[PARSED]==" << endl;
    VM vm; 
    vector<string> result = vm.EnterVM(KVM_Inst.first, KVM_Inst.second);
    cout << "VM Status: " << vm.Status() <<endl;
    cout << "Successfully ran EnterVM" << endl;
    for(auto i : result)
      cout << "KVM result: " << i << endl;
    v8::Isolate* isolate = info.GetIsolate();    
    v8::Local<v8::Array> result_list = v8::Array::New(isolate);
    for (unsigned int i = 0; i < result.size(); i++ ) {
      v8::Local<v8::Object> r = v8::Object::New(isolate);
      r->Set( v8::Number::New( isolate, i ),
      	      v8::String::NewFromUtf8( isolate, result[i].c_str() ));
      result_list->Set(i, r);
	  }
    info.GetReturnValue().Set(result_list);
	  //info.GetReturnValue().Set(result);
  }
}

void Init(v8::Local<v8::Object> exports) {
  cout << "KVM Init IS RUNNING" << endl;
  exports->Set(Nan::New("KVM").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(KVMMethod)->GetFunction());
}


NODE_MODULE(KVM, Init)
