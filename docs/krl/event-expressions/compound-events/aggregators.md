# Aggregators

For the count and repeat operators, you sometimes want to aggregate values from the enclosed subexpression. The following clauses can be used to accumulate values:

**`E max(<var>)`.** Accumulate the maximum value of the captured value in the variable `<var>`. The following eventex will match using a sliding window of five withdrawal events and set the variable `m` to have the maximum amount:

```javascript
select when repeat 5 (bank withdrawal amount re#\$(\d+\.\d\d)#) max(m)
```

As you saw earlier, the `repeat` operator will continue to match for every withdrawal event after the first five. The variable `m` will always contain the maximum value of the last five withdrawal events.

**`E min(<var>)`.** Accumulate the minimum value of the captured value in the variable `<var>`. The following eventex will match five withdrawal events using a sliding window and set the variable `m` to have the minimum amount:

```javascript
select when repeat 5 (bank withdrawal amount re#\$(\d+\.\d\d)#) min(m)
```

**`E sum(<var>)`.** Accumulate the sum of the captured values in the variable `<var>`. The following eventex will match five withdrawal events and set the variable `m` to have the sum of the amounts:

```javascript
select when count 5 (bank withdrawal amount re#\$(\d+\.\d\d)#) sum(m)
```

Because `count` was used rather than `repeat`, the eventex will sum the amounts of every five withdrawals rather than the last five.

`E avg(<var>)`. Accumulate the average of the captured values in the variable `<var>`. The following eventex will match five withdrawal events and set the variable `m` to have the average of the amounts:

```javascript
select when repeat 5 (bank withdrawal amount re#\$(\d+\.\d\d)#) avg(m)
```

`E push(<var>)`. Append the captured values to the variable `<var>`. The following eventex will match five withdrawal events and set the variable `m` to the array containing the amounts:

```javascript
select when repeat 5 (bank withdrawal amount re#\$(\d+\.\d\d)#) push(m)
```

If the eventex to which the aggregator is attached captures more than one variable, the first variable captured is used in the aggregator. Only one aggregator can be used in an event expression.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189880) (last edited there 2018-09-01).</small>
