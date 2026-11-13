/**
 * KBlog data: keeps the articles. It adds an article when
 * kblog:new_article_available arrives and raises kblog:new_article_added, and
 * provides the articles to the other KBlog rulesets. Nothing else stores or
 * changes them.
 */
ruleset com.example.kblog.data {
  meta {
    name "KBlog data"
    description "Stores KBlog's articles and provides them to the other rulesets."
    author "PICOLABS"

    provides articles, article
    shares articles, article
  }

  global {
    /**
     * Every article, newest first.
     * @returns Array of { id, author, title, body, time }
     */
    articles = function() {
      ent:articles.defaultsTo({}).values()
        .sort(function(a, b) { b{"id"} <=> a{"id"} })
    }

    /**
     * One article.
     * @param id String "the article's id"
     * @returns Map
     */
    article = function(id) {
      ent:articles.defaultsTo({}){id.as("String")}
    }
  }

  /**
   * Store a new article. The posting ruleset raises this after it checks a
   * submitted post.
   * @attr author String "who wrote it"
   * @attr title String "the title"
   * @attr body String optional "the text, in Markdown"
   */
  rule add_article {
    select when kblog new_article_available
    pre {
      id = ent:next_id.defaultsTo(1)
      entry = {
        "id": id,
        "author": event:attr("author"),
        "title": event:attr("title"),
        "body": event:attr("body") || "",
        "time": time:now()
      }
    }
    send_directive("add_article", {"id": id})
    fired {
      ent:next_id := id + 1
      ent:articles{id.as("String")} := entry
      raise kblog event "new_article_added" attributes entry
    }
  }

  /**
   * Delete every article.
   */
  rule clear_articles {
    select when kblog clear_requested
    send_directive("clear_articles")
    fired {
      ent:articles := {}
      raise kblog event "articles_cleared"
    }
  }
}
