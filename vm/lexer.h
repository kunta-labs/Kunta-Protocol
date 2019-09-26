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

#ifndef LEXER_H
#define LEXER_H
#include <iostream>
#include <vector>
using namespace std;
typedef uint8_t byte;
typedef vector<string> strings;
enum State : byte {
	START,
	READCHAR,
	READBLOCK,
	SKIP,
	DUMP,
	COMMENT,
	END
};
class Lexer {
	bool my_isspace(char c);
	bool isspecial(char c);
	bool isgroup(char c);
	char end_char, beg_char;
	public:
			strings lex(string s);
};
#endif
