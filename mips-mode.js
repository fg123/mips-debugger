CodeMirror.defineSimpleMode("mips", {
    // The start state contains the rules that are intially used
    start: [
        // The regex matches the token, the token property contains the type
        {regex: /;.*/, token: "comment"},
        {regex: /\".[^"]*\"/, token: "string"},
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {regex: /\badd|sub|mult|multu|div|divu|\.import|\.word|mfhi|mflo|lis|lw|sw|slt|sltu|beq|bne|jr|jalr\b/,
        token: "keyword"},
        {regex: /\$\d*/, token: "variable-2"},
        {regex: /[a-zA-Z_][a-zA-Z_0-9]*:?/, token: "atom"},
        {regex: /[a-zA-Z_][a-zA-Z_0-9]*/, token: "variable"},
        {regex: /\b\d*\.?\d+\b/, token: "number"},
        // A next property will cause the mode to move to a different state
        {regex: /[-+\\\/*=<>!~%]+/, token: "operator"},
    ],
    meta: {
      lineComment: ";"
    }
  });