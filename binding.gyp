{
  "targets": [
    {
      "target_name": "KVM",
      "sources": [ 
      			   "vm/kvm.cpp", 
      			   "vm/lexer.cpp", 
      			   "vm/vm.cpp",
               "vm/ks.cpp"
      			   ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "vm/"
      ]
    },
    {
      "target_name": "Language",
      "sources": [ 
               "Lang/lexer/lexer.cpp", 
               "Lang/lexer/language.cpp", 
               "Lang/lexer/ks.cpp",
               "Lang/lexer/json.hpp",
               "Lang/lexer/symbols.h",
               "Lang/lexer/helpers.h",
               "Lang/lexer/ast.h"
               ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "Lang/lexer/"
      ],
      "cflags!" : [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-rtti",
        "-fno-exceptions"
      ],
      "conditions": [
        [
          "OS==\"mac\"", {
            "xcode_settings": {
              "OTHER_CFLAGS": [
                "-mmacosx-version-min=10.7",
                "-std=c++11",
                "-stdlib=libc++"
              ],
              "GCC_ENABLE_CPP_RTTI": "YES",
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
            }
          }
        ]
      ]
    }
  ]
}
