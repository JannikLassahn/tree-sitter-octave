// from https://de.mathworks.com/help/matlab/matlab_prog/operator-precedence.html
const PREC = {
  or: 1,
  and: 2,
  elementwise_or: 3,
  elementwise_and: 4,
  compare: 5,
  colon: 6,
  plus: 7,
  times: 8,
  unary: 9,
  power: 10,
  transpose: 11,
  plusplus: 12,
  parentheses: 13,
  call: 20,
  dot: 21,
};

module.exports = grammar({
  name: "octave",

  extras: ($) => [$.comment, /\s/],

  supertypes: ($) => [
    $.declaration,
    $._compound_statement,
    $.expression,
    $.primary_expression,
    $.pattern,
  ],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.primary_expression, $.pattern],
    [$.primary_expression, $.matrix_pattern],
    [$.matrix, $.matrix_pattern],
  ],

  inline: ($) => [$._left_hand_side],

  rules: {
    source_file: ($) => repeat($._statement),

    //
    // declarations
    //
    declaration: ($) => choice($.function_declaration, $.global_declaration),

    global_declaration: ($) => seq("global", prec.left(repeat1($.identifier))),

    function_declaration: ($) =>
      seq(
        "function",
        optional(seq($.function_return, "=")),
        field("name", $.identifier),
        field("parameters", optional($.parameters)),
        field("body", optional($.block)),
        choice("end", "endfunction")
      ),

    function_return: ($) =>
      choice(
        $.identifier,
        seq("[", seq(commaSep1($.identifier), optional(",")), "]")
      ),

    parameters: ($) =>
      prec.left(
        100,
        seq("(", optional(seq(commaSep1($.identifier), optional(","))), ")")
      ),

    block: ($) => prec.left(repeat1($._statement)),

    //
    // statements
    //

    _statement: ($) =>
      choice($.declaration, $._simple_statements, $._compound_statement),

    _simple_statements: ($) =>
      seq(
        seq($._simple_statement, repeat(seq(";", $._simple_statement))),
        optional(";"),
        "\n"
      ),

    _simple_statement: ($) =>
      choice($.expression_statement, $.return_statement),

    expression_statement: ($) =>
      choice($.expression, $.assignment, $.augmented_assignment),

    return_statement: ($) => "return",

    _compound_statement: ($) => choice($.if_statement),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        optional(field("consequence", $._statement)),
        repeat(field("alternative", $.elseif_clause)),
        optional(field("alternative", $.else_clause)),
        choice("end", "endif")
      ),

    elseif_clause: ($) =>
      seq(
        "elseif",
        field("condition", $.expression),
        optional(field("consequence", $._statement))
      ),

    else_clause: ($) =>
      seq("else", optional(field("consequence", $._statement))),

    argument_list: ($) => seq("(", optional(commaSep1($.expression)), ")"),

    //
    // expressions
    //
    expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.comparison_operator,
        $.primary_expression,
        $.update_expression
      ),

    primary_expression: ($) =>
      choice(
        $.identifier,
        $._literal,
        $.matrix,
        $.cell,
        $.call_expression,
        $.parenthesized_expression,
        $.elementaccess_expression,
        $.member_expression
      ),

    binary_expression: ($) => {
      const table = [
        [prec.left, "+", PREC.plus],
        [prec.left, "-", PREC.plus],
        [prec.left, "*", PREC.times],
        [prec.left, "/", PREC.times],
        [prec.left, "|", PREC.elementwise_or],
        [prec.left, "&", PREC.elementwise_and],
      ];

      return choice(
        ...table.map(([fn, operator, precedence]) =>
          fn(
            precedence,
            seq(
              field("left", $.primary_expression),
              field("operator", operator),
              field("right", $.primary_expression)
            )
          )
        )
      );
    },

    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          field("operator", choice("+", "-", "~", "!")),
          field("argument", $.primary_expression)
        )
      ),

    update_expression: ($) =>
      prec.left(
        PREC.plusplus,
        choice(
          seq(
            field("argument", $.expression),
            field("operator", choice("++", "--"))
          ),
          seq(
            field("operator", choice("++", "--")),
            field("argument", $.expression)
          )
        )
      ),

    comparison_operator: ($) =>
      prec.left(
        PREC.compare,
        seq(
          $.primary_expression,
          repeat1(
            seq(
              field("operators", choice("<", "<=", "==", ">=", ">")),
              $.primary_expression
            )
          )
        )
      ),

    assignment: ($) =>
      seq(
        field("left", $._left_hand_side),
        "=",
        field("right", $._right_hand_side)
      ),

    augmented_assignment: ($) =>
      seq(
        field("left", $._left_hand_side),
        field("operator", choice("+=", "-=", "*=", "/=")),
        field("right", $._right_hand_side)
      ),

    _left_hand_side: ($) => choice($.pattern),
    _right_hand_side: ($) => choice($.expression),

    pattern: ($) => choice($.identifier, $.matrix_pattern, $.member_expression),
    matrix_pattern: ($) => seq("[", commaSep1($.identifier), "]"),

    call_expression: ($) =>
      prec(
        PREC.call,
        seq(
          field("function", $.primary_expression),
          field("arguments", $.argument_list)
        )
      ),

    parenthesized_expression: ($) =>
      prec(PREC.parentheses, seq("(", $.expression, ")")),

    elementaccess_expression: ($) =>
      prec.left(
        PREC.parentheses,
        seq(
          field("element", $.primary_expression),
          "{",
          field("index", $.expression),
          "}"
        )
      ),

    member_expression: ($) =>
      prec(
        PREC.dot,
        seq(
          field("element", $.primary_expression),
          ".",
          field("field", $.identifier)
        )
      ),

    matrix: ($) => seq("[", repeat(seq($.expression, optional(";"))), "]"),
    cell: ($) =>
      seq("{", repeat(seq($.expression, optional(choice(",", ";")))), "}"),

    //
    // literals
    //

    _literal: ($) => choice($.string, $.true, $.false, $.integer, $.float),

    string: ($) =>
      choice(
        seq(
          "'",
          repeat(
            choice(token.immediate(prec(1, /[^'\n]+/)), $.escape_sequence)
          ),
          "'"
        )
      ),

    escape_sequence: ($) => token(prec(1, /''/)),

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

    identifier: ($) => /[a-zA-Z]+[a-zA-Z0-9_]*/,

    comment: ($) => seq(/%|#/, /.*/),
  },
});

function commaSep1(rule) {
  return sep1(",", rule);
}

function sep1(separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}
