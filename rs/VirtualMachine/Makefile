build:
	clear;
	make wasm;
wasm:
	#cargo build --target wasm32-unknown-unknown --import-memory ; 
	#rustup -v install  nightly
	#rustup target add wasm32-unknown-unknown --toolchain nightly
	cargo +nightly build --target wasm32-unknown-unknown --release 
	#rustc +nightly src/lib.rs -C link-args=--global-base=128 -O -C lto --target wasm32-unknown-unknown && wasm-gc main.wasm && wasm2wat main.wasm
	#wasm-pack build ;
	wasm-pack build --target web;
	#cargo run; 