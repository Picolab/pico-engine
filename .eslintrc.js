var _ = require("lodash");
var ast_nodes = require("espree/lib/ast-node-types");
ast_nodes = _.uniq(_.keys(ast_nodes).concat(_.values(ast_nodes)));

var allowed_ast_nodes = [
    "Program",
    "BlockStatement",
    "ExpressionStatement",
    "Identifier",
    "Literal",
    "MemberExpression",
    "Property",
    "ObjectExpression",
    "ArrayExpression",
    "VariableDeclaration",
    "VariableDeclarator",
    "AssignmentExpression",
    "UpdateExpression",

    "FunctionExpression",
    "FunctionDeclaration",
    "ReturnStatement",
    "CallExpression",
    "YieldExpression",

    "TryStatement",
    "CatchClause",
    "ThrowStatement",
    "NewExpression",

    "BinaryExpression",
    "LogicalExpression",
    "UnaryExpression",

    "ConditionalExpression",
    "IfStatement",

    "ForStatement",
    "ForInStatement",
    "WhileStatement",
    "DoWhileStatement",
    "BreakStatement",
    "ContinueStatement",

    "SwitchStatement",
    "SwitchCase",
];

var ast_node_blacklist = _.difference(ast_nodes, allowed_ast_nodes);
ast_node_blacklist.push("VariableDeclaration[kind=let]");
ast_node_blacklist.push("VariableDeclaration[kind=const]");

module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "es6": true,//only for generator functions since the compiler uses them to make KRL sync-looking code
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent":  ["error", 4],
        "no-console": "off",
        "quotes": ["error", "double"],
        "no-trailing-spaces": "error",
        "eqeqeq": "error",
        "linebreak-style": [
            "error",
            "unix",
        ],
        "semi": [
            "error",
            "always",
        ],
        "no-unused-vars": [
            "error",
            {
                vars: "all",
                args: "none",//unused arguments can provide good documentation about what is available
            }
        ],
        "no-multi-str": "error",
        "radix": "error",
        "require-yield": "off",
        "no-restricted-syntax": ["error"].concat(ast_node_blacklist),
    },
};
