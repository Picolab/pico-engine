# Finding Individual Events

Events have structure. They have a type and attributes that have values. Events also include a domain that can be used to group events together--forming a two-tier hierarchy. We want to write patterns that can match the components of this structure using primitive event expressions to recognize the occurrence of individual events. The simplest event expressions match an event domain and name exactly:

```javascript
select when emitter new_sensor_reading
```

We can also match based on patterns in attributes and even capture values for later use. The following sections talk about matching primitive, or simple events:

- [Attribute Matching](/krl/event-expressions/finding-individual-events/attribute-matching)
- [Capturing Values](/krl/event-expressions/finding-individual-events/capturing-values)
- [Attribute Expressions](/krl/event-expressions/finding-individual-events/attribute-expressions)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189884) (last edited there 2021-06-23).</small>
