# send_directive()

# Collecting directives

While an event is evaluated, one or more of the rules which are selected and fire may specify a `send_directive` action. These directives are appended into an array of directives, and at the conclusion of the event evaluation, the array of directives is returned to the event generator. (See [Event Loop Introduction](https://picolabs.atlassian.net/wiki/display/docs/Event+Loop+Introduction) for context.) If none of the fired rules send a directive, the `directives` array will be empty.

## send_directive(&lt;name>[, &lt;options>])

Send a directive to the event generator. Action modifiers are used to send directive options:

```javascript
send_directive("my_directive", {"body":"Hello World"})
```

The `<name>` can be any text that identifies the directive to the event generator.

The options are given as a [map](/krl/krl-expression-language/literals/maps). The map can include any keys and values that the developer wishes.

The following ruleset shows send_directive() being used

```javascript
ruleset a1299x188 {
	meta {
		name "Send Directive Example"
		author "nathan cerny"
		logging on
	}
	rule directive_example {
		select when webhook directive_example
		send_directive("text", {"body":"my text response"});
	}
}
```

# Reserved directive names

The engine treats these directive names in a special way:

## `_cookie`

A directive with this name, and with an option named `cookie` will result in an HTTP header `Set-Cookie` being added to the response headers.

## `_txt`

The first directive with this name, if it has an option named `content`, will cause the HTTP response to have a `Content-Type` of `text/plain` with the body specified by the content option. All other directives (except `_cookie`) will be ignored.

## _html

Assuming there are no `_txt` directives, the first directive of this name, if it has an option named `content`, will cause the HTTP response to have a `Content-Type` of `text/html` with the body specified by the content option. All other directives (except `_cookie`) will be ignored.

## `_gif`

Assuming there are no `_txt` or `_html` directives, the first directive of this name, if it has an option named `content`, will cause the HTTP response to have a `Content-Type` of `image/gif` with the body specified by the content option. All other directives (except `_cookie`) will be ignored. The content must be an array of numeric values in the range 0-255. See [Generate an image with KRL](https://picolabs.atlassian.net/wiki/display/docs/Generate+an+image+with+KRL) for an example.

## `_redirect`

Assuming there are no other special directives, the first directive of this name will cause the HTTP response to be a redirection to the URL contained in the option named `url`.

# Usual case

In the usual case, where none of the fired rules send a directive with one of the reserved names, the HTTP response will be a JSON object with the single key `directives` whose value is an array containing the directives in the order the rules fired.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/38928416) (last edited there 2020-01-14).</small>
