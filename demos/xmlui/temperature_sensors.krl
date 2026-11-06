/**
 * Demo data ruleset: `latestReadings` returns a fixed array (no `picoQuery`).
 * Install on the **data** pico. The view demo (`com.example.temperature_sensors_view`)
 * queries this ruleset over a relationship/subscription Tx (`wrangler:picoQuery`).
 *
 * Shape per row: `name`, `lastTemperature`, `readingAt`, `timestamp`.
 */
ruleset com.example.temperature_sensors {
  meta {
    name "Temperature sensors (static demo)"
    description "Static sample readings for XMLUI demos"
    provides latestReadings
    shares latestReadings
  }

  global {
    /**
     * Fixed sample readings (replace with real data or `ent:` when you are ready).
     * @returns Array
     */
    latestReadings = function() {
      [
        {
          "name": "Sensors:Beehive",
          "lastTemperature": 51.47,
          "readingAt": "2026-11-06 19:11:14 Coordinated Universal Time",
          "timestamp": 1793992274126
        },
        {
          "name": "Sensors:Cabin Crawl Space",
          "lastTemperature": 55.4,
          "readingAt": "2026-11-06 19:01:48 Coordinated Universal Time",
          "timestamp": 1793991708383
        },
        {
          "name": "Sensors:Cabin North Side",
          "lastTemperature": 38.46,
          "readingAt": "2026-11-06 18:59:45 Coordinated Universal Time",
          "timestamp": 1793991585382
        },
        {
          "name": "Sensors:Pump House",
          "lastTemperature": 51.15,
          "readingAt": "2026-11-06 19:01:24 Coordinated Universal Time",
          "timestamp": 1793991684238
        },
        {
          "name": "Sensors:Triple Temp",
          "lastTemperature": 51.08,
          "readingAt": "2026-11-06 19:11:54 Coordinated Universal Time",
          "timestamp": 1793992314892
        }
      ]
    }
  }
}
