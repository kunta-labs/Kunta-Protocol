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

#include "lexer.h"
strings Lexer::lex(string s) {
	strings strlst;
	char lexeme[256];
	int i = 0;
	int j = 0;
	State state = START;
	int done = 0; 
	int len = s.length();
	int balance = 0; 
	while(i < len) {
		switch(state) {
		case START:
			if (my_isspace(s[i])) {
				state = SKIP;
			} else if (isgroup(s[i])) {
				if(s[i] == '"') {
					lexeme[j] = s[i];
					j++;
					i++;
				}
				state = READBLOCK;
			} else if (s[i] == '/' && s[i + 1] == '/') {
				i += 2;
				state = COMMENT;
			} else {
				state = READCHAR;
			}
			break;
		case READCHAR:
			if (my_isspace(s[i])) {
				state = DUMP;
			} else if (s[i] == '\\') {
				i += 2;
			} else if (isgroup(s[i])) {
				if (s[i] == '"') {
					lexeme[j] = s[i];
					j++;
					i++;
				}
				state = READBLOCK;
			} else if (isspecial(s[i])) {
				if (j == 0) {
					lexeme[j] = s[i];
					j++;
					i++;
				}
				state = DUMP;
			} else if (s[i] == '/' && s[i + 1] == '/') {
				i += 2;
				state = COMMENT;
			} else {
				lexeme[j] = s[i];
				j++;
				i++;
			}
			break;
		case READBLOCK:
			if (s[i] == beg_char && s[i] != '"') {
				balance++;
				lexeme[j] = s[i];
				j++;
				i++;
			} else if (s[i] == end_char) {
				balance--;
				lexeme[j] = s[i];
				j++;
				i++;
				if (balance <= 0) {
					state = DUMP;
				}
			} else if (end_char == '"' && s[i] == '\\') {
				// TODO: fix this to actually record the chars
				i += 2;
			} else {
				lexeme[j] = s[i];
				j++;
				i++;
			}
			break;
		case SKIP:
			if (my_isspace(s[i])) {
				i++;
			} else {
				state = READCHAR;
			}
			break;
		case DUMP:
			if (j > 0) {
				lexeme[j] = 0;
				strlst.push_back(lexeme);
				j = 0;
			}
			state = START;
			break;
		case COMMENT:
			if (s[i] != '\n') {
				i++;
			} else {
				state = READCHAR;
			}
			break;
		case END:
			i = len;
			break;
		}
	}
	if (j > 0) {
		lexeme[j] = 0;
		strlst.push_back(lexeme);
	}
	return strlst;
}

bool Lexer::my_isspace(char c) {
	switch(c) {
		case '\n':
		case '\r':
		case '\t':
		case '\v':
		case ' ':
		case '\f':
			return true;
		default:
			return false;
	}
}
bool Lexer::isgroup(char c) {
	beg_char = c;
	switch(c) {
		case '"':
			end_char = '"';
			return true;
		case '(':
			end_char = ')';
			return true;
		case ')':
			return true;
		default:
			return false;
	}
}
bool Lexer::isspecial(char c) {
	switch(c) {
		case '[':
		case ']':
			return true;
		default:
			return false;
	}
}
