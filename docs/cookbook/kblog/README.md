# KBlog

A blog written in KRL, built from four rulesets on one pico. No ruleset knows how the others work. They cooperate by raising events, and each rule does one thing:

- **Pages** (`com.example.kblog`): Home, a page for each article, Contact, and Post.
- **Data** (`com.example.kblog.data`): stores the articles and provides them.
- **Posting** (`com.example.kblog.posting`): checks each post an author submits and passes it on.
- **Configuration** (`com.example.kblog.config`): the title and the fixed text.

Readers and authors use different channels on the same pico. The reader channel opens every page except Post and accepts no events. The author channel, which the posting ruleset creates when it is installed, adds the Post page and exactly two events. Each time an author posts, the Post page shows the path the post took through the rulesets.

To run it, follow the [instructions](/cookbook/kblog/instructions).

## The event hierarchy

Events are nouns: they say what happened. Rules are verbs: they say what the pico does about it. The write side of KBlog is a chain of them:

```
kblog:post_submitted                      (from the author channel)
  ├─ handle_submit      posting  ──▶  kblog:new_article_available
  │                                     └─ add_article        data   ──▶  kblog:new_article_added
  │                                                                         └─ show_new_article  pages  ──▶  kblog:front_page_updated
  └─ reject_submit      posting       (no name or title: nothing is added)

kblog:clear_requested                     (from the author channel)
  └─ clear_articles     data     ──▶  kblog:articles_cleared
                                        └─ show_empty_blog    pages  ──▶  kblog:front_page_updated
```

Every rule that changes something raises an event saying what is now true, even when nothing listens yet (`front_page_updated`). A ruleset added later can react without anyone editing these.

The read side is queries, not events. The Home page calls `articles()` and an article page calls `article(id)`, which the pages ruleset gets from the data ruleset as a module.

## From the 2011 KBlog

The [original KBlog](https://github.com/windley/KBlog) ran on the classic engine, which raised events from a browser and let rules paint the page. Its design is described in [Event Hierarchies: A Blog Written in KRL](https://www.windley.com/archives/2011/04/event_hierarchies_a_blog_written_in_krl.shtml). This version keeps its rulesets, rule names, and events where they still make sense:

| 2011 | Now |
|------|-----|
| KBlog (`a16x88`) painted the page with `replace_html` in response to `pageview` and `web:click` | `com.example.kblog` serves XMLUI pages. Navigation and the back button come from the page routes (`/`, `/post/:id`, `/contact`, `/new`) |
| `show_home` raised `need_blog_data`; KBlog Data answered with `blog_data_ready` carrying the articles | The page queries `articles()`. Reading is a query; writing stays a chain of events |
| KBlog Data (`a16x89`) kept the articles in an application variable | `com.example.kblog.data` keeps them in an entity variable on the blog pico. `add_article` and `new_article_added` are unchanged |
| KBlog Posting (`a16x90`) ran only for people who had installed it in their browser | `com.example.kblog.posting` creates the author channel. The channel's policy, not who has the code, decides who can post |
| KBlog Configuration (`a16x93`) provided the title, about text, and shared actions | `com.example.kblog.config` provides the title and text. The page layout is a component (`BlogAbout`) |
| KBlog Tweeter (`a16x91`) tweeted new posts | Left out. A ruleset that selects `kblog:new_article_added` would be its place |

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Pages | [`com.example.kblog.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/kblog/com.example.kblog.krl) | Four `@view`s with routes, including a detail page (`/post/:id`); a `@component` used on every page; Markdown rendered safely from data; a page whose form comes from another ruleset; the reader channel |
| Data | [`com.example.kblog.data.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/kblog/com.example.kblog.data.krl) | One ruleset owning the data: rules that change it raise events, and `provides` lets other rulesets read it |
| Posting | [`com.example.kblog.posting.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/kblog/com.example.kblog.posting.krl) | Checking input before raising the internal event; a `@component` another ruleset's page shows; a channel policy that names single events |
| Configuration | [`com.example.kblog.config.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/kblog/com.example.kblog.config.krl) | A module of settings other rulesets use |
| Bootstrap | [`com.example.kblog.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/kblog/com.example.kblog.bootstrap.krl) | Installing rulesets in dependency order, each on the previous one's `ruleset_installed`, then submitting three posts. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later: the pages use components).
- `io.picolabs.xmlui` on the blog pico. The bootstrap installs it.
