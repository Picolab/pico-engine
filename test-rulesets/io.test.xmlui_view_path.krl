ruleset io.test.xmlui_view_path {
  meta {
    name "View path test"
    shares page
  }
  global {
    /**
     * Page with explicit route
     * @view "Settings" /settings
     */
    page = function() {
      <<<Component name="Page">
  <Text>path test</Text>
</Component>
>>
    }
  }
}
