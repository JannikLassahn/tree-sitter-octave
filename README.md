# tree-sitter-python

Octave grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

TODOs:

- [ ] parser currently need a newline after the last expression
- [ ] problems with expression lists. the follwing code should be parsable: `function test 1,2,3 end`
- [ ] classdef
- [ ] block comments
- [ ] quote strings
- [ ] line continuation operator (...)
- [ ] arrays
- [ ] cells
- [ ] member access using dot