# pico-engine

## Starting the pico-engine
Install by:
 * `git clone https://github.com/Picolab/node-pico-engine`
 * `npm install`

Start with:
 * `npm start`

## UI
Once you have started the pico-engine, 
there is a web server running on your local machine.

## Bootstrap
Visit the Pico Bootstrap page at `localhost:8080`
(assuming you use the default PORT).
As it loads, the page will automatically perform
a number of operations,
notably creating a root Pico and registering
two rulesets.

Follow the instructions on this page to complete
the bootstrap.

There are two rulesets which you will have installed:
 * `io.picolabs.pico` is used by each Pico to keep track of itself and its children
 * `io.picolabs.visual_params` is used by each Pico to keep track of it in the My Picos page
 
## Using the My Picos page

With the rulesets installed, you can now drag the rounded rectangle of your Pico and drop it
wherever you want it. In its "About" tab (remember to click on it to reveal the tabs) you can change its
display name and color.

Also in the "About" tab, you can add and delete child Picos.

In the "Rulesets" tab you can see the information held for your Pico by each of its rulesets.
By clicking on a ruleset id,
you will be taken to the Engine Rulesets page
where you can see its source code.

To make your own ruleset, write your code in the box in the
Engine Rulesets page.
Use the "compile" button until the code compiles.
Then use the "register" button to register this version
of your code with the engine.
Use the "enable" button to enable this version,
and the "install" button to have the engine save away
the compiled code for use.

## Child Picos
With both rulesets added to the Owner Pico, you can create child Picos from its "About" tab.
To do so, click the "add child pico" button.

As part of the add child operation, the pico ruleset automatically adds the two rulesets to
each newly created child Pico.
