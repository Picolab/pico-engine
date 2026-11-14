/**
 * Querying JSON: the query() operator finds values in a map or array with a
 * JSONPath expression. The pico holds a fleet's vehicles, trips, and fill-ups
 * (the kind of data Fuse kept), and the page runs canned queries against it, or
 * one you type.
 */
ruleset com.example.json_query {
  meta {
    name "Querying JSON"
    description "Finds values in nested JSON with the query() operator and JSONPath."
    author "PICOLABS"

    use module io.picolabs.xmlui alias ui

    shares queryPage, fleetData, cannedQueries, runQuery
  }

  global {
    channel_tags = ["json_query", "app"]

    fleet = {
      "owner": {"name": "Ada Lovelace", "email": "ada@example.com"},
      "vehicles": [
        {
          "name": "Work truck",
          "make": "Ford", "model": "F-150", "year": 2022, "odometer": 48210,
          "trips": [
            {"date": "2026-11-02", "miles": 42.6, "category": "business", "cost": 9.8},
            {"date": "2026-11-03", "miles": 3.1, "category": "personal", "cost": 0.71},
            {"date": "2026-11-05", "miles": 118.4, "category": "business", "cost": 27.23}
          ],
          "fillups": [
            {"date": "2026-10-28", "gallons": 22.1, "price": 3.39},
            {"date": "2026-11-06", "gallons": 19.8, "price": 3.29}
          ]
        },
        {
          "name": "Family car",
          "make": "Toyota", "model": "Prius", "year": 2019, "odometer": 91877,
          "trips": [
            {"date": "2026-11-01", "miles": 12.0, "category": "personal", "cost": 1.2},
            {"date": "2026-11-04", "miles": 27.5, "category": "business", "cost": 2.75}
          ],
          "fillups": [
            {"date": "2026-11-03", "gallons": 8.4, "price": 3.35}
          ]
        },
        {
          "name": "Commuter",
          "make": "Chevrolet", "model": "Bolt", "year": 2023, "odometer": 15302,
          "trips": [
            {"date": "2026-11-02", "miles": 31.2, "category": "business", "cost": 1.4}
          ],
          "fillups": []
        }
      ]
    }

    /**
     * The fleet data the queries run against.
     * @returns Map
     */
    fleetData = function() {
      fleet
    }

    /**
     * Four queries to try, each showing a different part of JSONPath.
     * @returns Array
     */
    cannedQueries = function() {
      [
        {
          "label": "Every vehicle's name",
          "path": "$.vehicles[*].name",
          "explain": "Child selectors (.vehicles, .name) and the wildcard [*], which takes every element of the array."
        },
        {
          "label": "All the miles, at any depth",
          "path": "$..miles",
          "explain": "The descendant selector .. finds a member wherever it is, without spelling out the path to it."
        },
        {
          "label": "Business trips over 25 miles",
          "path": "$.vehicles[*].trips[?@.category == 'business' && @.miles > 25]",
          "explain": "A filter [?...] keeps the trips for which the test is true. @ is the trip being tested."
        },
        {
          "label": "Each vehicle's latest fill-up",
          "path": "$.vehicles[?count(@.fillups[*]) > 0].fillups[-1]",
          "explain": "A filter that calls count() skips the electric car, and [-1] takes the last element of each fillups array."
        }
      ]
    }

    /**
     * Run a JSONPath query against the fleet data.
     * @param path String "a JSONPath expression, starting with $"
     * @returns Map
     */
    runQuery = function(path) {
      result = fleet.query(path)
      answer = {"path": path, "count": result.length(), "result": result}
      answer
    }

    /**
     * Show the data, run a canned query, or type your own.
     * @view "Querying JSON"
     */
    queryPage = function() {
      data_url = ui:query_url("fleetData", meta:rid, meta:eci)
      canned_url = ui:query_url("cannedQueries", meta:rid, meta:eci)
      run_url = ui:query_url("runQuery", meta:rid, meta:eci)
      <<
<Component name="QueryPage" var.showData="{false}" var.path="" var.label="" var.explain="">
  <DataSource id="data" url="#{data_url}" headers="{appGlobals.auth}" />
  <DataSource id="canned" url="#{canned_url}" headers="{appGlobals.auth}" />
  <DataSource id="run" url="#{run_url}" headers="{appGlobals.auth}" queryParams="{{path: path}}" when="{path}" />
  <PicoTheme>
    <Card title="Querying JSON"
          subtitle="This pico holds a fleet's vehicles, trips, and fill-ups. Each button runs fleet.query(path) on the pico and shows what it returns." />
    <Button label="{showData ? 'Hide the JSON' : 'Show the JSON'}" onClick="showData = !showData" />
    <FlowLayout>
      <VStack width="{showData ? '50%' : '100%'}">
        <H3>Try a query</H3>
        <HStack wrapContent="true">
          <Items data="{canned.value}">
            <Button label="{$item.label}" variant="outlined"
                    onClick="path = $item.path; label = $item.label; explain = $item.explain" />
          </Items>
        </HStack>
        <Text>Or type your own JSONPath:</Text>
        <HStack>
          <TextBox id="own" initialValue="$.owner.email" width="*" />
          <Button label="Run it" onClick="path = own.value; label = 'Your query'; explain = ''" />
        </HStack>
        <Card when="{path}" title="{label}">
          <Text variant="code">fleet.query("{path}")</Text>
          <Text when="{explain}">{explain}</Text>
          <Text when="{run.value.error}" variant="secondary">{run.value.error}</Text>
          <Text when="{run.value.result}" variant="secondary">{run.value.count} {run.value.count == 1 ? 'value' : 'values'}:</Text>
          <Text when="{run.value.result}" variant="mono" preserveLinebreaks="true" value="{JSON.stringify(run.value.result, null, 2)}" />
        </Card>
      </VStack>
      <Card when="{showData}" width="50%" title="The fleet data">
        <ScrollViewer height="520px">
          <Text variant="mono" preserveLinebreaks="true" value="{JSON.stringify(data.value, null, 2)}" />
        </ScrollViewer>
      </Card>
    </FlowLayout>
  </PicoTheme>
</Component>
>>
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, [], ["queryPage", "fleetData", "cannedQueries", "runQuery"], meta:rid)
  }
}
