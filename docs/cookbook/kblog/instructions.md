# KBlog: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/kblog/) for what the demo shows and how it differs from the 2011 KBlog.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **KBlog**, then **Run in a new child pico**. The bootstrap installs the rulesets and submits three posts. When it shows **ready**, it has two links:

- **Read the blog (reader channel)**: Home and Contact. There is no Post page.
- **Write a post (author channel)**: Home, Contact, and Post.

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install these from the engine, in this order. Each one after the first uses an earlier one as a module.
   - `http://localhost:3000/krl/io.picolabs.xmlui.krl`
   - `http://localhost:3000/krl/demos/kblog/com.example.kblog.config.krl`
   - `http://localhost:3000/krl/demos/kblog/com.example.kblog.data.krl`
   - `http://localhost:3000/krl/demos/kblog/com.example.kblog.krl`, which creates the `kblog, reader` channel
   - `http://localhost:3000/krl/demos/kblog/com.example.kblog.posting.krl`, which creates the `kblog, author` channel
3. Click **View** next to `com.example.kblog` and open it on either channel.

## Try it

- On the author channel, open **Post**, write a post, and click **Post**. The **Event path** card reads `handle_submit → add_article → show_new_article`: one rule in each of three rulesets. Open **Home**: your post is first, marked **New**.
- Submit a post without a title. The path is `reject_submit`, and nothing is added.
- Click an article's title. Its page is at `#/post/<id>`, so you can bookmark it, and the browser's back button returns to Home.
- On the reader channel, try to post anyway. Replace `<reader eci>` with the id in the reader page's URL:

  ```sh
  curl -X POST "http://localhost:3000/sky/event/<reader eci>/demo/kblog/post_submitted" \
    -H 'content-type: application/json' -d '{"author": "Mallory", "title": "Hi"}'
  ```

  The answer is `{"error":"Error: Not allowed by channel policy"}`.
- On the author channel, try to skip the check by raising the internal event yourself: `kblog/new_article_available` instead of `kblog/post_submitted`. The author channel refuses it too. It allows `post_submitted` and `clear_requested` and nothing else.
- **Clear the blog** on the Post page deletes every article. The path is `clear_articles → show_empty_blog`.

## How it works

**Posting** checks a post and passes it on. It doesn't store anything:

```krl
rule handle_submit {
  select when kblog post_submitted
    author re#(\S.*)#
    title re#(\S.*)#
    setting(author, title)
  send_directive("handle_submit", {"title": title})
  fired {
    raise kblog event "new_article_available" attributes
      {"author": author, "title": title, "body": event:attr("body") || ""}
  }
}
```

**Data** stores the article and says so:

```krl
rule add_article {
  select when kblog new_article_available
  pre {
    id = ent:next_id.defaultsTo(1)
    entry = {"id": id, "author": event:attr("author"), "title": event:attr("title"),
             "body": event:attr("body") || "", "time": time:now()}
  }
  send_directive("add_article", {"id": id})
  fired {
    ent:next_id := id + 1
    ent:articles{id.as("String")} := entry
    raise kblog event "new_article_added" attributes entry
  }
}
```

**Pages** marks the newest article and raises `kblog:front_page_updated`. The Home page reloads its articles every five seconds, so readers see new posts without reloading.

Each rule answers with a directive named after itself. A raised event is handled in the same transaction as the event that raised it, after that event's rules finish. So the response to `post_submitted` holds the directives of every rule that ran, in order. The Post page joins their names into the event path.

**Who can post** is the author channel's policy:

```krl
wrangler:createChannel(
  ["kblog", "author"],
  {"allow": [{"domain": "kblog", "name": "post_submitted"}, {"domain": "kblog", "name": "clear_requested"}], "deny": []},
  authorQueryPolicy()
)
```

Its query policy allows every page, including Post, plus the posting ruleset's `PostForm` component. The reader channel, made by `ui:create_app_channel` in the pages ruleset, allows the other pages and no events. The navigation shows only the pages a channel allows, so readers never see Post.

**The Post page** is in the pages ruleset, but its form is the `PostForm` component from the posting ruleset. The engine finds a component in the app's ruleset, then in `io.picolabs.xmlui`, then in one other installed ruleset that defines it.

**Article text** is Markdown from whoever posted it, so the pages render it with `<Markdown content="{$item.body}" allowHtml="false" interpolateBindings="false" />`. HTML in a post shows as text, and nothing in it is evaluated.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and reload the page.

- Rename the blog: change the string `blogtitle` returns in `com.example.kblog.config.krl`, flush it, and reload. The pages call the configuration module each time they are generated, so only the module needs flushing.
- Put back the tweeter as a new ruleset whose rule selects `kblog:new_article_added`, records each title, and sends a directive named after itself. Install it from a `file://` URL and post: the event path gets a fourth name, with no change to the other rulesets.
- Add a word limit: a rule in `com.example.kblog.posting.krl` that rejects bodies over 200 words. Make `handle_submit` skip them too, so only one of the two rules runs.
