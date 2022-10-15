// from https://docs.octave.org/v7.2.0/Operator-Precedence.html
const PREC = {
  assign: 1,
  or: 1,
  and: 2,
  elementwise_or: 3,
  elementwise_and: 4,
  compare: 5,
  colon: 6,
  plus: 7,
  times: 8,
  prefix: 9,
  power: 10,
  transpose: 11,
  postfix: 12,
  call: 20,
  parentheses: 21,
};

module.exports = grammar({
  name: "octave",

  extras: ($) => [$.comment, /\s/],

  supertypes: ($) => [$.expression, $.primary_expression, $.pattern],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.primary_expression, $.pattern],
    [$.primary_expression, $._list],
    [$.matrix, $.matrix_pattern],
    [$.cell, $.index_expression],
  ],

  inline: ($) => [$._left_hand_side, $._simple_expression],

  rules: {
    source_file: ($) =>
      optional(choice($._expression_list, $.class_definition)),

    _expression_list: ($) =>
      seq(
        sep1($._terminator, choice($.expression, $._declaration, $._statement)),
        optional($._terminator)
      ),

    _terminator: ($) => choice(",", ";", "\n"),

    //
    // declarations
    //
    _declaration: ($) => choice($.function_declaration),

    function_declaration: ($) =>
      seq(
        "function",
        optional(seq($.function_return, "=")),
        field("name", $.identifier),
        field("parameters", optional($.parameters)),
        optional($._expression_list),
        choice("end", "endfunction")
      ),

    function_return: ($) =>
      choice(
        $.identifier,
        seq("[", seq(commaSep1($.identifier), optional(",")), "]")
      ),

    parameters: ($) => prec.left(100, seq("(", optional($._list), ")")),

    class_definition: ($) =>
      seq(
        "classdef",
        optional($.attributes),
        field("name", $.identifier),
        optional(seq("<", sep1("&", field("base", $.identifier)))),
        repeat(
          choice(
            $.properties_block,
            $.methods_block,
            $.events_block,
            $.enumeration_block
          )
        ),
        choice("end", "endclassdef")
      ),

    properties_block: ($) =>
      seq(
        "properties",
        optional($.attributes),
        repeat($.property),
        choice("end", "endproperties")
      ),

    property: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("=", field("value", $.expression))),
        optional($._terminator)
      ),

    methods_block: ($) =>
      seq(
        "methods",
        optional($.attributes),
        repeat($.function_declaration),
        choice("end", "endmethods")
      ),

    events_block: ($) =>
      seq(
        "events",
        optional($.attributes),
        optional(
          seq(sep1($._terminator, $.identifier), optional($._terminator))
        ),
        choice("end", "endevents")
      ),

    enumeration_block: ($) =>
      seq(
        "enumeration",
        optional($.attributes),
        optional(
          seq(sep1($._terminator, $.enumeration), optional($._terminator))
        ),
        choice("end", "endenumeration")
      ),

    enumeration: ($) => seq($.identifier, optional($.argument_list)),

    attributes: ($) => seq("(", commaSep1($.attribute), ")"),

    attribute: ($) =>
      seq(
        field("name", $.identifier),
        optional(
          seq("=", field("value", choice($.identifier, $.true, $.false)))
        )
      ),

    //
    // statements
    //

    _statement: ($) =>
      choice(
        $.break_statement,
        $.continue_statement,
        $.return_statement,
        $.if_statement,
        $.switch_statement,
        $.for_statement,
        $.while_statement,
        $.do_statement,
        $.try_statement
      ),

    break_statement: ($) => "break",
    continue_statement: ($) => "continue",
    return_statement: ($) => "return",

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        optional($._expression_list),
        field("alternative", repeat($.elseif_clause)),
        field("alternative", optional($.else_clause)),
        choice("end", "endif")
      ),

    elseif_clause: ($) =>
      seq(
        "elseif",
        field("condition", $.expression),
        optional($._expression_list)
      ),

    else_clause: ($) => seq("else", optional($._expression_list)),

    switch_statement: ($) =>
      seq("switch", field("value", $.expression), field("body", $.switch_body)),

    switch_body: ($) =>
      seq(
        repeat($.switch_case),
        optional($.switch_otherwise),
        choice("end", "endswitch")
      ),

    switch_case: ($) =>
      seq("case", field("value", $.expression), optional($._expression_list)),

    switch_otherwise: ($) => seq("otherwise", optional($._expression_list)),

    for_statement: ($) =>
      seq(
        "for",
        field("value", choice($.identifier, $.matrix_pattern)),
        "=",
        $.expression,
        optional($._expression_list),
        choice("end", "endfor")
      ),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.expression),
        optional($._expression_list),
        choice("end", "endwhile")
      ),

    do_statement: ($) =>
      seq(
        "do",
        optional($._expression_list),
        "until",
        field("condition", $.expression)
      ),

    try_statement: ($) =>
      seq(
        "try",
        optional($._expression_list),
        $.catch_clause,
        choice("end", "end_try_catch")
      ),

    catch_clause: ($) =>
      prec(
        1,
        seq(
          "catch",
          field("exception", optional($.identifier)),
          optional($._expression_list)
        )
      ),

    argument_list: ($) =>
      seq("(", optional(commaSep1(choice($.expression, $.colon))), ")"),

    arg_list: ($) =>
      seq(
        "(",
        optional(commaSep1(choice($.identifier, $.tilde, $.colon))),
        ")"
      ),

    //
    // expressions
    //
    expression: ($) =>
      choice(
        $._simple_expression,
        $.assignment_expression,
        $.anonymous_function
      ),

    anonymous_function: ($) => seq("@", $.argument_list, $.expression),

    _simple_expression: ($) =>
      choice(
        $._op_expression,
        $.colon_expression,
        $.member_expression,
        $.index_expression
      ),

    _op_expression: ($) =>
      choice(
        $.primary_expression,
        $.binary_expression,
        $.unary_expression,
        $.call_expression
      ),

    primary_expression: ($) =>
      choice(
        $.identifier,
        $.function_handle,
        $._literal,
        $.matrix,
        $.cell,
        $.parenthesized_expression
      ),

    operator: ($) =>
      choice(
        $._assign_operator,
        $._comparison_operator,
        $._plus_operator,
        $._postfix_operator,
        $._prefix_operator,
        $._times_operator
      ),

    colon_expression: ($) =>
      prec.left(
        PREC.colon,
        seq(
          $._op_expression,
          ":",
          $._op_expression,
          prec.left(optional(seq(":", $._op_expression)))
        )
      ),

    index_expression: ($) =>
      prec(
        PREC.call,
        seq(
          $.identifier,
          "{",
          optional(commaSep1(choice($.expression, $.colon))),
          "}"
        )
      ),

    binary_expression: ($) => {
      const table = [
        [prec.left, $._times_operator, PREC.times],
        [prec.left, $._plus_operator, PREC.plus],
        [prec.left, $._pow_operator, PREC.power],
        [prec.left, $._comparison_operator, PREC.compare],
        [prec.left, "&", PREC.elementwise_or],
        [prec.left, "|", PREC.elementwise_and],
        [prec.left, "&&", PREC.and],
        [prec.left, "||", PREC.or],
      ];

      return choice(
        ...table.map(([fn, operator, precedence]) =>
          fn(
            precedence,
            seq(
              field("left", $.expression),
              alias(operator, $.operator),
              field("right", $.expression)
            )
          )
        )
      );
    },

    unary_expression: ($) =>
      choice(
        prec.left(
          PREC.prefix,
          seq(alias($._prefix_operator, $.operator), $.expression)
        ),
        prec.right(
          PREC.postfix,
          seq($.expression, alias($._postfix_operator, $.operator))
        ),
        prec.left(
          PREC.transpose,
          seq($.expression, alias(token.immediate("'"), $.operator))
        )
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.assign,
        seq(
          field("left", $._left_hand_side),
          alias($._assign_operator, $.operator),
          field("right", $.expression)
        )
      ),

    _left_hand_side: ($) =>
      choice($.pattern, $.member_expression, $.index_expression),

    pattern: ($) => choice($.identifier, $.matrix_pattern, $.member_expression),
    matrix_pattern: ($) => seq("[", $._list, "]"),

    _list: ($) => commaSep1(choice($.identifier, $.tilde)),

    call_expression: ($) =>
      prec(
        PREC.call,
        seq(
          field("function", $.expression),
          field("arguments", $.argument_list)
        )
      ),

    parenthesized_expression: ($) =>
      prec(PREC.parentheses, seq("(", $.expression, ")")),

    member_expression: ($) =>
      prec.left(
        PREC.call,
        seq(
          field("element", $.expression),
          ".",
          field("field", choice($.member_expression, $.primary_expression))
        )
      ),

    matrix: ($) => seq("[", repeat(seq($.expression, optional(";"))), "]"),
    cell: ($) =>
      seq("{", repeat(seq($.expression, optional(choice(",", ";")))), "}"),

    //
    // literals
    //

    _literal: ($) =>
      choice($.string, $.char, $.true, $.false, $.integer, $.float),

    string: ($) =>
      choice(
        seq(
          '"',
          repeat(
            choice(token.immediate(prec(1, /[^\\"\n]+/)), $.escape_sequence)
          ),
          '"'
        )
      ),

    escape_sequence: ($) =>
      token(
        prec(
          1,
          choice(
            '""',
            seq("\\", choice(/x[a-fA-F\d]{2}/, /\d{3}/, /['"0abfnrtv\\]/))
          )
        )
      ),

    char: ($) =>
      choice(
        seq(
          "'",
          repeat(
            choice(
              token.immediate(prec(1, /[^'\n]+/)),
              alias(token(prec(1, "''")), $.escape_sequence)
            )
          ),
          "'"
        )
      ),

    true: ($) => "true",
    false: ($) => "false",

    integer: () => /[0-9]+/,
    float: () => {
      const digits = repeat1(/[0-9]+/);
      const exponent = seq(/[eE][\+-]?/, digits);
      return token(
        seq(
          choice(
            seq(digits, ".", optional(digits), optional(exponent)),
            seq(optional(digits), ".", digits, optional(exponent)),
            seq(digits, exponent)
          )
        )
      );
    },

    function_handle: ($) => seq("@", $.identifier),

    colon: ($) => ":",
    tilde: ($) => "~",

    identifier: ($) => /[a-zA-Z]+[a-zA-Z0-9_]*/,

    comment: ($) => seq(/%|#/, /.*/),

    _assign_operator: ($) =>
      token(
        choice(
          "=",
          "+=",
          "-=",
          "*=",
          "/=",
          "\\=",
          "^=",
          ".*=",
          "./=",
          ".\\=",
          ".^=",
          "|=",
          "&="
        )
      ),

    _comparison_operator: ($) =>
      token(choice("<", "<=", "==", "!=", "~=", ">=", ">")),

    _plus_operator: ($) => token(choice("+", "-")),

    _postfix_operator: ($) => token(choice("++", "--")),
    _prefix_operator: ($) => token(choice("+", "-", "~", "!")),

    _times_operator: ($) => token(seq(optional("."), choice("*", "/", "\\"))),
    _pow_operator: ($) => token(choice(".^", "^")),
  },
});

function commaSep1(rule) {
  return sep1(",", rule);
}

function sep1(separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}
