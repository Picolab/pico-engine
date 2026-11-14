# Modules and External APIs

Real picos talk to the rest of the web: weather services, movie databases, SMS gateways. In this lesson you'll wrap a web API in a **module**, a ruleset that other rulesets `use`, give it a secret key without writing the key in any file, and call it from an app ruleset.

## Objectives

When you finish you will be able to:

- write a ruleset that works as a module, with `provides` and `configure using`
- use a module from another ruleset, with `use module … alias … with …`
- call a web API with the `http` library, as a function and as an action
- write a user-defined action with `defaction`
- get a secret into a ruleset with install configuration (`meta:rulesetConfig`), and know where it still shows

**Before you begin**, finish [Pico State](/lessons/pico-state). The examples call [The Movie Database (TMDB)](https://www.themoviedb.org/). To run them against the real service you need a free TMDB account and an API key (the v3 "API key"). Without one, everything here still runs: TMDB answers `401` and you can see how the rulesets handle it.

## Why modules

Two rulesets often want the same code. One of them wraps a service so the other doesn't have to know how it works: the app says `tmdb:getPopular()` and doesn't know about URLs, query strings, or JSON. Fix the wrapper, and every app that uses it gets the fix. A module is also **parameterized**: the same code can be used with different settings, such as different keys.

Any ruleset can be a module. A ruleset becomes a *useful* module when its `meta` block says what it `provides`:

```krl
meta {
  configure using api_key = ""
  provides getPopular, rateMovie
}
```

- **`provides`** lists the global definitions (functions, actions, and values) that rulesets using this one may call. Rules are never shared.
- **`configure using`** declares the module's settings, with defaults. A user of the module overrides them with `with`.

And a ruleset uses one like this:

```krl
meta {
  use module io.picolabs.tmdb alias tmdb
    with api_key = "…"
}
```

`io.picolabs.tmdb` is the **rid** of the module, which is what the engine knows it by, not the `name` in its `meta`. The `alias` gives it a short name to use in code: `tmdb:getPopular()`. You need one because a rid contains periods, and `io.picolabs.tmdb:getPopular()` isn't valid KRL. Don't pick the name of an engine library (`http`, `time`, `wrangler`, `event`, `meta`, `ent`, and so on) as an alias: inside your ruleset the name would mean the module and the library would be out of reach. The full reference, with the reserved names, is [User Defined Modules](/krl/user-defined-modules).

The module must be installed on the pico before the ruleset that uses it, and while a module is in use, it can't be uninstalled.

`shares` and `provides` are different: `shares` lists the functions that can be called from outside the pico as queries; `provides` lists what other rulesets on the pico can use. A ruleset can do both.

## A wrapper for TMDB

Save this as `io.picolabs.tmdb.krl`:

```krl
ruleset io.picolabs.tmdb {
  meta {
    name "TMDB"
    description <<
A thin wrapper around The Movie Database (TMDB) API, for the Modules lesson.
>>
    author "Phil Windley"
    configure using
      api_key = ""
    provides getPopular, rateMovie
  }
  global {
    base_url = "https://api.themoviedb.org/3"

    /**
     * Today's popular movies from TMDB.
     * @param page Number "which page of results"
     * @returns Array
     */
    getPopular = function(page = 1) {
      response = http:get(base_url + "/movie/popular",
                          qs = {"api_key": api_key, "page": page})
      response{"status_code"} == 200 => response{"content"}.decode(){"results"} | []
    }

    rateMovie = defaction(movie_id, rating, guest_session_id) {
      http:post(base_url + "/movie/" + movie_id + "/rating",
                qs = {"api_key": api_key, "guest_session_id": guest_session_id},
                json = {"value": rating}) setting(response)
      return response{"status_code"}
    }
  }
}
```

Read it in pieces.

**Configuration.** `api_key` is declared with a default of `""`. Inside the module it's an ordinary variable. It's not shared by `provides`, so no one can read it back through the module.

**`getPopular` is a function that calls the web.** `http:get(url, qs = {...})` makes the request when the expression is evaluated, and returns a map: `status_code`, `content` (the body, as a string), `content_type`, `headers`, and more. Because the body is a string, `decode()` turns the JSON into KRL data. If the call fails, the function returns an empty array. A function can call `http:get` and so can be shared as a query; it can't change state. The conditional expression `a => b | c` picks `b` when `a` is true. Read more in the [http library](/krl/libraries/http).

**`rateMovie` is an action.** Anything that changes the world, like posting a rating, is an action, and a rule runs it as its one action. `defaction` wraps an action (here `http:post`) so rules can call it by name. `http:post(url, qs = …, json = …)` sends the `json` map as the JSON body, with the right content type. `setting(response)` names the response, and `return` hands back a value to whoever used the action. See [User-Defined Actions](/krl/krl-expression-language/user-defined-actions).

> **Note:** If you have only TMDB's "API Read Access Token", pass it as a header instead of a query-string key: `headers = {"Authorization": "Bearer " + api_key}` in the `http:get` and `http:post` calls.

## An app that uses it

Save this as `com.example.my_movie_app.krl`:

```krl
ruleset com.example.my_movie_app {
  meta {
    name "My Movie App"
    description <<
Uses the io.picolabs.tmdb module. The API key is install configuration.
>>
    use module io.picolabs.tmdb alias tmdb
      with api_key = meta:rulesetConfig{"tmdb_api_key"}
    shares popular, ratings
  }
  global {
    /**
     * Titles of today's popular movies.
     * @returns Array
     */
    popular = function() {
      tmdb:getPopular().map(function(m) { m{"title"} })
    }

    /**
     * Ratings this pico has sent.
     * @returns Map
     */
    ratings = function() {
      ent:ratings.defaultsTo({})
    }
  }

  /**
   * Rate a movie on TMDB and remember the rating.
   * @attr movie_id String "TMDB movie id"
   * @attr rating Number "0.5 to 10"
   * @attr guest_session_id String "a TMDB guest session"
   */
  rule rate_movie {
    select when movie rating_given
    pre {
      movie_id = event:attr("movie_id")
      rating = event:attr("rating").as("Number")
      session = event:attr("guest_session_id")
    }
    tmdb:rateMovie(movie_id, rating, session) setting(status)
    fired {
      ent:ratings{[movie_id, "rating"]} := rating
      ent:ratings{[movie_id, "status"]} := status
    }
  }
}
```

- `popular` calls the module function like any function, and maps each movie to its title. It's in `shares`, so it's also a query on this pico's channels.
- The rule `rate_movie` selects `movie:rating_given`, and its one action is the module's `tmdb:rateMovie`. The `setting(status)` clause catches what the action returned, the HTTP status code. The `fired` postlude stores the rating and the status with path assignments, `ent:ratings{[movie_id, "rating"]} := rating`, so one movie's entry is updated without touching the others.
- `with api_key = meta:rulesetConfig{"tmdb_api_key"}` is where the key comes from. See the next section.

## Where the secret comes from

You never want an API key in a KRL file: source gets copied, committed to repositories, and served from web servers. This lesson's rulesets don't contain one. The key arrives when the ruleset is **installed**, in the **config** that accompanies the install request:

1. Make a child pico, say `movies`.
2. On its **Rulesets** tab, under **Install Ruleset by URL**, install `io.picolabs.tmdb.krl` first, with **Config** left alone. (From a file, use a `file://` URL, as in the [Quickstart](/lessons/quickstart).)
3. Install `com.example.my_movie_app.krl` with **Config** set to:

   ```json
   {"tmdb_api_key": "your key here"}
   ```

In KRL, the ruleset reads this map as `meta:rulesetConfig`. A `with` clause can use it because the engine evaluates the clause when the ruleset is loaded, before any rule runs. Other forms of the install (the `wrangler:install_ruleset_request` event, which the Rulesets tab sends) take the same `config` attribute. See [The wrangler ruleset](/wrangler/wrangler). A bootstrap ruleset can install a whole app, modules first, each with its own `config`: [Bootstrap and channels](/cookbook/bootstrap/) shows how.

Install configuration keeps the secret out of the source, but not out of sight. Anyone who can use the developer UI can see the config on the **Rulesets** tab, the install event's attributes show in the **Logging** tab and the engine's log file, and `wrangler:rulesetConfig(rid)` returns it to anyone whose channel permits the query. The [Configuration and secrets](/cookbook/secrets/) demo walks through where a secret can be seen, how to get one in by event instead, and how to keep a ruleset idle until it has one.

> **Older rulesets:** you may see a `keys` ruleset that holds `key twilio { … }` in its source, and `use module io.picolabs.lesson_keys` with `keys:twilio("account_sid")`. That puts the secret in a file. Prefer install configuration.

## Try it

On the `movies` pico, open the **Testing** tab and choose `com.example.my_movie_app`.

1. Run the `popular` query. With a valid key you get a list of titles. With a missing or wrong key, TMDB answers `401` and the module's function returns `[]`.
2. Send `movie:rating_given` with `movie_id` `550`, `rating` `8`, and a `guest_session_id` (you can make a guest session with TMDB's API, see its [documentation](https://developer.themoviedb.org/); any string works for seeing the flow).
3. Run the `ratings` query. It shows `{"550": {"rating": 8, "status": …}}` with TMDB's status code: `201` on success, `401` for a bad key.
4. Open the **Logging** tab. Select the `rate_movie` transaction and see the `ent:` writes and the event's attributes. To trace the HTTP status yourself, add `.klog("TMDB status")` to `response{"status_code"}` in the module's `rateMovie` and flush the module.

To change the key, uninstall `com.example.my_movie_app` and install it again with the new config.

## Exercise: a Twilio module

Twilio sends SMS messages from a web API. Build a module for it, in two steps. Twilio's endpoint is `POST https://api.twilio.com/2010-04-01/Accounts/<account_sid>/Messages.json`, with HTTP basic authentication (account sid and auth token), and form fields `From`, `To`, and `Body`.

1. **Keys as parameters.** Write `io.picolabs.twilio_v1`, which `provides` a user-defined action `send_sms(to, from, message, account_sid, auth_token)`. Give the module a rule that selects `test:new_message` and calls the action with the attributes, so you can try it from the Testing tab with a Twilio test account.
2. **Keys as configuration.** Write `io.picolabs.twilio_v2`: `configure using account_sid = "" auth_token = ""` and `provides send_sms`, with action `send_sms(to, from, message)`. Then write `com.example.use_twilio`, which uses the module with `with account_sid = meta:rulesetConfig{"twilio_account_sid"}` and `auth_token = meta:rulesetConfig{"twilio_auth_token"}`, and has the `test:new_message` rule. Install both, with the keys in the config.

Compare the two. In which are the secrets in the event's attributes, and in which are they in install configuration? Use the Logging tab. The [http library](/krl/libraries/http) documents `auth`, `form`, and `setting`.

Use Twilio's test credentials so no real messages are sent, and don't commit keys.

<details>
<summary>One solution to step 2</summary>

```krl
ruleset io.picolabs.twilio_v2 {
  meta {
    name "Twilio SMS Module"
    description <<
Send an SMS with Twilio. Exercise for the Modules lesson.
>>
    author "Phil Windley"
    configure using
      account_sid = ""
      auth_token = ""
    provides send_sms
  }
  global {
    send_sms = defaction(to, from, message) {
      base_url = <<https://api.twilio.com/2010-04-01/Accounts/#{account_sid}/>>
      http:post(base_url + "Messages.json",
                auth = {"username": account_sid, "password": auth_token},
                form = {"From": from, "To": to, "Body": message}) setting(response)
      return response{"status_code"}
    }
  }
}
```

```krl
ruleset com.example.use_twilio {
  meta {
    name "Use Twilio"
    use module io.picolabs.twilio_v2 alias twilio
      with account_sid = meta:rulesetConfig{"twilio_account_sid"}
           auth_token = meta:rulesetConfig{"twilio_auth_token"}
  }
  /**
   * Send a text message.
   * @attr to String "number to text"
   * @attr from String "your Twilio number"
   * @attr message String "text of the message"
   */
  rule test_send_sms {
    select when test new_message
    twilio:send_sms(event:attr("to"), event:attr("from"), event:attr("message")) setting(status)
    fired {
      ent:last_status := status
    }
  }
}
```

Twilio answers `201` when it accepts the message.

</details>

## What you learned

- A module is a ruleset with `provides`. `configure using` declares settings with defaults, and `use module … alias … with …` uses it.
- Modules can provide functions, actions, and plain values. Rules are never shared.
- `http:get` and the other `http` calls are functions and actions. A module can wrap them to give a service a small, clean API.
- Secrets go in install configuration (`meta:rulesetConfig`), not in source, and are still visible to people who can see the developer UI and logs.

## Next

The lessons so far build up one pico. Next come picos that show themselves to people (**Pico views**), and systems of many picos: [Pico-Based Systems](/lessons/pico-based-systems) and [Relationships](/lessons/relationships). For a pico that actually calls other picos, see the [Two picos talking](/cookbook/two_picos/) demo, and the [Querying JSON](/cookbook/json_query/) demo for working with the kind of nested data web APIs return.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/32148114/Modules+and+External+APIs+Lesson) (last edited there 2022-01-18), and updated for this engine.</small>
