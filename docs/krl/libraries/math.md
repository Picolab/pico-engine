# math

The `math` library provides a number of useful math functions as well as special functions for Base64, and hashing and digests. More are added as needed. To make your own contributions, see the page [Pico Engine welcoming your contributions](https://picolabs.atlassian.net/wiki/display/docs/Pico+Engine+welcoming+your+contributions) for step-by-step guidance.

## General Functions

### absolute value

`abs(<num>)` - absolute value of &lt;num>

```

     n = math:abs(-12);     // n = 12
```

### ceiling

`ceiling(<num>)` - the smallest integer not less than &lt;num>

```javascript
n = math:ceiling(2.78);    // n = 3
```

### floor

floor(&lt;num>) - the largest integer not greater than &lt;num>

```javascript
n = math:floor(2.78);    // n = 2
```

### int

`int(<num>)` - the integer value of &lt;num>

```

     n = math:int(2.999);     // n = 2
```

Only numbers are valid arguments to `int`. To coerce a string, use the [Universal operator as()](/krl/krl-expression-language/operators/universal-operators).

### random

To obtain a random number, please use a function from the [random library](/krl/libraries/random)

### round

`round(<num>)` - convert `<num>` to the nearest integer.

```
n = math:round(2.1);    // n = 2
m = math:round(2.7);    // m = 3
```

`round` can take an optional second argument, the number of decimal places, which extends to negative values in an intuitive way.

```
math:round(4066.123,2)   // 4066.12
math:round(4066.123,0)   // 4066
math:round(4066.123,-2)  // 4100
```

## Base64 Functions

### `math:base64encode(str,` `[encoding])`

Given a string, **str** of type **[encoding]**, return the base64 string. If the encoding is omitted, it defaults to utf8.

```javascript
math:base64encode(payload,"hex")
```

### `math:base64decode(str,[encoding])`

Decode the given base64 string, **str**returning a value with a type of [ encoding ] . If the encoding is omitted, it defaults to utf8.

```javascript
math:base64decode(payload,"hex")
```

## Hashing and Digest Functions

### math:hashAlgorithms

An array of available hash algorithm names (strings)

```
 math:hashAlgorithms.klog() // ["sha256", "sha512", "DSA", ...]
```

### math:hash(algorithm, str [, encoding])

Return the hash for the **str** using the given **algorithm**. Optionally specify the **encoding** "hex" (default) and "base64"

```
 math:hash("sha256", "hello") // "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
 math:hash("sha256", "hello", "base64") // "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ="
```

### math:hmac(algorithm, key, message [, encoding])

Return an hmac string of **message** from the given hash **algorithm** and secret **key**. Optionally specify the **encoding** "hex" (default) and "base64"

```
 math:hmac("sha256", "a secret", "some message") // "86de43245b44531ac38b6a6a691996287d932a8dea03bc69b193b90caf48ff53"
 math:hmac("sha256", "a secret", "some message", "base64") // "ht5DJFtEUxrDi2pqaRmWKH2TKo3qA7xpsZO5DK9I/1M="
```

## Planned but not yet implemented

> **Engine Compatibility:**
>
> Everything after this note is not supported at this time.

### exponent

`exp(<num>)` - return e (natural logrithm) raised to the &lt;num>th power

```
      n = math:exp(2);
```

### logarithm

`log(<num>)` - natural log of &lt;num>

```
 n = math:log(2);
```

### square root

`sqrt(<num>)` - square root of &lt;num>

```
n = math:sqrt(2);
```

### power

`power(<num1>,<num1>)` - &lt;num1> to the &lt;num2>th power.

```javascript
 n = math:power(2,3);    //  n = 8
```

## Other possibilities

See the page [(Classic) math](https://picolabs.atlassian.net/wiki/display/docs/%28Classic%29+math) from the classic KRE.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189594) (last edited there 2023-01-18).</small>
