ruleset com.example.thermostat {
  meta {
    name "Thermostat"
    use module io.picolabs.xmlui alias ui
    shares readings, threshold, dashboard, settings, readingHistory
  }
  global {
    /**
     * Recent readings, newest first (updates after thermostat new_reading).
     * @returns Array
     * @example "history" {}
     */
    readings = function() {
      ent:readings.defaultsTo([]).reverse()
    }

    /**
     * Alert threshold in degrees F
     * @returns Number
     * @example "default" {}
     */
    threshold = function() {
      ent:threshold.defaultsTo(80)
    }

    /**
     * Readings as a table. Props: rows (Array of { time, temperature }).
     * @component
     */
    readingHistory = function() {
      <<
<Component name="ReadingHistory">
  <Table data="{$props.rows}">
    <Column bindTo="time" header="Time" />
    <Column bindTo="temperature" header="Temperature (F)" />
  </Table>
</Component>
>>
    }

    /**
     * Current temperature and history. Display picks the theme, using the
     * shared PicoSettings, PicoThemeField, and PicoTheme components.
     * @view "Dashboard"
     */
    dashboard = function() {
      <<
<Component name="Dashboard">
  #{ui:query("readings", "readings", {"rid": meta:rid})}
  #{ui:query("threshold", "threshold", {"rid": meta:rid})}
  <PicoSettings id="display" title="Display">
    <PicoThemeField />
  </PicoSettings>
  <PicoTheme>
    <HStack horizontalAlignment="end">
      <Button label="Display" onClick="display.open()" />
    </HStack>
    <Card title="Now: {readings.value[0].temperature} F"
          subtitle="Alert above {threshold.value} F" />
    <ReadingHistory rows="{readings}" />
  </PicoTheme>
</Component>
>>
    }

    /**
     * Change the alert threshold
     * @view "Settings"
     */
    settings = function() {
      <<
<Component name="Settings">
  #{ui:query("threshold", "threshold", {"rid": meta:rid})}
  #{ui:event("setThreshold", "thermostat", "threshold_set",
             {"rid": meta:rid, "refresh": ["threshold"], "confirm": "Change the alert threshold?"})}
  <Form data="{{ threshold: threshold.value }}"
        onSubmit="(toSave) => setThreshold.execute(toSave)">
    <FormItem bindTo="threshold" label="Alert above (F)" type="integer" />
  </Form>
</Component>
>>
    }

    viewer_tags = ["thermostat", "viewer"]
    admin_tags = ["thermostat", "admin"]
  }

  /**
   * Record a temperature reading (shown on the Dashboard view).
   * @attr temperature Number Degrees Fahrenheit
   * @example "room temperature" { "temperature": "72" }
   * @example "warm alert" { "temperature": "85" }
   */
  rule record_reading {
    select when thermostat new_reading
      temperature re#(.+)# setting(temperature)
    fired {
      ent:readings := ent:readings.defaultsTo([])
        .append({"temperature": temperature.as("Number"), "time": time:now()})
    }
  }

  /**
   * Set the alert threshold (same as the Settings view form).
   * @attr threshold Number Degrees Fahrenheit
   * @example "alert at 80 F" { "threshold": "80" }
   * @example "alert at 75 F" { "threshold": "75" }
   */
  rule set_threshold {
    select when thermostat threshold_set
      threshold re#^(\d+)$# setting(threshold)
    fired {
      ent:threshold := threshold.as("Number")
    }
  }

  rule create_app_channels {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    every {
      ui:create_app_channel(viewer_tags, [], ["readings", "threshold", "dashboard"], meta:rid)
      ui:create_app_channel(admin_tags, ["thermostat"], null, meta:rid)
    }
  }
}
