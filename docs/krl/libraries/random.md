# random

The random library provides a few convenience functions to generate random content

**word**

Returns a random word using node [random-words](https://github.com/punkave/random-words) package. Note that random-words parameters are not supported in KRL.

```javascript
str = random:word()
```

**uuid**

Generates a UUID using node [cuid](https://github.com/ericelliott/cuid) package.

```javascript
str = random:uuid()
```

**integer**

Returns a random integer between `lower` and `upper` (inclusive) using Lodash's [random](https://lodash.com/docs/4.17.4#random). The range bounds can be equal or in any order.

```javascript
n = random:integer(upper = 2, lower = 0)
a = random:integer(5) //returns random integer where 0 <= a <= 5
```

Because `upper` is the first argument, you can call this function with a single argument to get a random integer between `0` and that number.

**number**

Returns a random number (float) between `lower` and `upper` (inclusive) using Lodash's [random](https://lodash.com/docs/4.17.4#random). The range bounds can be equal or in any order.

```javascript
n = random:number(lower = 0, upper = 1)
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1184235) (last edited there 2019-04-04).</small>
