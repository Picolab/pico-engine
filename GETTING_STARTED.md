# pico-engine

## UI
Once you have started the pico-engine, 
as described in the [README](https://github.com/Picolab/node-pico-engine/blob/master/README.md),
there is a web server running on your local machine.

There are three user interfaces, which are (assuming you used the default PORT):
* "old UI" at localhost:8080/old
* "current UI" at localhost:8080
* "visual UI" at localhost:8080/genvis.html

Look at each of them, and keep them open in tabs for future reference.

## Bootstrap
Using the current UI, add a Pico and then a channel within it named "main" of
type "secret".
Now if you refresh the visual UI, 
and click on the "Owner Pico" you'll see its information in the "About" tab.

Nothing can be done with your Pico until you add rulesets to it.

## Rulesets
Each ruleset is written in [KRL](https://en.wikipedia.org/wiki/Kinetic_Rule_Language) and the
two rulesets that you need to get started are in the folder [krl](https://github.com/Picolab/node-pico-engine/tree/master/krl)
in this repository.

A ruleset must be registered with the engine, have an enabled version which is also installed, and finally it must be
added to a Pico.

### Preparing a ruleset for use
1. Copy the entire content of a .krl file into the clipboard
2. Paste it into the box beside the "register ruleset" button in the old UI 
3. Click the "register ruleset" button to register a version of the ruleset, then refresh. note the new time stamp and version hash of your new registered ruleset.
4. Click the "enable" link beside the version of the ruleset, navigate back to old UI and refresh. note that source code of your ruleset is displayed. 
5. Still in the old UI, click the "install" link beside the enabled version, this may take a minute so grab a soda. navigate back to old UI and refresh.
6. Refresh the visual UI, click on the Owner Pico, then on its Rulesets tab
7. Find your ruleset in the dropdown under "Available rulesets", then click on the "add ruleset" button
(click browser back button and refresh)

Repeat the steps above for each of the two rulesets in the `krl` folder.
 * `io.picolabs.pico` is used by each Pico to keep track of itself and its children
 * `io.picolabs.visual_params` is used by each Pico to keep track of it in the visual UI
 
## Using the visual UI

Click on the Owner Pico, then on the "About" tab. There is a link next to its "ID"
labelled "send event pico/root_created". Click on this link to complete the bootstrap.

With the rulesets installed, you can now drag the rounded rectangle of your Pico and drop it
wherever you want it. In its "About" tab (click on it to reveal the tabs) you can change its
display name and color.

Also, in the "About" tab you can add child Picos, and delete them.

In the "Rulesets" tab you can see the information held for your Pico by each of its rulesets,
and you can view the source code of each ruleset.

To make your own ruleset, write your code in the box in the "Rulesets" tab.
Make sure you keep a copy of it, either in your clipboard or in a file.
Click on the "compile ruleset" button to see any compilation errors.
After the ruleset compiles correctly (you'll see text like that shown below),
click the browser back button, refresh, and return to the "Rulesets" tab.
Paste in your source code and click the "register ruleset" button.
Finally, perform steps 4-7 of the section "Preparing a ruleset for use" and test your new ruleset.

```
{
  "code": "module.exports = {\n  \"name\": \"ruleset.name\",\n  \"meta\": {},\n  \"rules\": {}\n};"
}
```

## Child Picos
With both rulesets added to the Owner Pico, you can create child Picos from its "About" tab.
To do so, click the "add child pico" button.

As part of the add child operation, the pico ruleset automatically adds the two rulesets to
each newly created child Pico.
