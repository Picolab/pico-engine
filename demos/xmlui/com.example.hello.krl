ruleset com.example.hello {
  meta {
    name "Hello"
    shares hello
  }
  global {
    /**
     * A first view
     * @view "Hello"
     */
    hello = function() {
      <<<Component name="Hello">
  <H1>Hello</H1>
  <Text>This view is a shared function in #{meta:rid}.</Text>
</Component>
>>
    }
  }
}
