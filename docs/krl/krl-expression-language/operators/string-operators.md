# String Operators

The following operators are valid for strings.

## `capitalize()`

The capitalize() operator capitalizes the first character in the target string.

```javascript
a = "heat";
b = a.capitalize(); // b = "Heat"
```

## `decode()`

The `decode()` operator converts a JSON string into the equivalent KRL data structure. For example:

```javascript
a = "[3, 4, 5]";
c = a.decode(); // c = [3, 4, 5]
```

Note that if the content in the target is not valid JSON, or if the target is not a string, `decode()` returns the target unchanged without warning. [JSON Lint](http://jsonlint.com/) is your friend.

## `extract()`

The `extract()` operator matches the string using a regular expression given as the sole argument and returns the specified capture groups as an array. For example:

```javascript
foo = "I like cheese";
my_str = "This is a string";
a = my_str.extract(re#(is)#) // a = ["is"]
b = my_str.extract(re#(s.+).*(.ing)#) // b = ["s is a st","ring"]
c = my_str.extract(re#(boot)#) // c = []
d = foo.extract(re#like (\w+)#) // d = ["cheese"]
e = foo.extract(re#(e)#g) // e = ["e","e","e","e"]
```

Note that if the regular expression does not contain at least one capture group, the resulting array will be empty.

## `lc()`

The `lc()` operator returns the lowercase version of the original string. For example:

```javascript
a = "Hello World";
c = a.lc() // c = "hello world"
```

## `length()`

The length() operator returns the number of characters in the string. For example:

```javascript
a = "ABC";
c = a.length(); // c = 3
```

## `match()`

The `match()` operator takes a regular expression as its argument. The result is true if the regular expression matches the string and false otherwise. For example:

```javascript
my_str = "This is a string";
a = my_str.match(re#is#) // a = true
b = my_str.match(re#mouse#) // b = false
```

## ord()

The ord`()` operator returns a numeric ASCII value of the first character in the string on which it operates.  For example:

```javascript
a = "K".ord(); // a: 75
b = "Kite".ord(); // b: 75
c = "Kite".split(re##).map(function(x){x.ord()}); // c: [75,105,116,101]
d = "K".ord().chr() == "K" // d: true
```

The inverse of ord`()` is `chr()`.

## `replace()`

The `replace()` operator takes two arguments: a regular expression and a string. The returned string is the original string with any match of the regular expression replaced by the second argument. You can use any captured values in the second, substitute string by naming them with `$1`, `$2`, and so on. The first captured value will be substituted for `$1`, the second for `$2`, and so on. For example:

```javascript
my_str = "This is a string";
my_url = "http://www.amazon.com/gp/products/123456789/";
a = my_str.replace(re#is#,"ese");                            // a = "These is a string"
b = my_str.replace(re#is#g,"ese");                           // b = "These ese a string"
c = my_str.replace(re#this#,"That");                         // c = "This is a string" (no change)
d = my_str.replace(re#this#i,"That");                        // d = "That is a string"
e = my_url.replace(re#^http://(\[A-Za-z0-9.-\]+)/.*#,"$1");  // e = "www.amazon.com"
```

Refer to the [full table](https://www.ecma-international.org/ecma-262/5.1/#sec-15.5.4.11) for other replacement symbols.

In the final example, I was careful to ensure that the regular expression matched the entire URL, so that the substitution of `$1` resulted in just the domain name. This same result could be more easily achieved using `extract()`—although the result, e, would be an array:

```javascript
e = my_url.extract(re#^http://(\[A-Za-z0-9.-\]+)/#); // e = [ "www.amazon.com" ]
```

As of version 0.45.5, the second argument to the `replace()` operator can be a function. When a match is found, this function will be called to determine the replacement string. It will be given, as its arguments, the string that matched, the capture groups in order, the index of the start of the match in the overall string (upon which `replace` is operating), and finally the overall string itself. For example:

```
"one 1 two 2 three 3".replace(re#([a-z]+) ([0-9])#g, match_function)
```

Because the regular expression has the global flag (`g`), the expression will match in three places and the `match_function` will be called *three times*. The arguments for each of the three calls are shown here:

```
"one 1", "one", "1", 0, "one 1 two 2 three 3"
"two 2", "two", "2", 6, "one 1 two 2 three 3"
"three 3", "three", "3", 12, "one 1 two 2 three 3"
```

## `split()`

The `split()` operator takes a regular expression as its sole argument. The regular expression is used to split the original string into an array. For example:

```javascript
a = "A;B;C"
c = a.split(re#;#) // c = ["A","B","C"]
```

## `sprintf()`

The `sprintf()` operator can be applied to either a number or a string. The operator takes a formatting string as its sole argument. Use \`%s` to escape a literal `%s`:

```javascript
a = "Hello world!"
b = a.sprintf("<%s \%s>") // b = "<Hello world! %s>"
```

## `substr()`

The `substr()` operator returns a substring of the target string. The operator takes an argument that gives an offset from the start of the string to begin returning the substring and an optional length that gives the desired length of the substring. If the length is omitted, the substring to the end of the original string from the offset will be returned. If the length is negative, the length will be calculated from the end of the string. For example:

```javascript
my_str = "This is a string";
my_str.substr(5);     // returns "is a string"
my_str.substr(5, 4);  // returns "is a"
my_str.substr(5, -5); // returns "is a s"
my_str.substr(25);    // returns null
```

## `uc()`

The `uc()` operator returns the uppercase version of the original string. For example:

```javascript
a = "Hello World";
c = a.uc() // c = "HELLO WORLD"
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189595) (last edited there 2023-01-18).</small>
