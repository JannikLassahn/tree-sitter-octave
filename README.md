# tree-sitter-octave

[![Build/test](https://github.com/JannikLassahn/tree-sitter-octave/actions/workflows/ci.yml/badge.svg)](https://github.com/JannikLassahn/tree-sitter-octave/actions/workflows/ci.yml)

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
