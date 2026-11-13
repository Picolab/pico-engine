/**
 * KBlog configuration: the blog's title and the text of its fixed pages, in one
 * place. The other KBlog rulesets use it as a module.
 */
ruleset com.example.kblog.config {
  meta {
    name "KBlog configuration"
    description "The blog's title, about text, and contact text."
    author "PICOLABS"

    provides blogtitle, about_text, contact_text
  }

  global {
    // Modules provide functions; a provided plain value can't be called.

    /**
     * The blog's title.
     * @returns String
     */
    blogtitle = function() {
      "KBlog"
    }

    /**
     * The about box, in Markdown.
     * @returns String
     */
    about_text = function() {
      <<
KBlog is a blog written in KRL. Four rulesets on one pico run it: one for the
pages, one for the articles, one for posting, and one for this text. Rules raise
events for each other; none of them knows how the others work.

It is a new version of the [2011 KBlog](https://www.windley.com/archives/2011/04/event_hierarchies_a_blog_written_in_krl.shtml).
>>
    }

    /**
     * The Contact page, in Markdown.
     * @returns String
     */
    contact_text = function() {
      <<
Pico Labs builds the pico engine and KRL. Find us at [picolabs.io](https://picolabs.io)
and the code at [github.com/Picolab](https://github.com/Picolab).
>>
    }
  }
}
