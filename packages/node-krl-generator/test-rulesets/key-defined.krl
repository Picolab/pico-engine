ruleset io.picolabs.key-defined {
    meta {
        name "key-defined"
        description <<
This is a test file for a module that only stores API keys
        >>

        key foo "foo key just a string"
        key bar {
            "baz": "baz subkey for bar key",
            "qux": "qux subkey for bar key"
        }
        key quux "this key is not shared"
        key quuz "this is shared to someone else"
        provides blah
        provides keys quuz to io.picolabs.key-used2
        provides keys foo, bar to io.picolabs.key-used, io.picolabs.key-used2, io.picolabs.key-used3
    }
    global {
        blah = "this is here to test that 'provides' is not stomped over by 'provides keys'"
    }

}
