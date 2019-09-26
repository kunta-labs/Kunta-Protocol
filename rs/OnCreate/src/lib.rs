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

extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

// use std::ffi::CString;
// use std::os::raw::c_char;

use std::os::raw::c_char;
use std::ffi::CStr;
use std::ffi::CString;

// static HELLO: &'static str = "{
//                                     \"hello\": \"OC\",  
//                                     \"yo\": \"yer\"
//                                 }";

static mut HELLO: &'static str = "[]";


#[no_mangle]
pub fn on_create(x: String) -> *mut c_char {

    //println!(x);
    let result: &str = "FROM ON CREATE";

    //TODO:
    //chain x to result, and 

    //////////////////
    let content: String = format!(r#"
        {{
            "result": "{}",
        }}"#, result);
    let HELLO2: &str = &content.to_string();
    let s = CString::new(HELLO2).unwrap();
    //println!("{}",&s.to_string());


    println!("jovonni: {}", &x.to_string());



    //return the object
    unsafe{
        HELLO = "[\"100\"]";
        let s = CString::new(HELLO).unwrap();
        s.into_raw()
    }
    
}

#[no_mangle]
pub fn on_create_len() -> usize {
    unsafe{
        HELLO.len()
    }
}

//WRITE TESTS to ensure communication through WASM is deterministic

//String to object

//