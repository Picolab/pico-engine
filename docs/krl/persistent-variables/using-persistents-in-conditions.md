# Using Persistents in Conditions

Persistents in condition statements are accessed in the same way as in the prelude.

The following action will fire when the persistent variable `ent:archive_pages` is greater than 3:

```javascript
if ent:archive_pages > 3 then
   event:send(...)
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189853) (last edited there 2018-02-06).</small>
