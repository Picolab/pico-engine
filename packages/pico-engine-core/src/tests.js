require("./extractRulesetID.test");
require("./DB.test");
require("./PicoQueue.test");
require("./modules/http.test");
require("./modules/time.test");
require("./modules/engine.test");
require("./modules/event.test");
require("./modules/math.test");
require("./modules/random.test");
require("./cleanEvent.test");
require("./cleanQuery.test");
require("./runAction.test");
require("./Scheduler.test");
require("./migrations/20171031T182007_pvar_index.test.js");
require("./ChannelPolicy.test");

//run system tests last
require("./index.test");
