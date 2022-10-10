(identifier) @variable

[
  (true)
  (false)
] @constant.builtin

(comment) @comment

[
  (string)
  (char)
] @string

(escape_sequence) @escape

[
  (float)
  (integer)
] @number


[
  (operator)
] @operator

[
  "end"
  "function"
  "endfunction"
  "if"
  "elseif"
  "else"
  "endif"
  "switch"
  "case"
  "otherwise"
  "for"
  "while"
  "endwhile"
  "do"
  "until"
  "try"
  "catch"
  "end_try_catch"
] @keyword