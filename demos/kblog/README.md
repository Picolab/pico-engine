# KBlog demo

A blog written in KRL: four rulesets on one pico that work together by raising events, with a reader channel and an author channel. A new version of the [2011 KBlog](https://github.com/windley/KBlog).

- Overview: [`docs/cookbook/kblog/README.md`](../../docs/cookbook/kblog/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/kblog/)
- Instructions: [`docs/cookbook/kblog/instructions.md`](../../docs/cookbook/kblog/instructions.md)

| File | Shows |
|------|-------|
| `com.example.kblog.krl` | The pages (Home, an article page, Contact, Post) and the reader channel |
| `com.example.kblog.data.krl` | The articles: adds one on `kblog:new_article_available`, clears them, and provides them |
| `com.example.kblog.posting.krl` | Posting: checks each submitted post, provides the post form, and creates the author channel |
| `com.example.kblog.config.krl` | The title and the about and contact text, as a module |
| `com.example.kblog.bootstrap.krl` | Installs them in order on a new pico and submits three posts; the **Try It!** tab runs it |
