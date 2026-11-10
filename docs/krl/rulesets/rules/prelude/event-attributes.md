# Event Attributes

Event attributes are one of the most important sources of data for computation in a rule because they convey information about the context of the event. In Chapter 3 (of the book [The Live Web: Building Event-based Connections in the Cloud](https://www.windley.com/archives/2012/01/the_live_web_is_live.shtml) ([download PDF](https://byu.instructure.com/courses/11296/files/3475334/download?verifier=AFxIvij4H1c5iH0EbOddOsEs4gl8A0gxLfnlCeDn&wrap=1) of chapter 3)), you saw how eventexes can use expressions on event attributes as filters for which events match a given primitive eventex. Event attributes can also be used in KRL expressions. To avoid conflict with user-declared variables names, event attributes are namespaced using the keyword [event](/krl/libraries/event). (Prepending the namespace name and a colon to a variable forms namespaces in KRL. This is used in three ways: a namespace as a built-in library (such as [event](/krl/libraries/event)), a namespace for a KRL [module](/krl/user-defined-modules), the namespace `ent` for [entity variables](https://picolabs.atlassian.net/wiki/display/docs/Using+Persistent+Variables).)

## Receiving an event attribute

Assume that a rule has been selected with an event attribute named `url`. The following KRL expression could be used to extract the domain name from the `url` attribute:

```
event:attr("url").extract(re#https?://([^/:]+)#)
```

Note that the syntax above has been deprecated in favor of

```
event:attrs{"url"}.extract(re#https?://([^/:]+)#)
```

### Other alternatives

Besides the alternatives shown above (short form that is deprecated, and the official form), there are other ways to obtain an event attribute’s value inside a rule. The first two above are expressions which can appear anywhere a KRL expression can appear (the `where` clause of a `select when`, the prelude of a rule, the condition of a rule, and a postlude of a rule, the expression in a `foreach`, etc.).

In addition, an expression like the following could be used anywhere a KRL expression can appear:

```
event:attrs.get("url").extract(re#https?://([^/:]+)#)
```

That works because `event:attrs` evaluates to a KRL [map](/krl/krl-expression-language/literals/maps), so that any of [Map Operators](/krl/krl-expression-language/operators/map-operators) and expressions can be used with it. As an additional example, if we just wanted to see if the attributes included an attribute named “url” we could use:

```
event:attrs >< "url"
```

Finally, as one of the matches in a `select when` we could use (see Event Expressions in the [Grammar](/krl/grammar) page):

```
url re#https?://([^/:]+)# setting(domain)
```

This does more than simply extract the domain name from an event attribute named “url” but causes the rule to be selected only when there actually *is* an attributed named “url” associated with the event. Furthermore, it binds the domain portion of said URL to the name `domain` which is now in scope for the entire rule.

## Sending an event attribute

Event attributes can be sent to an event in different ways. One way is by using GET or POST requests with the [HTTP](/krl/libraries/http) library. The other way is to include attributes when raising an event. The following KRL would raise an event with event attributes:

```
raise explicit event "testEventAttributes" for a1x100 attributes {"foo":"bar"};
```

This attribute could be used in the following rule:

```
rule testEventAttributes {
   select when explicit testEventAttributes
      pre {
         foo = event:attr("foo"); // Equals bar at this point
      }
      noop()
}
```

If an event attribute does not exist, the expression will evaluate to `null`. Idiomatic KRL is to use the `defaultsTo()` operator to give it a default value if one is desired, or the `||` (OR) operator to reassign the empty string as well.

##### **Example**

```javascript
name = event:attr("name").defaultsTo("John Doe") // name will be bound to "John Doe" if the event attribute is null
name = event:attr("name") || ent:name // name will be bound to the value of ent:name if the event attribute is the empty string or null or any other false value
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189834) (last edited there 2022-01-10).</small>
