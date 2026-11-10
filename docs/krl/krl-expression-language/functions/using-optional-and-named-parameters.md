# Using Optional and Named Parameters

KRL allows the parameters of functions and user-defined actions to have default values. If the function or action is called without a parameter, that parameter gets its defaults value. Furthermore, arguments can be passed to functions and user-defined actions using named arguments. Arguments are evaluated left to right on execution, so default values for parameters can depend on the values of the parameters to their left. The default value is given by any valid KRL expression.

Here is an example of the function `foo()` with two arguments, `bar` and `baz`. You can see that each has been given a default value:

```javascript
foo = function(bar = 2, baz = bar + 3){
    bar + baz
}
```

This function could be called in several ways:

```javascript
a = foo() // a has the value 7
a = foo(5) // a has the value 13 because bar gets the value 5 and baz gets its default value
a = foo(5, 6) // a has the value 11 since bar gets the value 5 and baz gets the 6
a = foo(baz = 6) // a has the value 8 since bar get its default value 2 and baz get the value 6
a = foo(bar = 5) // a has the value 13 because bar gets the value 5 and baz gets its default value
a = foo(bar = 5, baz = 6) // a has the value 11 since bar gets the value 5 and baz gets the 6
a = foo(baz = 6, bar = 5) // a has the value 11 since bar gets the value 5 and baz gets the 6
```

The same syntax is used in user-defined action with the same effect on parameter values.

Default values are optional. A parameter without a default value is considered to be required and will be undefined if no value is passed to the parameter.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/186515457) (last edited there 2018-01-10).</small>
