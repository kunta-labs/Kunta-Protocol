CFLAGS=-std=c++11
CXX = g++
all: clean entry
	#./entry "2 2 OP_EQUAL OP_VERIFY"
	#./entry "OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_DUP OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_EQUAL OP_VERIFY"
	#./entry "12 1 OP_ADD OP_STORE OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST_EQUAL_DROP 1 OP_CRITICAL_VERIFY"
	#./entry "0 1 OP_ADD OP_STORE OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_EQUAL_DROP 1 OP_CRITICAL_VERIFY"
	#./entry "100 1 OP_ADD OP_STORE OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST_EQUAL_DROP 1 OP_CRITICAL_VERIFY"
	#./entry "101 OP_ATLEAST_ZERO OP_VERIFY"
	#./entry "1 + 1 / 2"
	#./entry "2 2 OP_EQUAL OP_VERIFY"
	#./entry "1 1 OP_ADD OP_STORE OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST bca98aac738f2a397141c55668725d82f56ff3372f9a4b1fb69e909d62521ad9 OP_CONST_EQUAL_DROP 1 OP_CRITICAL_VERIFY 1528309429 OP_TIME_GREATER OP_CRITICAL_VERIFY"
	#idk why this is here, maybe test before starting compiler? cant be tho...
	#./entry "Blockchain{ require(1); require(2); func morph(){ test('dsd'); return 0; }; morph(); }"
	#./entry "OP_FUNCCALL log "created..."  OP_RETURN True"
	./entry "OP_CONST "created..." OP_FUNCCALL log OP_RETURN True"
entry: entry.o vm.o ks.o lexer.o
	$(CXX) $(CFLAGS) vm.o entry.o ks.o lexer.o -o entry
entry.o: entry.h entry.cpp
	$(CXX) $(CFLAGS) -c entry.cpp 
vm.o: vm.h vm.cpp
	$(CXX) $(CFLAGS) -c vm.cpp 
lexer.o: lexer.h lexer.cpp
	$(CXX) $(CFLAGS) -c lexer.cpp
ks.o: ks.h ks.cpp
	$(CXX) $(CFLAGS) -c ks.cpp
clean:
	clear
	rm -f *.o vm ks *.o *.bin entry entry.o
