/**
 * KBlog posting: layered on the other KBlog rulesets so that only authors can
 * post. It checks each submitted post and raises kblog:new_article_available
 * for the data ruleset. It provides the PostForm component the Post page shows.
 *
 * On install it creates the author channel: every KBlog page, including Post,
 * and exactly two events, kblog:post_submitted and kblog:clear_requested. The
 * channel does not allow kblog:new_article_available, so an author cannot skip
 * the check in handle_submit.
 */
ruleset com.example.kblog.posting {
  meta {
    name "KBlog posting"
    description "Lets authors post to KBlog, on a channel only they get."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares postForm
  }

  global {
    kblog_rid = "com.example.kblog"
    xmlui_rid = "io.picolabs.xmlui"
    author_tags = ["kblog", "author"]
    kblog_queries = ["articles", "article", "homePage", "articlePage", "contactPage", "postPage"]

    componentsOf = function(rid) {
      wrangler:rulesetSchema(rid){"queries"}.defaultsTo([])
        .filter(function(q) { not q{"component"}.isnull() })
        .map(function(q) { q{"name"} })
    }

    authorQueryPolicy = function() {
      kblog = kblog_queries.append(componentsOf(kblog_rid))
        .map(function(name) { {"rid": kblog_rid, "name": name} })
      xmlui = componentsOf(xmlui_rid).append(["file"])
        .map(function(name) { {"rid": xmlui_rid, "name": name} })
      policy = {"allow": kblog.append(xmlui).append([{"rid": meta:rid, "name": "postForm"}]), "deny": []}
      policy
    }

    /**
     * The post form, and the path the last post took through the rulesets.
     * @component
     */
    postForm = function() {
      submit_url = ui:event_url("kblog", "post_submitted")
      clear_url = ui:event_url("kblog", "clear_requested")
      <<
<Component name="PostForm" var.path="">
  <APICall id="submit" method="post" url="#{submit_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="(result) => path = result.directives.map((d) => d.name).join(' → ')" />
  <APICall id="clear" method="post" url="#{clear_url}" headers="{appGlobals.auth}"
           onSuccess="(result) => path = result.directives.map((d) => d.name).join(' → ')" />
  <Form saveLabel="Post" onSubmit="(data) => submit.execute(data)">
    <FormItem bindTo="author" label="Name" />
    <FormItem bindTo="title" label="Title" />
    <FormItem bindTo="body" label="Body (Markdown)" type="textarea" />
  </Form>
  <Card title="Event path"
        subtitle="{path || 'Post something to see which rules ran, in order, across the rulesets.'}" />
  <HStack>
    <Button label="Clear the blog" variant="outlined" onClick="clear.execute({})" />
  </HStack>
</Component>
>>
    }
  }

  /**
   * A post was submitted: check it, and pass it on as a new article.
   * @attr author String "who wrote it"
   * @attr title String "the title"
   * @attr body String optional "the text, in Markdown"
   * @example "hello" { "author": "Phil", "title": "Hello", "body": "First post" }
   */
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

  /**
   * A post without a name or a title is turned back.
   */
  rule reject_submit {
    select when kblog post_submitted
      where not (event:attr("author").defaultsTo("").match(re#\S#)
             && event:attr("title").defaultsTo("").match(re#\S#))
    send_directive("reject_submit", {"reason": "a post needs a name and a title"})
  }

  rule create_author_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    wrangler:createChannel(
      author_tags,
      {"allow": [{"domain": "kblog", "name": "post_submitted"}, {"domain": "kblog", "name": "clear_requested"}], "deny": []},
      authorQueryPolicy()
    )
  }
}
