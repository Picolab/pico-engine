ruleset com.example.fav_color {
  meta {
    name "Favorite color"
    use module io.picolabs.xmlui alias ui
    shares favColor, colorView
  }
  global {
    /** Current favorite color */
    favColor = function() {
      {"name": ent:colorname, "code": ent:colorcode}
    }

    /**
     * Pick a favorite color
     * @view "Favorite color"
     */
    colorView = function() {
      <<<Component name="ColorView">
  #{ui:query("fav", "favColor", {"rid": meta:rid})}
  <Text when="{!fav.value.name}">You have not yet selected a favorite color.</Text>
  <Card when="{fav.value.name}" title="Your favorite color: {fav.value.name}" />
  #{ui:event("pick", "fav_color", "fav_color_selected", {"rid": meta:rid, "refresh": ["fav"]})}
  <Form onSubmit="(toSave) => pick.execute(toSave)">
    <FormItem bindTo="fav_color" label="Color (#rrggbb, hex digits a–f or A–F)" />
  </Form>
</Component>
>>
    }
  }

  rule recordFavColor {
    select when fav_color fav_color_selected
      fav_color re#^(\#[a-fA-F0-9]{6})$# setting(fav_color)
    fired {
      ent:colorcode := fav_color
      ent:colorname := fav_color
    }
  }
}
