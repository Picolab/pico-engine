# Eventex Examples

The following examples give scenarios and sample eventexes that might be used to recognize each scenario. All these assume the presence of event generators that can recognize events of interest and that are properly configured.

## Example 1: Large Withdrawals

This scenario is fairly common and a feature built into many banking sites. The eventex selects when there is a withdrawal event where the parameter amount is over a certain limit.

```
select when bank withdrawal where event:attr("amount") > 100
```

## Example 2: Too Many Withdrawals

You may be interested to know when the number of withdrawals from an account passes a certain threshold during the business day:

```
select when count 4 (bank withdrawal)
              between(at(time:new("8:00:00 MST")),
              at(time:new("17:00:00 MST")))
```

## Example 3: Too Many Withdrawals in 24 Hours

Rather than focusing on the business day, which might be too specific for a world of ATMs, you can use a relative time expression to match when there are four withdrawals in a 24-hour period:

```
select when count 4 (bank withdrawal) within 24 hours
```

## Example 4: Too Many Withdrawals over a Limit

You can add a limit to match only a specific number of withdrawals that are over a threshold ($100 in this case):

```
select when count 4 (bank withdrawal where event:attr("amount") > 100) within 24 hours
```

## Example 5: Withdrawal after a Deposit

A withdrawal following a deposit matches when the withdrawal amount is greater than the deposit:

```
select when bank deposit amount re#(\d+)# setting(dep_amt)
     before bank withdrawal where event:attr("amount") > dep_amt
```

## Example 6: Withdrawal after a Deposit with a Limit

A withdrawal following a deposit matches when the withdrawal amount is greater than the deposit or greater than a threshold:

```
select when bank deposit amount re#(\d+)# setting(dep_amt)
     before bank withdrawal where event:attr("amount") > dep_amt || event:attr("amount") > 100
```

Note that one may combine pattern matching with the `where` event expression, in order to bind an event attribute to a name for convenience. The previous eventex is equivalent to this:

```
select when bank deposit amount re#(\d+)# setting(dep_amt)
     before bank withdrawal amount re#(\d+)# setting(withd_amt)
     where withd_amt > dep_amt || withd_amt > 100
```

## Example 7: Phone Call with a Follow-Up SMS

You are interested in knowing when a phone call is received within one hour of an SMS being received from the same number:

```
select when phone inbound_call from re#(.*)# setting (num)
     before phone sms_received where event:attr("from").match(num.as("RegExp"))
   within 1 hour
```

## Example 8: Too Many Phone Calls

Match when there is more than a threshold number of phone calls in a given time period:

```
select when repeat 5 (phone inbound_call) within 20 minutes
```

## Example 9: Too Many Phone Calls from One Number

Match when there is more than a threshold number of phone calls from the same number in a given time period:

```
select when repeat 5 (phone inbound_call from re#.*#) push(nums)
   within 20 minutes
```

> **Note:** You don't actually check that the numbers are the same in the eventex; you merely push them onto an array. A condition in the rule associated with this eventex can check to ensure they're the same. This is a good example that some complicated event scenarios require more complicated processing than can be accomplished in an eventex alone.

## Example 10: Looking at Travel Sites

Match pageview events that appear to be focusing on travel-related sites:

```
select when any 2 (web pageview url re#orbitz#,
            web pageview url re#kayak#,
            web pageview url re#priceline#,
            web pageview url re#travelocity#,
            web pageview url re#expedia#)
```

## Example 11: Looking for Support

Match when the user calls the support number within one day of visiting the support Web site:

```
select when phone inbound_call from app:support_number
        and web pageview where event:attr("url").match(app:support_website)
  within 1 day
```

Note that this example uses application variables for the support number and Web site regular expressions. The use of the `and` operator means that either could happen first.

## Example 12: Find News Articles That Affect Stock Price

Match when an RSS feed contains a story that includes a stock-ticker symbol and the price of that same stock goes up by more than 2 percent within 10 minutes:

```
select when rss item content re#Stock Symbol: (\w+)# setting (symbol)
     before stock price_change where event:attr("direction") == "up" && event:attr("ticker") == symbol && event:attr("percent") > 2
  within 10 minutes
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189883) (last edited there 2019-01-09).</small>
