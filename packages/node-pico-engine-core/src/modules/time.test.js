var test = require("tape");
var time = require("./time")().def;
var cocb = require("co-callback");

test("time module", function(t){
    cocb.run(function*(){
        var ctx = {};

        t.ok(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ$/.test(yield time.now(ctx, [])));

        t.equals(
          yield time["new"](ctx, ["2010-08-08"]),
          "2010-08-08T00:00:00.000Z",
          "Date only-defaults to 00:00"
        );

        /*
        //TODO a string formatted as described in ISO8601 (v2000).
        //TODO http://www.probabilityof.com/iso/8601v2000.pdf
        t.equals(
          yield time["new"](ctx, ["67342"]),
          "1967-12-08T00:00:00.000Z",
          "Year DayOfYear"
        );

        t.equals(
          yield time["new"](ctx, ["2011W206T1345-0600"]),
          "2011-05-21T19:45:00.000Z",
          "Year WeekOfYear DayOfWeek"
        );

        t.equals(
          yield time["new"](ctx, ["083023Z"]),
          "2010-10-05T08:30:23.000Z",
          "Time only—defaults to today"
        );
        */

        t.equals(
          yield time["add"](ctx, ["2017-01-01", {years: -2017}]),
          "0000-01-01T00:00:00.000Z"
        );
        t.equals(
          yield time["add"](ctx, ["2017-01-01", {months: -22}]),
          "2015-03-04T00:00:00.000Z"
          //TODO "2015-03-01T00:00:00.000Z"
        );
        t.equals(
          yield time["add"](ctx, ["2010-08-08", {weeks: 5}]),
          "2010-09-12T00:00:00.000Z"
        );
        t.equals(
          yield time["add"](ctx, ["2010-08-08T05:00:00", {hours: 3}]),
          "2010-08-08T08:00:00.000Z"
        );
        t.equals(
          yield time["add"](ctx, ["2017-01-01", {days: -10}]),
          "2016-12-22T00:00:00.000Z"
        );
        t.equals(
          yield time["add"](ctx, ["2017-01-01", {minutes: 2, seconds: 90}]),
          "2017-01-01T00:03:30.000Z"
        );


        var xTime = "Oct 6, 2010 6:25:55 PM";
        t.equals(
          yield time["strftime"](ctx, [xTime, "%F %T"]),
          "2010-10-06 18:25:55"
        );
        t.equals(
          yield time["strftime"](ctx, [xTime, "%A %d %b %Y"]),
          "Wednesday 06 Oct 2010"
        );

    }, t.end);
});
