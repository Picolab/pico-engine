ruleset com.example.contacts {
  meta {
    name "Contacts"
    use module io.picolabs.xmlui alias ui
    shares contacts, contact, contactsPage, detail
  }
  global {
    /**
     * All contacts, sorted by name
     * @returns Array
     */
    contacts = function() {
      ent:contacts.defaultsTo({}).values()
        .sort(function(a, b) { a{"name"} cmp b{"name"} })
    }

    /**
     * One contact
     * @param id Contact id
     * @returns Map
     */
    contact = function(id) {
      ent:contacts{id}
    }

    /**
     * Everyone, linking to each person's page
     * @view "Contacts" /list
     */
    contactsPage = function() {
      <<<Component name="ContactsPage">
  #{ui:query("contacts", "contacts", {"rid": meta:rid})}
  #{ui:event("add", "contacts", "contact_added", {"rid": meta:rid, "refresh": ["contacts"]})}
  <Form onSubmit="(data) => add.execute(data)">
    <FormItem bindTo="name" label="Name" required />
    <FormItem bindTo="email" label="Email" />
  </Form>
  <Table data="{contacts}">
    <property name="noDataTemplate">
      <Text value="No contacts" variant="strong" />
    </property>
    <Column header="Name">
      <Link to="/contact/{$item.id}">{$item.name}</Link>
    </Column>
    <Column bindTo="email" header="Email" />
  </Table>
</Component>
>>
    }

    /**
     * One person's details and notes
     * @view "Contact" /contact/:id
     */
    detail = function() {
      <<<Component name="Detail">
  #{ui:query("person", "contact", {"rid": meta:rid, "args": {"id": "{$routeParams.id}"}})}
  #{ui:event("note", "contacts", "note_added", {"rid": meta:rid, "refresh": ["person"]})}
  <Link to="/list">Back to contacts</Link>
  <H2>{person.value.name}</H2>
  <Text>{person.value.email}</Text>
  <List data="{person.value.notes}">
    <Text>{$item}</Text>
  </List>
  <Form onSubmit="(toSave) => note.execute({id: $routeParams.id, text: toSave.text})">
    <FormItem bindTo="text" label="Add a note" type="textarea" />
  </Form>
</Component>
>>
    }

    channel_tags = ["contacts", "app"]
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["contacts"], null, meta:rid)
  }

  rule seed_demo_contacts {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    pre {
      empty = ent:contacts.defaultsTo({}).isEmpty()
    }
    if empty then noop()
    fired {
      raise contacts event "contact_added" attributes {
        "name": "Ada Lovelace",
        "email": "ada@example.com"
      }
      raise contacts event "contact_added" attributes {
        "name": "Grace Hopper",
        "email": "grace@example.com"
      }
    }
  }

  /**
   * Add a contact
   * @attr name Full name
   * @attr email Email address
   */
  rule add_contact {
    select when contacts contact_added
      name re#(.+)# setting(name)
    pre {
      id = random:uuid()
    }
    fired {
      ent:contacts{id} := {"id": id, "name": name, "email": event:attr("email"), "notes": []}
    }
  }

  /**
   * Add a note to a contact
   * @attr id Contact id
   * @attr text The note
   */
  rule add_note {
    select when contacts note_added
      id re#(.+)#
      text re#(.+)#
      setting(id, text)
    pre {
      notes = ent:contacts{[id, "notes"]}
    }
    if notes then noop()
    fired {
      ent:contacts{[id, "notes"]} := notes.append(text)
    }
  }
}
