/**
 * Visitor log formatting: a module the visitor log uses, so it has to be
 * installed first.
 */
ruleset com.example.visitors.format {
  meta {
    name "Visitor log formatting"
    description "Formats greetings for the visitor log."
    author "PICOLABS"

    provides greeting
  }

  global {
    /**
     * A greeting for a visitor.
     * @param word String "the greeting word, such as Welcome"
     * @param name String "the visitor's name"
     * @returns String
     */
    greeting = function(word, name) {
      word + ", " + name + "!"
    }
  }
}
