# Set Operators

Set operators are common set operations that makes working with arrays easier.  All set operations return an array except for **has** which returns a boolean value.  Set operations perform deep comparisons. The following operations are possible with sets:

Given arrays (sets) **A** and **B**:

## intersection (A ∩ B):

 The set of all objects that are a member of both **A** and **B**

`Usage:`

```javascript
A.intersection(B);
```

## union (A ∪ B):

 The set of all objects that are a member of **A** or **B** (or both)

`Usage:`

```javascript
A.union(B);
```

## difference (A \ B):

 The set of all members of **A** that are not members of **B**

`Usage:`

```javascript
A.difference(B);
```

## has (B ⊆ A):

 **B** is a subset of **A** (*or it could be read as **A** is a superset of **B***)

`Usage:`

```javascript
A.has(B);
```

## once:

 Set of elements e that only appear 1 time in **A**

`Usage:`

```javascript
A.once();
```

## duplicates:

 Set of elements e that appear more than once in **A**

`Usage:`

```javascript
A.duplicates();
```

## unique:

 Set of (unique) elements e belonging to **A**

`Usage:`

```javascript
A.unique();
```

## Example

Set operators like other KRL operators can chained to perform more complex operations. This is how you could make your own symmetric difference operation (set of elements e belonging to either **A** or **B**, but not both):

```javascript
symdiff = function (A,B) {
  (A.union(B)).difference(A.intersection(B));
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1183114) (last edited there 2018-01-30).</small>
