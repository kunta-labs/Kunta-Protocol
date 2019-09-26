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

use std::fs::File;
use std::io::{Write, BufReader, BufRead, Error};
use std::path::Path;

//use wasm_bindgen::prelude::*;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_uchar, c_uint, c_void};

pub unsafe extern "C" fn write(param: &str) -> Result<(), Error> {
    let path = "/Users/jovonnipharr/Documents/projects/kunta_wasm/rs/OnNewBlock/log.txt";
    let mut output = File::create(path)?;
    write!(output, "{}", param)?;
    let input = File::open(path)?;
    let buffered = BufReader::new(input);

    for line in buffered.lines() {
        println!("{}", line?);
    }

    Ok(())
}

#[repr(C)]
pub struct JsInteropString {
    data: *const u8,
    len: usize,
}

#[no_mangle]
pub unsafe extern "C" fn execute(s: *const JsInteropString) -> i32 {

    let s = match s.as_ref() {
        Some(s) => s,
        None => return -1,
    };
    
    let data = std::slice::from_raw_parts(s.data, s.len);
    let input: &str = std::str::from_utf8(data).unwrap();

    println!("x input: {:?}", &input);
    let mut split = input.split(" ");
    
    let signature = split.next();
    println!("signature: {:?}", signature);
    let hash_1 = split.next();
    println!("hash_1: {:?}", hash_1);
    let signature_correct = split.next();
    println!("signature_correct: {:?}", signature_correct);
    let hash_2 = split.next();
    println!("hash_2: {:?}", hash_2);
    
    let mut answer = "";
    //let match_result: Result<&str, &str> = match hash_1 {
    let match_result: &str = match hash_1 {
        Some(hash_2) => "1",
        None         => "2",
        _            => "3",
    };

    match std::str::from_utf8(data) {
        Ok(s) => real_code::compute(hash_1.unwrap()),
        Err(_) => real_code::compute("ERROR"),
    }
        
}

//-2147483647 to 2147483647
mod real_code {
    pub fn compute(operator: &str) -> i32 {
        match operator {
            "SUCCESSONB"  => -1000000001,
            "ERRORONB"    => -1010101011,
            "TESTONB"     => -2147483647,
            _             => -1909090909,
        }
    }
}
