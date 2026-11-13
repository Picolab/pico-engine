# Rulesets

A ruleset is the primary means of program organization in KRL.  A ruleset is a collection of rules. Each rule is designed to respond to a specific event.

Rulesets are the primary means of organizing KRL programs. Modules and key repositories are simply rulesets that have been created using specific idioms.

Each ruleset has a Ruleset ID (`RID`). The `RID` is an important identifier used when referring to your ruleset. For example, your ruleset's `RID` is used when importing that ruleset as a module. It is also used in the engine and displayed in debug logs.

Each ruleset can have the following sections.

- [Meta Section](/krl/rulesets/meta-section)
- [Global Section](/krl/rulesets/global-section)
- [Rules](/krl/rulesets/rules/)

# Context

KRL is a rule language which is evaluated by the pico engine within the context of a specific pico.  The pico engine accepts *events* for picos and executes corresponding *rules* to change the state of a pico.

There are many things to know about KRL, in general, KRL is:

- event-based rule language.
- [executed in a pico engine](https://picolabs.atlassian.net/wiki/display/docs/Event+Loop+Introduction)
- executed in a system where identity is pervasive; all events are raised on behalf of a specific entity for a specific pico.
- pico-specific persistent storage; there is no need for external databases.

The result of these properties is a programming model that more closely resembles programming cloud-based persistent objects than anything else. We call these [persistent computational objects "***picos***"](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189992/Persistent+Compute+Objects).

# Rule Evaluation

The pico engine allows unique channel identifiers to be created for each pico.  [Channels](https://picolabs.atlassian.net/wiki/display/docs/Event+Channels) create http [event](https://picolabs.atlassian.net/wiki/display/docs/Events+and+Queries+Lesson) URL's.  The pico engine accepts http events on event URL's and evaluates any installed rules which select on the accepted event.

For a rule to be executed in a pico on an event, a ruleset must be

- registered with the pico engine with a unique ruleset ID or RID
- installed in the pico with the corresponding event channel

# How a Rule Runs

A rule is like the body of an `if` statement whose condition is its `select when`. Rules change a pico's state by setting persistent variables, and they raise and send events. Each part of a rule runs in order:

1. **[Select](/krl/rulesets/rules/the-select-statement).** The event expression decides whether the rule runs for this event. Rules in one ruleset that select the same event run in the order they're written.
2. **[Prelude](/krl/rulesets/rules/prelude/)** (`pre { }`). Declarations computed for the rest of the rule. They are names, not variables: each is declared once.
3. **[Action block](/krl/rulesets/rules/actions/).** An optional condition, `if <expr> then`, and the actions: one, several in [`every { }`](/krl/rulesets/rules/actions/compound-actions), or one picked by value with [`choose`](/krl/rulesets/rules/actions/compound-actions), KRL's case statement. The rule *fires* when the condition is true, or when there's no condition. A rule has one action block, and an action can't have an `else`.
4. **[Postlude](/krl/rulesets/rules/postlude/).** Where persistent variables are set and events are raised. Use one of `fired { }` (runs if the rule fired), `notfired { }` (if it didn't), or `always { }`. After `fired` or `notfired` can come an `else { }` for the opposite case, and then a `finally { }` for what happens either way.

Within a postlude, a statement can have a [guard](/krl/rulesets/rules/postlude/guard-conditions): `ent:count := 0 if reset`, or `raise … on final` in a loop. [`last`](/krl/rulesets/rules/postlude/control-statements) stops the rest of the ruleset's rules for this event.

For values that may be missing, use [`defaultsTo`](/krl/krl-expression-language/operators/universal-operators) or `||`, and for choosing between two values, the [conditional expression](/krl/krl-expression-language/conditional-expressions) `cond => a | b`.

# Ruleset Structure

This is a more in depth ruleset example with in line comments.

**rulesetExample.krl**

```javascript
ruleset rulesetExample{// "rulesetExample" is the RID, and must be unique in the engine
  //The meta block is where module declarations, ruleset names/descriptions, and logging declarations occur
  meta{
    name "Rule Example"
    description <<
      An example of how to build a ruleset
    >>
    author "CS462 TA"

    //You can use other modules (a.k.a. rulesets) that have functions or defactions that you want to use in this ruleset.
    //To use a function/defaction in another ruleset, call the module: io.picolabs.wrangler:someProvidedFunction(<pass in params here>)
    //The optional alias keyword shortens the above function call to: wrangler:someFunction(<pass in params here>)
    use module io.picolabs.wrangler alias wrangler

    //to use more than one module, do not separate with commas. Simply add a new line:
    use module someRulesetName

    //shares <give function/defaction names separated by commas>
    //the "shares" keyword means that anyone can call the shared function on this pico, so long as they have an authorized channel
    shares foo

    //provides <give function/defaction names separated by commas>
    //the "provides" keyword allows other rulesets that use this one (rulesetExample) as a module to call
    //the stated functions/defactions.
    provides foo, defFoo

    //NOTICE: This ruleset provides, but does not share defFoo, which is a defaction. To clarify, this means that any
    //ruleset using this ruleset (rulesetExample) as a module may call it, but outside sources querying this pico
    //do NOT have access to it.

    //historicaly used to enable and disable logs printing to the terminal where pico engine is running. This may be depricated
    logging on
  } //end meta

  //The place to declare global variables and functions
  global{
    //functions can be used in pre-blocks or called by queries on authorized channels to this pico
    foo = function(someValue, anotherValue){//pass any arbitrary number of parameters by separating with commas
      aReturnValue = someValue + " " + anotherValue;//just do whatever processing you might want. Put semicolons on every statement execution except the return statement
      aReturnValue //the last expression in a function is what will be returned. It can be a map, array, string, number etc, but not a function
    }

    //defactions can be called in action-blocks, and as such have slightly different syntax
    defFoo = defaction(someParam, anotherParam){
      //perform any needed pre-processing by simply writing code
      aProcessedBinding = someParam + " " + anotherParam;

      //then perform all action calls in an every block, including event:send(), send_directive() etc.
      every{
        //every action has a semicolon at the end of it save for the last action statement
        event:send(/* put params here */);
        send_directive("An Example Directive", { "processedValue": aProcessedBinding })
      }
      //You can also return values from a defaction with an optional returns statement
      returns
      //put the value you want to return here... it could be an array, map, number, string etc.
      "A temporary placeholder value."
    }

  } //end global

  //Then begin to declare rules
  //Rules are primarily made up of a name, select statement, a pre-block, an action-block, and a post-block
  rule exampleRule{//First: give the name
    //Second: the select statement tells the engine software when to run the following code. When events (NOT QUERIES)
    //are received, the engine matches up the domain name and type name with those given in the select statements of
    //rules on installed rulesets and queues them up to run. Rules in the same ruleset that select on the same domain and type
    //will be queued up from top going down. This garentees order of exacution within a single ruleset.
    select when exampleDomain exampleType

    //the pre-block is used for pre-processing, and is where you would want to call functions
    pre{
      resultOfFunction = foo("Hello,", "World!")
    }

    //the action-block performs defaction calls and other action calls, like send_directive() or event_send()
    //For the following, in place of "true", you can have any valid krl expression or boolean value. It follows
    //javascript truthy rules, meaning that any expression that evaluates to 0 will be false, other number values
    //will evaluate as true

    if true then //alternate ex: could use "if x > 5 then"
    every{//perform action calls separated by semicolons save for the last expression, just like in a defaction
      defFoo("Hello,", "World!") setting(returnedValue)//grab the result of a defaction using setting
    }

    //the post-block is used to set entity variables and raise new events on this pico in response to what happened in this event
    //A fired block will run if an action was executed (if the conditional statement above was true). A fired block may
    //be chained with an else block, which will run if the condition failed. Alternative post-blocks include "always{}".
    //A common pitfall includes writing a fired block but leaving out an action block (action blocks are optional). This
    //will ALWAYS fail, since no action block is run, and therefore the fired block will not run. Use an always block instead.

    fired{
      ent:someEntityVar := "Assign an entity variable like this!";
      raise exampleDomain event "exampleRuleSucceeded"
        attributes {};
    }else{
      ent:someEntityVar := {};
      raise exampleDomain event "exampleRuleFailed"
        attributes event:attrs();
    }

  }//end exampleRule

}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189862) (last edited there 2022-01-10).</small>
