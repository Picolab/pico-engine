# Array Operators

The following operators are valid for arrays. Note: in addition to these operators, there is a [membership infix operator that works on arrays and maps](https://picolabs.atlassian.net/wiki/display/docs/Predicate+Expressions#PredicateExpressions-Membership), and there are also [Set Operators](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1183114/Set+Operators), which are extremely useful when comparing & inspecting arrays.

## `all()`

The `all()` operator takes a function as its sole argument. `All()` returns a true value if the function returns true for every item in the target array or if the target array is empty.

For example

```javascript
a = [3, 4, 5];
a.all(function(x){x < 10});  // returns true
a.all(function(x){x > 3});   // returns false
a.all(function(x){x > 10});  // returns false
```

## `any()`

The `any()` operator takes a function as its sole argument. `Any()` returns a true value if the function returns true for at least one item in the target array.

For example

```javascript
a = [3, 4, 5];
a.any(function(x){x < 10});  // returns true
a.any(function(x){x > 3});   // returns true
a.any(function(x){x > 10});  // returns false
```

## `append()`

The `append()` operator combines two arrays into a single array containing all elements belonging to the original arrays. For example:

```javascript
first_array.append(second_array)
```

If either the object or the argument is not an array, it will be wrapped in an array.

The following examples show the behavior of `append()` for various types of objects:

```javascript
a_s = ["apple","tomato"];
b_s = ["carrot","tomato"];
a = 10;
b = 11;
a_s.append(b_s) // returns ["apple","tomato","carrot","tomato"]
a_s.append(a) // returns ["apple","tomato",10]
a.append(b) // returns [10, 11]
```

## collect()

The collect() operator takes a function as its only argument and returns a map. The function should take a single argument and return a literal. The function should be thought of as a categorization function. It is applied to each member of the array in turn and the result is used as a collection key to group the members of the array into lists whose members all yield the same result.

```javascript
f = [7,4,3,5,2,1,6];
f.collect(function(a){(a < 5) => "x" | "y"})
//returns {'x' : [4,3,2,1],
//         'y' : [7,5,6]}
f.collect(function(a){(a % 2) => "odd" | "even"})
//returns {'even' : [4,2,6],
//         'odd' : [7,3,5,1]}

employees = [{"name" : "Ron", "dept": "marketing"},
             {"name" : "Steve", "dept" : "executive"},
             {"name": "Mark", "dept": "engr"},
             ...
            ];
employees_by_dept = employees.collect(function(a){a{"dept"}});
```

## `filter()`

The `filter()` operator takes a function as its only argument and returns an array. The new array contains any members of the original array for which the function evaluates to true. The function given as the argument must take one argument and return a Boolean value. The length of the new array will be less than or equal to the length of the original array. For example:

```javascript
a = [3, 4, 5];
c = a.filter(function(x){x<5}) // c = [3, 4]
```

## `head()`

The `head()` operator returns the first member of an array as a single value, or `null` if the array is empty.

```javascript
c = [3, 4, 5];
b = c.head() // b = 3
```

## index()

The index() operator returns the index in the array of the first item that matches its argument

```javascript
c = [3, 4, 5];
x = c.index(5); // x = 2
```

The types of matched values must be num, str, or bool. The operator does not match other types of values.

Returns -1 if no such item could be found.

## `join()`

The `join()` operator takes a string as its sole argument. The original array is joined into a single string with the argument placed between the array elements. If the argument is omitted, the default separator is ','. For example:

```javascript
a = ["A","B","C"];
c = a.join(";"); // c = "A;B;C"
```

## `length()`

The length() operator returns a number that is the length of the array. Note that because arrays use zero-based indexing, the length is the one greater than the index value of the last element in the array. For example:

```javascript
a = ["A","B","C"];
c = a.length(); // c = 3
```

## `map()`

The `map()` operator returns an array that contains the results of applying the function given as the operator's argument to each member of the original array. The function given as an argument must take one argument. The length of the resulting array will be equal to the length of the target array. For example:

```javascript
a = [3, 4, 5];
c = a.map(function(x) {x+2}) // c = [5, 6, 7]
```

## `none()`

The `none()` operator takes a function as its sole argument. `None()` returns a true value if the function returns false for every item in the target array or if the target array is empty. `None()` is the logical negation of `any()`.

For example

```javascript
a = [3, 4, 5];
a.none(function(x){x < 10});  // returns false
a.none(function(x){x > 3});   // returns false
a.none(function(x){x > 10});  // returns true
```

## `notall()`

The `notall()` operator takes a function as it's sole argument. `Notall()` returns a true value if the function returns false for at least one item in the target array. This is the logical inverse of `all()`.

For example

```javascript
a = [3, 4, 5];
a.notall(function(x){x < 10});  // returns false
a.notall(function(x){x > 3});   // returns true
a.notall(function(x){x > 10});  // returns true
```

## `pairwise()`

The `pairwise()` operator is applied to an array of two arrays and takes a two-argument function as it's sole argument. `Pairwise()` returns a new array that is the result of applying the function to each of the members of the two arrays in the target array pairwise.

For example

```javascript
a = [3, 4, 5];
b = [6, 7, 8];
[a, b].pairwise(function(x, y){x + y});  // returns [9, 11, 13]
```

## `reduce()`

The `reduce()` operator applies a function, given as its first argument, to members of an array in left associative order. An optional second argument to the operator is the default value for the reduction.

If the default value is not supplied, `reduce()` returns the result of applying function to the first 2 items in the array, then applying the function to that result and the 3rd item, etc. If the array contains no items, 0 is returned. If the array has only one item, the item is returned.

If the default value is supplied, `reduce()` returns the result of applying function to the default value and the first item in the array, then applying the function to that result and the 2nd item, etc. If array contains no items, `reduce()` returns the default value.

The function (supplied to the `reduce()` operator as its first argument) should take at least two arguments. The first argument accumulates the result, starting with the second operator argument, if any, as described above. The function's second argument is each element, in turn, of the array upon which `reduce` is operating. There is also a third argument, which is the current index in the array, and a fourth argument, which is the entire array.

```javascript
c = [4, 5, 6];
c.reduce(function(a,b){a + b})     // returns 15
c.reduce(function(a,b){a + b}, 10) // returns 25
c.reduce(function(a,b){a - b})     // returns -7; note left associativity

d = [];
d.reduce(function(a,b){a + b})     // returns 0
d.reduce(function(a,b){a + b}, 15) // returns 15

m = [76];
m.reduce(function(a,b){a + b})     // returns 76
m.reduce(function(a,b){a + b}, 15) // returns 91
```

When using reduce() with arrays that contain values whose type differs from the return type of the function, the first argument to the function should have the same type as the returned value, and you must supply a default value that has the same type as the return value of the function.  For example:

```javascript
j = [{"a" : 4, "b" : 6},
     {"a" : 7, "f" : 8},
     {"a" : 1, "d" : 9}];
j.reduce(function(a,b){a * b{"a"}}, 1) // returns 28
```

## `reverse()`

The reverse() operator reverses the order of the array.

```javascript
c = [4,5,6];
c.reverse() // returns [6,5,4]
```

## `slice()`

The `slice()` operator creates a new array based on the beginning and end indices passed as arguments:

- Array indices are zero-based.
- The default for the beginning index is 0. `slice(j)` is the same as `slice(0,j)`
- A reference to an OOB index (less than 0 or greater than the size of the array - 1) will return an empty array `[]`

For example:

```javascript
a = ["corn","tomato","tomato","tomato","sprouts","lettuce","sprouts"];

c = a.slice(1,4);                   // c = ["tomato","tomato","tomato","sprouts"]
d = a.slice(2);                		// d = ["corn","tomato","tomato"]
g = a.slice(14)                		// g = []
h = a.slice(0,0);                	// h = ["corn"]
```

## `splice()`

The `splice()` operator creates a new array that is the result of deleting, inserting, or replacing elements in the target array. The operators takes the following arguments:

- the zero-based index of where to start the splice
- the number of elements to remove at the location given by the first argument
- an optional value to be spliced in the array at the location given by the first argument

The following example shows elements being removed from an array:

```javascript
a = ["corn","tomato","tomato","tomato","sprouts","lettuce","sprouts"];

c = a.splice(1,4); // c = ["corn","lettuce","sprouts"]
```

If the optional third argument is included it will be inserted. If the argument is an array, the elements of the array will all be inserted.

```javascript
a = ["corn","tomato","sprouts","lettuce","sprouts"];
b = ["corn","tomato"];

c = a.splice(2, 0, b); // c = ["corn","tomato","corn","tomato","sprouts","lettuce","sprouts"]
```

If the third argument is not an array, its value will be inserted.

```javascript
a = ["corn","tomato","sprouts","lettuce","sprouts"];

c = a.splice(2, 0, "liver"); // c = ["corn","tomato","liver","sprouts","lettuce","sprouts"]
```

In the preceding examples, we've been removing zero elements (i.e. simply inserting). If the second argument is non-zero, then that many elements will be removed before the elements of the third argument are inserted at the location where the elements were removed:

```javascript
a = ["corn","tomato","sprouts","lettuce","sprouts"];

c = a.splice(2, 2, "liver"); // c = ["corn","tomato","liver","sprouts"]
```

If the second argument is larger than the remaining elements in the array, the array will be truncated at the location given by the first parameter:

```javascript
a = ["corn","tomato","tomato","tomato","sprouts","lettuce","sprouts"];

c = a.splice(1,10); // c = ["corn"]
```

## `sort()`

The `sort()` operator takes an optional argument and returns an array that is the original array sorted according to the following criteria:

- If the argument is empty or the string "`default"`, the array will be sorted in ascending order using the [`cmp` operator](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189570/Predicate+Expressions#PredicateExpressions-Comparison).
- If the argument is the string "`reverse"`, the array will be sorted in descending order using the `cmp` operator.
- If the argument is the string "`numeric"`, the array will be sorted in ascending order using the [`<=>` operator](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189570/Predicate+Expressions#PredicateExpressions-Comparison).
- If the argument is the string "`ciremun"` ("numeric" backwards), the array will be sorted in descending order using the `<=>` operator.
- If the argument is a function, the function will be used to perform pair-wise comparisons of the members of the array for purposes of doing the sort. The function must take two arguments and return -1, 0, or 1 depending on whether the first argument is less than, equal to, or greater than the second.

Note that because the default behavior is to do a string comparison, number sorts can give unexpected results, as shown in the first example.

For example:

```javascript
a = [5, 3, 4, 1, 12]
c = a.sort();                         // c = [1, 12, 3, 4, 5]
d = a.sort("reverse");                // d = [5, 4, 3, 12, 1]
g = a.sort("numeric");                // d = [1, 3, 4, 5, 12]
h = a.sort("ciremun");                // d = [12, 5, 4, 3, 1]
e = a.sort(function(a, b) { a < b  => -1 |
                            a == b =>  0 |
                                       1
                          }); // e = [1, 3, 4, 5, 12]
f = a.sort(function(a, b) {a <=> b}; // f == [1, 3, 4, 5, 12]
```

## `tail()`

The `tail()` operator returns a new array that is the original array with the first element removed, or an empty array if the original array is empty. For example:

```javascript
a = [3, 4, 5];
c = a.tail(); // c = [4, 5]
```

## Note

This note is for the operators which expect a function as their argument: `all`, `any`, `collect`, `filter`, `map`, `none`, and `notall`. The function provided is called once for each element of the target array, in order, and actually has *three* arguments passed to it: first, the array element, second, the current index in the array, and third, the entire target array. The last two are rarely if ever needed, but are available for those rare cases. Ordinarily, only the first argument, the array element, is needed.

For example, suppose you needed to know if any element in an array was less than its index in the array.

```
a = [ 15, 7, 3, 1 ]
b = a.any(function(e,i){e < i}) // b == true because the element at index 3 (1) is less than 3
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189592) (last edited there 2020-03-17).</small>
