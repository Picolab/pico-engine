# Event Scenarios

Responding to individual events is useful, but event expressions are even more powerful when used to correlate events contextually. A contextually meaningful, related group of events is called an *event scenario*. Systems that deal with event scenarios are said to do "complex event processing."

For example, consider the simple scenario shown in the following figure. As you drive through town, your phone notifies you that the DVD you added to your Amazon wish list this morning is available and on sale at the Best Buy you're passing. You can't realize this scenario by recognizing an event that says you added something to your wish list or an event that indicates you're driving past Best Buy. To realize this scenario, you have to recognize the pattern of a DVD being added to the wish list before you drive past Best Buy. Combined, the two events automatically provide information that you'd otherwise have to synthesize yourself.
![Fig03-02.png](/krl/_media/1189889-Fig03-02.jpg)

 Complex event scenarios like this are not unusual. In fact, they make up the most interesting interactions one might have on the Live Web. You might be interested in knowing when someone is viewing a particular sequence of pages on your site or calling your support line after having sent a question by email. But creating these kinds of interactions is prohibitively expensive or even impossible using the old client-server model, with its silos of data. Complex event expressions that describe event scenarios make them easy to recognize.

Event scenarios provide much of the filtering necessary to make the potentially overwhelming streams of real-time data and events manageable. Without eventexes, the most common way to deal with complex scenarios programmatically is to build ad hoc logic that recognizes the event scenario and dispatches procedures to handle each scenario. Most modern Web applications have a chunk of logic for keeping track of the user's state in the application and then getting the user to the right functionality.

But you needn't approach this important task in an ad hoc fashion. As you've seen, eventexes provide a declarative means of recognizing individual events. Event expression language allows you to combine primitive event expressions to form compound event expressions that can be used to match the patterns of events that are common in complex event scenarios. By combining primitive events into event scenarios, developers can create sophisticated applications without needing them to manage the state machine that would be necessary to recognize those scenarios.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189889) (last edited there 2012-01-03).</small>
