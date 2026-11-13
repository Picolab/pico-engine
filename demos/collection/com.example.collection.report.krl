/**
 * Room report: uses com.example.collection as a module. It asks every member
 * for its reading over the relationship, averages the temperatures, and shows
 * them on a page. It knows nothing about how members join; that is the
 * collection ruleset's job.
 */
ruleset com.example.collection.report {
  meta {
    name "Room report"
    description "Reports the temperature of every room in the collection."
    author "PICOLABS"

    use module com.example.collection alias collection
    use module io.picolabs.subscription alias subscription
    use module io.picolabs.xmlui alias ui

    shares report, rejections, reportPage
  }

  global {
    channel_tags = ["collection", "app"]
    room_rid = "com.example.collection.room"

    readingOf = function(bus) {
      reading = subscription:queryOnSub(bus{"Id"}, room_rid, "reading")
      row = {"Id": bus{"Id"}, "name": reading{"name"}, "temperature": reading{"temperature"}}
      row
    }

    /**
     * Every member's reading, and the average temperature.
     * @returns Map { members, count, average }
     */
    report = function() {
      rows = collection:members().map(readingOf)
      temperatures = rows
        .map(function(row) { row{"temperature"} })
        .filter(function(t) { t.typeof() == "Number" })
      average = temperatures.length() > 0
        => math:round(temperatures.reduce(function(a, b) { a + b }, 0) / temperatures.length(), 1)
        | null
      result = {"members": rows, "count": rows.length(), "average": average}
      result
    }

    /**
     * Requests the collection turned away.
     * @returns Array of { name, role, time }
     */
    rejections = function() {
      collection:rejections()
    }

    /**
     * The rooms in the collection and their temperatures.
     * @view "Rooms"
     */
    reportPage = function() {
      report_url = ui:query_url("report", meta:rid, meta:eci)
      rejections_url = ui:query_url("rejections", meta:rid, meta:eci)
      remove_url = ui:event_url("collection", "member_removal_requested")
      <<
<Component name="ReportPage">
  <DataSource id="report" url="#{report_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="3" />
  <DataSource id="rejected" url="#{rejections_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="3" />
  <APICall id="remove" method="post" url="#{remove_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="report.refetch()" />
  <PicoTheme>
    <Card title="Rooms"
          subtitle="{report.value.count + ' rooms in the collection' + (report.value.average === null ? '' : ', averaging ' + report.value.average + ' F')}" />
    <Table data="{report.value.members}">
      <Column bindTo="name" header="Room" />
      <Column bindTo="temperature" header="Temperature (F)" />
      <Column header="">
        <Button label="Remove" variant="outlined" onClick="remove.execute({Id: $item.Id})" />
      </Column>
    </Table>
    <Card title="Turned away" subtitle="Requests to join in a role other than member." />
    <Table data="{rejected}">
      <Column bindTo="name" header="Pico" />
      <Column bindTo="role" header="Asked to be" />
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["collection"], ["report", "rejections", "reportPage"], meta:rid)
  }
}
