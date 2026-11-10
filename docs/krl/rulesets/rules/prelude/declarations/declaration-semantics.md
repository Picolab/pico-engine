# Declaration Semantics

KRL declarations are not variable assignments. And KRL uses static binding semantics. As a result you may be surprised if you redeclare a specific variable.

For example, consider the following declarations:

```javascript
pre {
  x = 3;
  y = function(a){x + a};
  z = {"foo": 3}
}
```

Internally, this declaration block produces the following environment:

![](/krl/_media/216891402-image2018-2-9_13-59-16.png)

When we make a function call like `y(6)`, the result will be 9 because `x` is defined globally, from `y`'s perspective.

Now supposed we have a block that redeclares x to be 5.

```javascript
pre {
  x = 3;
  y = function(a){x + a};
  z = {"foo": 3}
  x = 5;
}
```

The resulting environment looks like this:

![](/krl/_media/216891402-image2018-2-9_13-59-32.png)

Note that the first `x` is still there. Code referencing `x` in this environment will start looking for `x` from the bottom and see 5 since that declaration shadows the first.

But, when we call `y(6)`, the result will still be 9 not 11 because the function sees the environment from it's perspective and so `x` is still 3.

This is not how a language with assignment would behave. Instead of rebinding x to 5, such a language would update the original x through assignment and when `y(6)` executes, the result would be 11.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/216891402) (last edited there 2018-02-09).</small>
