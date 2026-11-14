# Quickstart

Install the pico engine, run it, and make a pico say hello. It takes about ten minutes and it's the starting point for every other lesson.

## Objectives

When you finish you will have:

- installed and started the pico engine
- registered a passkey and met your root pico
- written, installed, and run a first ruleset, `io.picolabs.hello_world`
- changed the ruleset and reloaded it with **Flush**

You need [Node.js](https://nodejs.org/) 20 or later and a text editor. You don't need to know KRL yet: this lesson only asks you to copy a short ruleset and read it.

## Install and start the engine

```sh
npm install -g pico-engine
pico-engine
```

The engine listens on port 3000 and keeps its data in `~/.pico-engine`. Leave the terminal open: the engine runs until you stop it with Control-C. Starting it again later picks up where it left off, because picos persist.

Port, data directory, public URL, logging, and the other settings are in the [operator guide](/pico-engine). You won't need them for the lessons, except if you open the engine from a different host name than `localhost`: passkeys are tied to the address in the browser (see `webauthn` there).

## Open the developer UI

Browse to <http://localhost:3000>.

The first visit has no users yet, so the page asks you to **register a passkey**. A passkey is a login credential kept by your browser, your operating system, or a password manager, such as Touch ID, Windows Hello, or 1Password. Follow the prompt your browser shows. The engine never stores a password.

Registering creates your **root pico**. On later visits you sign in with the same passkey. If you delete `~/.pico-engine`, you get a fresh engine with no picos and no passkeys, and you register again.

The page shows your root pico as a box. Click it to open its tabs:

| Tab | What it's for |
|-----|---------------|
| **About** | The pico's id, its parent and children, and its name |
| **Rulesets** | Install a ruleset on this pico, flush one after you change it |
| **Channels** | See, create, and edit the pico's channels and their policies |
| **Logging** | A trace of everything the pico has done, newest first |
| **Testing** | Send events and queries to the pico from forms |
| **Relationships** | Relationships with other picos (a later lesson) |
| **Try It!** | Demos you can run in a new child pico (root pico only, by default) |

Every pico also gets its own box with a small form to **Add** a child pico, with a name and a color. The lessons use a child pico so your root pico stays clean: type a name such as `hello`, click **Add**, and open the new pico.

## The hello_world ruleset

A **ruleset** is the program a pico runs. It's written in KRL and has a unique ruleset id (the **rid**). Save this as `hello_world.krl`:

```krl
ruleset io.picolabs.hello_world {
  meta {
    name "Hello World"
    description <<
A first ruleset for the Quickstart
>>
    author "Phil Windley"
    shares hello
  }
  global {
    /**
     * Greet someone.
     * @param name String "who to greet"
     * @returns String
     */
    hello = function(name = "world") {
      "Hello " + name
    }
  }
  /**
   * Answer with a greeting, as a say directive.
   * @attr name String optional "who to greet"
   * @example "Ada" { "name": "Ada" }
   */
  rule hello_world {
    select when echo hello
    pre {
      my_name = event:attr("name").defaultsTo("world").uc()
    }
    send_directive("say", {"something": "Hello " + my_name})
  }
}
```

It has three parts:

- **`meta`** names the ruleset and lists what it `shares`. Names in `shares` are functions other parties can call as queries. The `description` uses KRL's `<< … >>` quotes, which span lines.
- **`global`** holds definitions every rule can use. `hello` is a function with a default for its parameter.
- **`rule hello_world`** says when to run and what to do. `select when echo hello` means "run for events with domain `echo` and type `hello`". The `pre` block declares `my_name` from the event's `name` attribute: `event:attr("name")` is `null` if the attribute is missing, `defaultsTo("world")` fills it in, and `uc()` upper-cases it. Then `send_directive` adds a directive named `say` to the response. A directive is how a rule answers whoever sent the event.

`pre` declares names. It doesn't assign: you can't declare the same name twice in one rule.

The `/** … */` comments are doc comments. The compiler turns the `@attr`, `@param`, and `@example` tags into the schema that the **Testing** tab uses to build its forms. They don't change what the ruleset does.

## Install it

You can install from a file on your machine, or from a URL.

1. Open the child pico and click its **Rulesets** tab.
2. Scroll to **Install Ruleset by URL**.
3. Either enter a URL, or click **Browse…** and pick `hello_world.krl`. Browse reads the file in your browser and stages a temporary `file://` URL on the engine host. This is for local development. You can also type the URL yourself: `file:///Users/you/lessons/hello_world.krl` (the engine must run on the same machine as the file).
   If the ruleset is on GitHub, use the **raw** URL, such as `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/hello_world.krl`, not the page that shows the file.
4. Leave **Config** as it is and click **Install**.

`io.picolabs.hello_world` now appears in the list of installed rulesets. More on URLs and hosting rulesets: [Tips](/developing/tips).

## Try it

Open the pico's **Testing** tab. Pick the pico's channel in the **ECI** menu and `io.picolabs.hello_world` in the **Ruleset** menu. The tab lists what the ruleset offers: the `echo:hello` event with an optional `name` attribute, and the `hello` query. The `Ada` preset comes from the rule's `@example` comment.

- Send `echo:hello` with `name` set to `Ada`. The result includes a `say` directive: `{"something": "Hello ADA"}`.
- Run the `hello` query with `name` set to `Ada`. The result is `"Hello Ada"`.
- Send `echo:hello` with no `name`. You get `Hello WORLD`.

The same operations work from outside the developer UI, over HTTP, once the pico has a channel for the purpose. The next lesson creates one. The [Echo demo](/cookbook/echo/) is a close relative of this ruleset, with a page that sends the events for you. Run it from the **Try It!** tab, or follow its [instructions](/cookbook/echo/instructions).

## Change it and flush

The engine compiles a ruleset once and remembers it. When you change the source, tell the engine to look again:

1. Edit `hello_world.krl`. Change `"Hello "` in the rule to `"Howdy "`.
2. On the child's **Rulesets** tab, find `io.picolabs.hello_world` in the list and click **flush**. The engine fetches the URL again and recompiles.
3. In **Testing**, send `echo:hello` again. The greeting now says `Howdy`.

A flush updates every pico that has the ruleset installed. It rereads the ruleset's URL. If you installed with **Browse…**, that URL is the engine's staged copy, not your file, so flush won't see your edit: browse for the changed file again, or install from a `file://` URL you typed, which flush rereads. [Tips](/developing/tips) covers flushing, and how to check KRL from the command line with `krl-check` before you install it.

## Troubleshooting

- **The Install button does nothing, or shows an error.** The URL didn't load, or the KRL didn't compile. Check the path, and for GitHub use the raw URL.
- **The ruleset never seems to run.** Open the **Logging** tab and look for the event. If it's there and no rule was selected, check the domain and type. A stray character after the `meta { }` block can stop a ruleset from registering at all, so check it really shows in the installed list.
- **`Not allowed by channel policy`.** The channel you used doesn't permit that event or query. The Testing tab's ECI menu lists the pico's channels. Try another, or see [Managing channels](/wrangler/channels).

## Next steps

- [Events and Queries](/lessons/events-and-queries): give the pico a channel of its own, and call it with `curl`.
- [Pico State](/lessons/pico-state): make the pico remember things.
- [Persistent Compute Objects](/pico-overview): what picos are, and why.
- [Cookbook](/cookbook/): worked examples. The **Try It!** tab runs them for you.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/19791878/Pico+Engine+Quickstart), and updated for this engine.</small>
