# Functions

KRL supports functions as first-class objects. KRL supports only anonymous functions, but they can be given names by binding them to a variable in a declaration. Here's an example:

```javascript
add5 = function(x) {
         x + 5
       };
```

Functions are declared using the keyword `function` followed by a possibly empty, parentheses-delimited, comma-separated list of parameters and a block of code.

The parameters are a possibly empty, comma-separated list of variable names. All parameters can be assigned a default value.  More details can be found in [Using Optional and Named Parameters](https://picolabs.atlassian.net/wiki/spaces/docs/pages/186515457/Using+Optional+and+Named+Parameters).

The code block of the function is delimited by curly braces and contains a list of semicolon-separated declarations and a single expression. The declarations are optional, but every function code block must end with an expression. The value of the final expression is the return value of the function.

Functions are statically executed (i.e., free variables are bound in the environment in which they are defined, not the environment in which they are executed) and can be recursive. KRE limits the number of times a function can be called in any given ruleset evaluation to protect against runaway code. The value of the recursion threshold is installation specific. Here's an example of a recursive function in KRL:

```javascript
fact = function(n) {
         (n <= 0) => 1
                   | n * fact(n-1)
       }
```

This example also shows the syntax for function application (e.g., `fact(n-1)`). An expression resulting in a function is followed by a possibly empty, parentheses-delimited, comma-separated list of expressions. Function application is applicative-order; the expressions representing the function and the arguments are evaluated and the result of executing the function expression (the operator, or rator) is then applied to the results of the evaluation of the arguments (the operands, or rands). Obviously, the operator must be a function.

To see how declarations appear in the body of a function, consider the following example, which uses Newton's method to calculate square roots (Adapted from [section 1.1.8 of *Structure and Interpretation of Computer Programs*](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-10.html#%_sec_1.1.8).):

```javascript
sqrt = function(x) {
  average = function(x,y) { (x + y) / 2 };
  good_enough = function(guess, x) {
                  v = (guess * guess) - x;
                  v < 0.01 && v > -0.01
                };
  improve = function(guess, x) {
              average(guess, (x / guess))
            };
  sqrt_iter = function(guess, x) {
                good_enough(guess, x) => guess
                                       | sqrt_iter(improve(guess,x), x)
              };
  sqrt_iter(1.0, x)
}
```

Functions can return functions as values and can be passed as arguments to other functions and operators in KRL. The following example defines a generalized summation function called `sum` that sums the numbers from `a` to `b,` incrementing using the function `inc` and applying the function `f` to each term:

```javascript
sum = function(f, a, inc, b) {
  (a > b) => 0
           | f(a) + sum(f, inc(a), inc, b)
};
```

You can use sum to define a function that sums the cubes from a to b:

```javascript
plus1 = function(x) { x + 1 };
cube = function(x) { x * x * x };
sum_cubes = function(a, b) { sum(cube, a, plus1, b) }
```

As another example, you can define a function that creates incrementor functions. When given a number, it returns a function that increments by that value:

```javascript
inc_gen = function(x) { function(){ x + n } };
```

Now you use `inc_gen` to generate other functions:

```javascript
plus1 = inc_gen(1);
plus25 = inc_gen(25);
```

Functions can also be applied using the dot (.) operator syntax sugar. The left hand of the period (.) is inserted as the first argument of the function call.  This is useful when you want to chain together many operations. For example:

```javascript
foo = function (self, arg1, arg2) {
  // `self` is the left hand side of `.`
}

// then use it
"something".foo(1, 2)
// which is the same as
foo("something", 1, 2)

// Another example:
a.split(re#;#).length()
// is the same as
length(split(a, re#;#))

// Instead of this
length(split(lc(a), re#;#));
// use . operator to chain them together
a.lc()
 .split(re#;#)
 .length();
```

- [Using Optional and Named Parameters](/krl/krl-expression-language/functions/using-optional-and-named-parameters)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189579) (last edited there 2018-11-30).</small>
