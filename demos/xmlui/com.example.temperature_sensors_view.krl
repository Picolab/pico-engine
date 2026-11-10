/**
 * Demo XMLUI view: shows readings from `com.example.temperature_sensors` on **another** pico.
 *
 * Install `demos/xmlui/temperature_sensors.krl` on the **data** pico and this ruleset on the **view** pico.
 *
 * **DID / layer-2 relationships:** do **not** pass `Remote Tx DID` (`did:peer:…`) to `wrangler:picoQuery` —
 * that is not a channel ECI. Use the **relationship id** (same `Id` on both picos in Developer UI → Relationships)
 * and `io.picolabs.subscription:queryOnSub` (wired below).
 *
 *   raise temperature_sensors_view event "link_data_pico" attributes { "relationship_id": "<Id>" }
 *
 * **Legacy ECI relationships:** the established bus has a real **Remote Tx ECI**; you could call
 * `wrangler:picoQuery` on that ECI directly, but `queryOnSub` still works if you store `relationship_id`.
 *
 * (`latestReadingsForView` is empty until `ent:sensors_relationship_id` is set.)
 *
 * The data pico's `readingAt` is a UTC string and `timestamp` is epoch milliseconds.
 * This ruleset ignores that string and formats `timestamp` as Mountain Standard Time
 * (UTC−7) before the table renders it.
 *
 * Open: Developer UI → View, or `/ui/<view-app-eci>/com.example.temperature_sensors_view/`
 */
ruleset com.example.temperature_sensors_view {
  meta {
    name "Temperature sensors (demo view)"
    use module io.picolabs.subscription alias sub
    use module io.picolabs.xmlui alias ui
    shares dashboard, latestReadingsForView
  }

  global {
    sensors_rid = "com.example.temperature_sensors"

    /**
     * Format a UTC epoch-millisecond timestamp as Mountain Standard Time.
     * `time:new` returns an ISO-8601 UTC string. Subtracting the offset first
     * makes the date and clock in that string the MST reading time.
     * @param timestamp Number milliseconds since the Unix epoch
     * @returns String "YYYY-MM-DD HH:MM:SS MST"
     */
    readingAtMst = function(timestamp) {
      // Mountain Standard Time is a fixed seven hours behind UTC.
      mst_offset_ms = 7 * 60 * 60 * 1000
      iso = time:new(timestamp - mst_offset_ms)
      date = iso.split("T")[0]
      clock = iso.split("T")[1].split(".")[0]
      date + " " + clock + " MST"
    }

    /**
     * Readings from the data pico, with `readingAt` rewritten to MST.
     * @returns Array
     */
    latestReadingsForView = function() {
      readings = ent:sensors_relationship_id.isnull() => [] |
        sub:queryOnSub(ent:sensors_relationship_id, sensors_rid, "latestReadings", {})
      readings.isnull() => readings |
        readings.typeof() == "Array" => readings.map(function(row) {
          row.put("readingAt", readingAtMst(row{"timestamp"}))
        }) | readings
    }

    /**
     * @view "Dashboard"
     */
    dashboard = function() {
      <<<Component name="Dashboard">
  #{ui:query("readings", "latestReadingsForView", {"rid": meta:rid})}
  <Card title="Latest temperatures" subtitle="UTC timestamps from the data pico, shown here as MST" />
  <Table data="{readings}">
    <Column bindTo="name" header="Sensor" />
    <Column bindTo="lastTemperature" header="Temp (F)" />
    <Column bindTo="readingAt" header="Reading at (MST)" />
    <Column bindTo="timestamp" header="Timestamp (ms)" />
  </Table>
</Component>
>>
    }
  }

  /**
   * Store the relationship id (established subscription bus `Id`, same string on both picos).
   * @attr relationship_id String e.g. from Relationships tab next to the relationship name
   */
  rule link_data_pico {
    select when temperature_sensors_view link_data_pico
      relationship_id re#(.+)# setting(relationship_id)
    fired {
      ent:sensors_relationship_id := relationship_id
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    // Pass null for queries so the channel allows every shared query on this RS
    // (including `dashboard`, which @view needs for Main.xmlui). A narrow list that
    // omits the view query leaves viewQueriesOnChannel empty → Main.xmlui fails.
    ui:create_app_channel(
      ["temperature_sensors_view", "app"],
      ["temperature_sensors_view"],
      null,
      meta:rid
    )
  }
}
