# One pico per resource

Some things should be used by only one party at a time: a motor, a GPIO pin, a printer, an account with an outside service. Give each one its own pico. Everything else asks that pico, by event, to use the resource. Because a pico handles one event at a time, its rulesets are the only code that touches the resource, and requests can't collide.

A Pico Labs rover project did this with its wheels. Each of four wheel picos kept the index of the one motor it drove, and only its rules called the motor driver:

```krl
rule set_motor_index {
  select when rover motor_index_assigned
  always {
    ent:motor_index := event:attr("motor_index")
  }
}
```

A controller pico had a channel to each wheel. To move, it sent each wheel the direction that wheel should turn:

```krl
to_wheels = defaction(type, fr, fl, br, bl) {
  every {
    event:send({"eci": ent:wheels{"FR"}, "domain": "rover", "type": type, "attrs": fr})
    event:send({"eci": ent:wheels{"FL"}, "domain": "rover", "type": type, "attrs": fl})
    event:send({"eci": ent:wheels{"BR"}, "domain": "rover", "type": type, "attrs": br})
    event:send({"eci": ent:wheels{"BL"}, "domain": "rover", "type": type, "attrs": bl})
  }
}
forward = defaction() {
  to_wheels("run", {"direction": "fwd"}, {"direction": "back"}, {"direction": "back"}, {"direction": "fwd"})
}
```

The controller could have driven the motors itself. But then every new pico that needed the wheels would need the motor code too, and two of them could drive the same motor at once. With a pico per wheel, any number of controllers can share the wheels safely.

Keep the channels to the resource picos in relationships (or, for children, in their family channels), not in ECIs written into the code. The original rover hard-coded them, and noted that relationships would be much better.

*From the Pico Labs KRL Cookbook page "Singleton Pattern".*
