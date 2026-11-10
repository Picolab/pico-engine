# Extended Quoting

Some KRL statements and expressions use extended quotes. Extended quotes allow multiple line passages that contain the double quote symbol (`"`) to be more easily entered.

### **Chevrons**

Chevrons enclose the items to be quoted in double less-than and greater-than signs (`<<...>>`). For example:

```javascript
somevar = <<
<p>This is <em>some</em> HTML.<br/>
<a href="http://www.google.com">Search Google</a>
</p>
>>;
```

Values inside chevrons are treated as strings (with the exception of [beestings](/krl/krl-expression-language/literals/beestings)). The whitespace is preserved.

### **Escaping**

Like strings and regular expressions, a backslash allows free use of the terminator character (`>`) inside, and a literal backslash requires two backslashes:

```javascript
var_1 = << \>\> >>;
var_2 = <<\\\>>>; // '\' followed by '>'
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189870) (last edited there 2017-08-08).</small>
