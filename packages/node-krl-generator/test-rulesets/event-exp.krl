ruleset io.picolabs.event-exp {
    rule before {
        select when ee_before a
            before
            ee_before b;

        send_directive("before");
    }
    rule after {
        select when ee_after a
            after
            ee_after b;

        send_directive("after");
    }
    rule then {
        select when ee_then a
            then
            ee_then b name re#bob#;

        send_directive("then");
    }
    rule and {
        select when ee_and a
            and
            ee_and b;

        send_directive("and");
    }
    rule or {
        select when ee_or a
            or
            ee_or b;

        send_directive("or");
    }
    rule between {
        select when ee_between a between(
            ee_between b,
            ee_between c
        );

        send_directive("between");
    }
    rule not_between {
        select when ee_not_between a not between(
            ee_not_between b,
            ee_not_between c
        );

        send_directive("not between");
    }
    rule and_or {
        select when (
                ee_andor a
                and
                ee_andor b
            )
            or
            ee_andor c;

        send_directive("(a and b) or c");
    }
    rule or_and {
        select when ee_orand a
            and
            (
                ee_orand b
                or
                ee_orand c
            );

        send_directive("a and (b or c)");
    }
    rule before_n {
        select when before(
            ee_before_n a,
            ee_before_n b,
            ee_before_n c
        );

        send_directive("before_n");
    }
    rule after_n {
        select when after(
            ee_after_n a,
            ee_after_n b,
            ee_after_n c
        );

        send_directive("after_n");
    }
    rule then_n {
        select when then(
            ee_then_n a,
            ee_then_n b,
            ee_then_n c
        );

        send_directive("then_n");
    }
    rule and_n {
        select when and(
            ee_and_n a,
            ee_and_n b,
            ee_and_n c
        );

        send_directive("and_n");
    }
    rule or_n {
        select when or(
            ee_or_n a,
            ee_or_n b,
            ee_or_n c,
            ee_or_n d
        );

        send_directive("or_n");
    }
    rule any {
        select when any 2 (
            ee_any a,
            ee_any b,
            ee_any c,
            ee_any d
        );

        send_directive("any");
    }
    rule count {
        select when count 3 (
            ee_count a
        );

        send_directive("count");
    }
    rule repeat {
        select when repeat 3 (
            ee_repeat a name re#bob#
        );

        send_directive("repeat");
    }
    rule count_max {
        select when count 3 (
            ee_count_max a b re#(\d+)#
        ) max(m);

        send_directive("count_max", {"m": m});
    }
    rule repeat_min {
        select when repeat 3 (
            ee_repeat_min a b re#(\d+)#
        ) min(m);

        send_directive("repeat_min", {"m": m});
    }
    rule repeat_sum {
        select when repeat 3 (
            ee_repeat_sum a b re#(\d+)#
        ) sum(m);

        send_directive("repeat_sum", {"m": m});
    }
    rule repeat_avg {
        select when repeat 3 (
            ee_repeat_avg a b re#(\d+)#
        ) avg(m);

        send_directive("repeat_avg", {"m": m});
    }
    rule repeat_push {
        select when repeat 3 (
            ee_repeat_push a b re#(\d+)#
        ) push(m);

        send_directive("repeat_push", {"m": m});
    }
    rule repeat_push_multi {
        select when repeat 5 (
            ee_repeat_push_multi a
                a re#(\d+)#
                b re#(\d+) (.*)#
        ) push(a, b, c, d);

        send_directive("repeat_push_multi", {
            "a": a,
            "b": b,
            "c": c,
            "d": d
        });
    }
    rule repeat_sum_multi {
        select when repeat 3 (
            ee_repeat_sum_multi a
                a re#(\d+)#
                b re#(\d+)#
        ) sum(a, b);

        send_directive("repeat_sum_multi", {
            "a": a,
            "b": b
        });
    }
}
