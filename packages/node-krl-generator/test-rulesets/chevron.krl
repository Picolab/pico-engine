ruleset io.picolabs.chevron {
    meta {
        description <<
Hello Chevrons!
        >>

        shares d
    }
    global {
        a = 1
        b = 2
        c = "<h1>some<b>html</b></h1>"
        d = <<
            hi #{a} + #{b} = #{1 + 2}
            #{c}
        >>
        e = <<static>>
        f = <<>>
    }

}
