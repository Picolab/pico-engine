/**
 * KBlog: the pages. Home lists the articles, each article has its own page,
 * and Contact and Post round it out. The articles come from
 * com.example.kblog.data and the text from com.example.kblog.config. The Post
 * page shows the PostForm component, which com.example.kblog.posting provides;
 * only the author channel that ruleset creates may open it.
 *
 * On install it creates the reader channel: every page but Post, and no events.
 */
ruleset com.example.kblog {
  meta {
    name "KBlog"
    description "The pages of a blog written in KRL."
    author "PICOLABS"

    use module com.example.kblog.config alias config
    use module com.example.kblog.data alias data
    use module io.picolabs.xmlui alias ui

    shares articles, article, blogAbout, homePage, articlePage, contactPage, postPage
  }

  global {
    reader_tags = ["kblog", "reader"]

    /**
     * Every article, newest first. The latest one is marked.
     * @returns Array of { id, author, title, body, time, latest }
     */
    articles = function() {
      data:articles().map(function(a) { a.put("latest", a{"id"} == ent:latest) })
    }

    /**
     * One article.
     * @param id String "the article's id"
     * @returns Map
     */
    article = function(id) {
      data:article(id)
    }

    /**
     * The about box beside every page.
     * @component
     */
    blogAbout = function() {
      <<
<Component name="BlogAbout">
  <Card title="About" width="{$props.width}">
    <Markdown openLinkInNewTab="true"><![CDATA[#{config:about_text()}]]></Markdown>
  </Card>
</Component>
>>
    }

    /**
     * The latest articles.
     * @view "Home" /
     */
    homePage = function() {
      articles_url = ui:query_url("articles", meta:rid, meta:eci)
      <<
<Component name="HomePage">
  <DataSource id="posts" url="#{articles_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="5" />
  <PicoTheme>
    <HStack verticalAlignment="start" wrapContent="true">
      <VStack width="*" minWidth="300px">
        <H2>#{ui:escape(config:blogtitle())}: latest from the blog</H2>
        <Text when="{posts.value &amp;&amp; posts.value.length === 0}">No articles yet.</Text>
        <Items data="{posts}">
          <Card>
            <HStack verticalAlignment="center">
              <Link to="/post/{$item.id}"><H3>{$item.title}</H3></Link>
              <Badge when="{$item.latest}" value="New" />
            </HStack>
            <Text variant="secondary">by {$item.author}, {$item.time.substring(0, 16).replace('T', ' ')} UTC</Text>
            <Markdown content="{$item.body}" allowHtml="false" interpolateBindings="false" />
          </Card>
        </Items>
      </VStack>
      <BlogAbout width="300px" />
    </HStack>
  </PicoTheme>
</Component>
>>
    }

    /**
     * One article, at its own address.
     * @view "Article" /post/:id
     */
    articlePage = function() {
      <<
<Component name="ArticlePage">
  #{ui:query("post", "article", {"rid": meta:rid, "args": {"id": "{$routeParams.id}"}})}
  <PicoTheme>
    <HStack verticalAlignment="start" wrapContent="true">
      <VStack width="*" minWidth="300px">
        <Link to="/">Back to the blog</Link>
        <Text when="{post.loaded &amp;&amp; !post.value}">There is no article {$routeParams.id}.</Text>
        <Card when="{post.value}">
          <H2>{post.value.title}</H2>
          <Text variant="secondary">by {post.value.author}, {post.value.time.substring(0, 16).replace('T', ' ')} UTC</Text>
          <Markdown content="{post.value.body}" allowHtml="false" interpolateBindings="false" />
        </Card>
      </VStack>
      <BlogAbout width="300px" />
    </HStack>
  </PicoTheme>
</Component>
>>
    }

    /**
     * How to reach us.
     * @view "Contact" /contact
     */
    contactPage = function() {
      <<
<Component name="ContactPage">
  <PicoTheme>
    <HStack verticalAlignment="start" wrapContent="true">
      <Card title="Contact" width="*" minWidth="300px">
        <Markdown openLinkInNewTab="true"><![CDATA[#{config:contact_text()}]]></Markdown>
      </Card>
      <BlogAbout width="300px" />
    </HStack>
  </PicoTheme>
</Component>
>>
    }

    /**
     * Write a post. The form comes from com.example.kblog.posting.
     * @view "Post" /new
     */
    postPage = function() {
      <<
<Component name="PostPage">
  <PicoTheme>
    <HStack verticalAlignment="start" wrapContent="true">
      <VStack width="*" minWidth="300px">
        <H2>Post</H2>
        <PostForm />
      </VStack>
      <BlogAbout width="300px" />
    </HStack>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * A new article was added: mark it as the latest, and say the front page has
   * it.
   */
  rule show_new_article {
    select when kblog new_article_added
    send_directive("show_new_article", {"id": event:attr("id")})
    fired {
      ent:latest := event:attr("id")
      raise kblog event "front_page_updated" attributes event:attrs
    }
  }

  /**
   * The articles were deleted: nothing is the latest any more.
   */
  rule show_empty_blog {
    select when kblog articles_cleared
    send_directive("show_empty_blog")
    fired {
      ent:latest := null
      raise kblog event "front_page_updated"
    }
  }

  rule create_reader_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(reader_tags, [], ["articles", "article", "homePage", "articlePage", "contactPage"], meta:rid)
  }
}
