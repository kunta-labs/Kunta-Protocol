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

//VIRTUAL MACHINE import
mod lib;

fn main() {
    println!("-VM MAIN-");
    
    //lib::virtual_machine( "31ded61dd07311e505f857b6c826368ddc83f82e2f0e687f83e7f33fb35122bb6cb38d0ec804b4a98f272642d607a491e05756fc568175390dd6779aecc698bcdd2413c7c00ae7f5634e35f19af46d509cd7c653bbb5c34e97ec98b55b8f6084b42d4d0b6e5aaa484e09d6c7f8947ced4fc042edde59d62343d5ec1f0cbaf6873bfdf4a4c8645f98cf06c3c86bf049f751b725798275c5bdbe8d518ea6375cd57ffef2a2777919b456e46ae433967c3ecb718e133766389161e2d47a7fe457b93f89cc59ce118f577b140bb0e2d68394b519bec6b7e1a2b64028be68a716b2a4f0a8649083b361e4ae43ad4b990082442a4657a643a5af5859bdac81c5939e20 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4 1 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4".to_string() );
    //lib::virtual_machine( "31 9f 1 9f" );
    //lib::virtual_machine( "31 9f 1 9f" );

    // lib::virtual_machine( "31ded61dd07311e505f857b6c826368ddc83f82e2f0e687f83e7f33fb35122bb6cb38d0ec804b4a98f272642d607a491e05756fc568175390dd6779aecc698bcdd2413c7c00ae7f5634e35f19af46d509cd7c653bbb5c34e97ec98b55b8f6084b42d4d0b6e5aaa484e09d6c7f8947ced4fc042edde59d62343d5ec1f0cbaf6873bfdf4a4c8645f98cf06c3c86bf049f751b725798275c5bdbe8d518ea6375cd57ffef2a2777919b456e46ae433967c3ecb718e133766389161e2d47a7fe457b93f89cc59ce118f577b140bb0e2d68394b519bec6b7e1a2b64028be68a716b2a4f0a8649083b361e4ae43ad4b990082442a4657a643a5af5859bdac81c5939e2X 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4 0 9f12a7aa4d63c45cd1f6020934bbdd144c814f32547ef291b8b30e0864a4c4c4------".to_string() );
    //let n: *const u8 = 0b01001100;
    //let n = 0b01001100 as *const u8;
    //let s = 18;

    // let parameter = lib::JsInteropString { 
    // 	data: n, len: s 
    // };

    //unsafe{ lib::write("test string");}
    //may not be able to pass cont to function
    //lib::virtual_machine( parameter );

}