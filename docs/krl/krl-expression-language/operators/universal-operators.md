# Universal Operators

Several operators can be applied to objects of any type.

## `as()`

The `as()` operators coerces objects of one type to be an object of another. The target type is given as a string argument to the operator. The following types are available:

- "Boolean"
- "Number"
- "RegExp"
- "String"
- "Hex"

The following coercions are valid:

- Strings can be coerced to numbers (integers or reals) and regular expressions. If the string is not parsable as a number, the result is `null.`The empty string parses as 0.
- Numbers can be coerced to strings.
- Regular expressions can be coerced to strings.
- Any expression can be coerced to Boolean.
- `null` and false can be coerced to 0, and `true` can be coerced to `1`
- Hex values must match the regex `/^[A-F0-9]+$/`

An error is thrown for other attempted coercions, unless the value being coerced by **`as()`** is already of the target type.

For example, the following constructs a string and then turns it into a regular expression that can be used by the replace() operator:

```javascript
("re#q=" + q + "#i").as("RegExp")
```

## `defaultsTo()`

The `defaultsTo()` operator returns the value of its first argument if the object is null. The second argument is a string and is optional. If present, it is written in the log if the object is null.

```javascript
doesnotexist.defaultsTo(x);  // returns the value of x
doesnotexist.defaultsTo([]); // returns the empty array
doesnotexist.defaultsTo([], "doesnotexist was null"); // returns the empty array and writes a message to log
```

The operator is most often used to guard against null values.

## `encode()`

The `encode()` operator returns a string containing the JSON representation of the data structure to which it is applied. For example:

|  |
| --- |
| `a = {``"a"` `: 10,``"b"` `: [1, 3,``"hello"``]};` `b = a.encode()``// b = "{\"a\" : 10, \"b\" : [1, 3, \"hello\"]}";` |

The `encode()` operator takes an optional positive integer argument specifying that the object should be pretty printed (if it contains or is a map or array) with newlines and indents with that number of spaces.

## `isnull()`

The `isnull()` operator returns true of the object is null (undefined) and false otherwise.

```javascript
doesnotexist.isnull(); // returns true
```

## `klog()`

The `klog()` operator writes an optional message, given as a string argument, and the value of the object to the debug log.

```javascript
x = some_arr.filter(function(x){x == 5}).klog("Value after filter: ").head();
```

## `typeof()`

The `typeof()`operator returns the type of the object to which it is applied. The return value is one of the strings that may be passed to `as()`, or one of the other following values:

- "Array"
- "Map"
- "Null"
- "Hex"

For example:

```javascript
nums = [1, 2, 3]
nums_type = nums.typeof() // nums_type = "Array"
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189580) (last edited there 2023-01-18).</small>
