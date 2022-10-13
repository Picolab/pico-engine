# http

This module allows you to make http requests.

## http:do(method, url, qs, headers, body, auth, json, form, parseJSON, autoraise, autosignal)

- `method` - String -
- `url` - String - the http(s) base url
- `qs` - Map - query string values
- `headers` - Map - http headers
- `body` - String - the payload of the data
- TODO rest

Example:

```krl
TODO example
```

## http:get(...)

Same as `http:do('GET', ...)`

## http:post(...)

Same as `http:do('POST', ...)`

## http:put(...)

Same as `http:do('PUT', ...)`

## http:patch(...)

Same as `http:do('PATCH', ...)`

## http:delete(...)

Same as `http:do('DELETE', ...)`

## http:head(...)

Same as `http:do('HEAD', ...)`
