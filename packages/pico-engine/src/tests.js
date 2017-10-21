/* global Promise */
var test = require("tape");
var path = require("path");
var async = require("async");
var tempfs = require("temp-fs");
var startCore = require("./startCore");
var setupServer = require("./setupServer");

var startTestServer = function(callback){
    var is_windows = /^win/.test(process.platform);

    tempfs.mkdir({
        dir: path.resolve(__dirname, ".."),
        prefix: "pico-engine_test",
        recursive: true,//It and its content will be remove recursively.
        track: !is_windows//Auto-delete it on fail.
    }, function(err, dir){
        if(err) throw err;//throw ensures process is killed with non-zero exit code

        //try setting up the engine including registering rulesets
        startCore({
            host: "http://localhost:8383",
            home: dir.path,
            no_logging: true,
        }, function(err, pe){
            if(err) throw err;//throw ensures process is killed with non-zero exit code

            //setup the server without throwing up
            var testApp = setupServer(pe);
            testApp.listen("8383", function(){
                console.log("localhost:8383");
            });
            pe.getRootECI(function(err, root_eci){
                if(err) throw err;//throw ensures process is killed with non-zero exit code

                callback(null, {
                    pe: pe,
                    root_eci: root_eci,
                    stopServer: function(){
                        if(!is_windows){
                            dir.unlink();
                        }
                    },
                });
            });
        });
    });
};

test("pico-engine", function(t){
    var pe, root_eci, stopServer, child_count, child, channels ,channel, /*bill,*/ ted, carl,installedRids,parent_eci;
    var subscriptionPicos = {};
    var SHARED_A = "shared:A";
    var SUBS_RID = "io.picolabs.subscription";
    var dump = undefined;
    async.series([
        function(next){
            startTestServer(function(err, tstserver){
                if(err) return next(err);
                pe = tstserver.pe;
                root_eci = tstserver.root_eci;
                stopServer = tstserver.stopServer;
                next();
            });
        },

        ////////////////////////////////////////////////////////////////////////
        //
        //                      Wrangler tests
        //

        function(next){ // example , call myself function check if eci is the same as root.
            console.log("//////////////////Wrangler Testing//////////////////");
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "myself",
                args: {},
            }, function(err, data){
                if(err) return next(err);

                t.equals(data.eci, root_eci);

                next();
            });
        },
        ///////////////////////////////// channels testing ///////////////
        function(next){// store channels, // we don't directly test list channels.......
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                channels = data.channels;
                t.equal(channels.length > 0,true,"channels returns a list greater than zero");
                //console.log("channels",channels);
                //console.log("channels[0].sovrin",channels[0].sovrin);
                next();
            });
        },
        function(next){// create channels
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "channel_creation_requested ",
                attrs: {name:"ted",type:"type"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of createChannel: ",response.directives[0].options);
                t.deepEqual(response.directives[0].options.channel.name, "ted","correct directive");
                channel = response.directives[0].options.channel;
                ted = channel;
                next();
            });
        },
        function(next){// compare with store,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                console.log("//////////////////Channel Creation//////////////////");
                t.equals(data.channels.length > channels.length, true,"channel was created");
                t.equals(data.channels.length, channels.length + 1,"single channel was created");
                var found = false;
                for(var i = 0; i < data.channels.length; i++) {
                    if (data.channels[i].id === channel.id) {
                        found = true;
                        t.deepEqual(channel, data.channels[i],"new channel is the same channel from directive");
                        break;
                    }
                }
                t.equals(found, true,"found correct channel in deepEqual");//redundant check
                channels = data.channels; // update channels cache
                next();
            });
        },
        function(next){// create duplicate channels
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "channel_creation_requested ",
                attrs: {name:"ted",type:"type"}
            }, function(err, response){
                if(err) return next(err);
                t.deepEqual(response.directives,[],"duplicate channel create");// I wish this directive was not empty on failure........
                next();
            });
        },
        function(next){// compare with store,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.length, channels.length,"no duplicate channel was created");
                next();
            });
        },
        function(next){// create channel
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "channel_creation_requested ",
                attrs: {name:"carl",type:"typeC"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of createChannel: ",response.directives[0].options);
                //t.deepEqual(response.directives[0].options.channel.name, "carl","correct directive");
                channel = response.directives[0].options.channel;
                carl = channel;
                next();
            });
        },
        function(next){// create channel
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "channel_creation_requested ",
                attrs: {name:"bill",type:"typeB"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of createChannel: ",response.directives[0].options);
                //t.deepEqual(response.directives[0].options.channel.name, "bill","correct directive");
                channel = response.directives[0].options.channel;
                //bill = channel;
                next();
            });
        },
        function(next){// list channel given name,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {value:channel.name},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.id,channel.id,"list channel given name");
                next();
            });
        },
        function(next){// list channel given eci,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {value:channel.id},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.id,channel.id,"list channel given eci");
                next();
            });
        },
        function(next){// list channels by collection,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {collection:"type"},
            }, function(err, data){
                if(err) return next(err);
                console.log("///////list collection of channel");
                t.equals(data.channels["typeB"]  !== null , true ,"has typeB");
                t.equals(data.channels["typeC"]  !== null , true ,"has typeC");
                t.equals(data.channels["type"]   !== null , true ,"has type");
                t.equals(data.channels["secret"] !== null , true ,"has secret");
                console.log("///////");
                next();
            });
        },
        function(next){// list channels by filtered collection,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {collection:"type",filtered:"typeB"},
            }, function(err, data){
                if(err) return next(err);
                t.deepEquals(data.channels.length>0, true ,"filtered collection has at least one channels");// should have at least one channel with this type..
                t.deepEquals(data.channels[0].type,channel.type,"filtered collection of has correct type");// should have at least one channel with this type..
                next();
            });
        },
        function(next){// alwaysEci,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "alwaysEci",
                args: {value:channel.id},
            }, function(err, data){
                if(err) return next(err);
                //console.log("eci",data);
                t.equals(data,channel.id,"alwaysEci id");
                next();
            });
        },
        function(next){// alwaysEci,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "alwaysEci",
                args: {value:channel.name},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data,channel.id,"alwaysEci name");
                next();
            });
        },
        function(next){// eciFromName,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "eciFromName",
                args: {name:channel.name},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data,channel.id,"eciFromName");
                next();
            });
        },
        function(next){// nameFromEci,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "nameFromEci",
                args: {eci:channel.id},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data,channel.name,"nameFromEci");
                next();
            });
        },
        function(next){// store channels,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                channels = data.channels;
                next();
            });
        },
        function(next){
            console.log("//////////////////Channel Deletion//////////////////");
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "channel_deletion_requested ",
                attrs: {name:"ted"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of channel_deletion_requested: ",response.directives[0].options);
                t.deepEqual(response.directives[0].options.channel.name, "ted","correct directive");
                channel = response.directives[0].options.channel;
                next();
            });
        },
        function(next){// compare with store,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.length <= channels.length, true,"channel was removed by name");
                t.equals(data.channels.length, channels.length - 1 ,"single channel was removed by name");
                var found = false;
                for(var i = 0; i < data.channels.length; i++) {
                    if (data.channels[i].id === ted.id) {
                        found = true;
                        break;
                    }
                }
                t.equals(found, false,"correct channel removed");
                channels = data.channels;// store channels,
                next();
            });
        },
        function(next){
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "channel_deletion_requested ",
                attrs: {eci:carl.id}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of channel_deletion_requested: ",response.directives[0].options);
                t.deepEqual(response.directives[0].options.channel.name, "carl","correct directive");
                channel = response.directives[0].options.channel;
                next();
            });
        },
        function(next){// compare with store,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.length <= channels.length, true,"channel was removed by eci");
                t.equals(data.channels.length, channels.length - 1 ,"single channel was removed by eci");
                var found = false;
                for(var i = 0; i < data.channels.length; i++) {
                    if (data.channels[i].id === carl.id) {
                        found = true;
                        break;
                    }
                }
                t.equals(found, false,"correct channel removed");
                next();
            });
        },

        ///////////////////////////////// rulesets tests ///////////////
        function(next){// store installed rulesets,
            console.log("//////////////////Install single ruleset //////////////////");
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "installedRulesets",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                installedRids = data.rids;
                t.equal(installedRids.length > 0, true, "installed rids list is greater than zero");
                next();
            });
        },
        function(next){// attempt to install logging
            pe.signalEvent({
                eci: root_eci,
                eid: "94",
                domain: "pico",
                type: "install_rulesets_requested ",
                attrs: {rids:"io.picolabs.logging"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of install_rulesets_requested: ",response);
                t.deepEqual("io.picolabs.logging", response.directives[0].options.rids[0], "correct directive");
                //rids = response.directives[0].options.rids;
                next();
            });
        },
        function(next){// confirm installed rid,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "installedRulesets",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                var found = false;
                t.equals(data.rids.length >= installedRids.length, true,"ruleset was installed");
                t.equals(data.rids.length, installedRids.length + 1 ,"single ruleset was installed");
                for(var i = 0; i < data.rids.length; i++) {
                    if (data.rids[i] === "io.picolabs.logging") {
                        found = true;
                        break;
                    }
                }
                t.equals(found, true,"correct ruleset installed");
                next();
            });
        },
        function(next){// attempt to Un-install logging
            console.log("//////////////////Un-Install single ruleset //////////////////");
            pe.signalEvent({
                eci: root_eci,
                eid: "94",
                domain: "pico",
                type: "uninstall_rulesets_requested ",
                attrs: {rids:"io.picolabs.logging"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of uninstall_rulesets_requested: ",response.directives[0].options);
                t.deepEqual("io.picolabs.logging", response.directives[0].options.rids[0],"correct directive");
                next();
            });
        },
        function(next){// confirm un-installed rid,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "installedRulesets",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                var found = false;
                t.equals(data.rids.length <= installedRids.length, true,"ruleset was un-installed");
                t.equals(data.rids.length, installedRids.length  ,"single ruleset was un-installed");
                for(var i = 0; i < data.rids.length; i++) {
                    if (data.rids[i] === "io.picolabs.logging") {
                        found = true;
                        break;
                    }
                }
                t.equals(found, false,"correct ruleset un-installed");
                next();
            });
        },
        function(next){// attempt to install logging & subscriptions
            console.log("//////////////////Install two rulesets //////////////////");
            pe.signalEvent({
                eci: root_eci,
                eid: "94",
                domain: "pico",
                type: "install_rulesets_requested ",
                attrs: {rids:"io.picolabs.logging;io.picolabs.subscription"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of install_rulesets_requested: ",response.directives[0].options);
                t.deepEqual(["io.picolabs.logging","io.picolabs.subscription"], response.directives[0].options.rids, "correct directive");
                //rids = response.directives[0].options.rids;
                next();
            });
        },
        function(next){// confirm two installed rids,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "installedRulesets",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                var found = 0;
                t.equals(data.rids.length >= installedRids.length, true,"rulesets installed");
                t.equals(data.rids.length, installedRids.length + 2 ,"two rulesets was installed");
                for(var i = 0; i < data.rids.length; i++) {
                    if (data.rids[i] === "io.picolabs.logging"|| data.rids[i] === "io.picolabs.subscription") {
                        found ++;
                        //break;
                    }
                    if (data.rids[i] === "io.picolabs.logging"){
                        t.deepEqual(data.rids[i], "io.picolabs.logging","logging installed");
                    }
                    else if (data.rids[i] === "io.picolabs.subscription"){
                        t.deepEqual(data.rids[i], "io.picolabs.subscription","subscription installed");
                    }
                }
                t.equals(found, 2,"both rulesets installed");
                next();
            });
        },
        function(next){// attempt to Un-install logging & subscriptions
            console.log("////////////////// Un-Install two rulesets //////////////////");
            pe.signalEvent({
                eci: root_eci,
                eid: "94",
                domain: "pico",
                type: "uninstall_rulesets_requested ",
                attrs: {rids:"io.picolabs.logging;io.picolabs.subscription"}
            }, function(err, response){
                if(err) return next(err);
                //console.log("this is the response of uninstall_rulesets_requested: ",response.directives[0].options);
                t.deepEqual(["io.picolabs.logging","io.picolabs.subscription"], response.directives[0].options.rids, "correct directive");
                next();
            });
        },
        function(next){// confirm un-installed rid,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "installedRulesets",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                var found = 0;
                t.equals(data.rids.length <= installedRids.length, true,"rulesets un-installed");
                t.equals(data.rids.length, installedRids.length  ,"two rulesets un-installed");
                for(var i = 0; i < data.rids.length; i++) {
                    if (data.rids[i] === "io.picolabs.logging"|| data.rids[i] === "io.picolabs.subscription") {
                        found ++;
                        //break;
                    }
                }
                t.equals(found > 0, false ,"correct rulesets un-installed");
                next();
            });
        },
        ///////////////////////////////// rulesets info tests ///////////////
        function(next){// rule set info,
            console.log("////////////////// describe one rule set //////////////////");
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "rulesetsInfo",
                args: {rids:"io.picolabs.logging"},
            }, function(err, data){
                if(err) return next(err);
                //console.log("rulesetInfo",data.description);
                t.deepEqual(data.description.length, 1 ,"single rule set described");
                t.deepEqual("io.picolabs.logging",data.description[0].rid ,"correct ruleset described");
                t.equals(data.description[0].src !== undefined ,true,"has a src");
                next();
            });
        },
        function(next){// rule set info,
            console.log("////////////////// describe two rule sets //////////////////");
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "rulesetsInfo",
                args: {rids:"io.picolabs.logging;io.picolabs.subscription"},
            }, function(err, data){
                if(err) return next(err);
                //console.log("rulesetInfo",data);
                t.deepEqual(data.description.length, 2 ,"two rule sets described");
                t.deepEqual("io.picolabs.logging",data.description[0].rid ,"logging ruleset described");
                t.equals(data.description[0].src !== undefined ,true,"logging has a src");
                t.deepEqual("io.picolabs.subscription",data.description[1].rid ,"subscription ruleset described");
                t.equals(data.description[1].src !== undefined ,true,"subscription has a src");
                next();
            });
        },
        ///////////////////////////////// Register rule sets tests ///////////////
        ///wrangler does not have rules for this..
        ///it does have a function to list registered rule sets

        ///////////////////////////////// create child tests ///////////////
        function(next){// store created children
            console.log("//////////////////Create Child Pico//////////////////");
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "children",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                child_count = data.children.length;
                t.equal(Array.isArray(data.children), true,"children returns list.");
                next();
            });
        },
        function(next){// create child
            pe.signalEvent({
                eci: root_eci,
                eid: "84",
                domain: "pico",
                type: "new_child_request",
                attrs: {name:"ted"}
            }, function(err, response){
                //console.log("children",response);
                if(err) return next(err);
                t.deepEqual("ted", response.directives[0].options.pico.name, "correct directive");
                child = response.directives[0].options.pico; //store child information from event for deleting
                next();
            });
        },
        function(next){// list children and check for new child
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "children",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                //console.log("children",data);
                t.equals(data.children.length > child_count, true,"created a pico"); // created a child
                t.equals(data.children.length , child_count+1, "created a single pico"); // created only 1 child
                var found = false;
                for(var i = 0; i < data.children.length; i++) {
                    if (data.children[i].id === child.id) {
                        found = true;
                        t.deepEqual(child, data.children[i],"new pico is the same pico from directive");
                        break;
                    }
                }
                t.deepEqual(found, true,"new child pico found");//check that child is the same from the event above
                next();
            });
        },
        function(next){ // channel in parent created?
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {value:"ted"},
            }, function(err, data){
                if(err) return next(err);
                //console.log("parent_eci",data);
                t.equals(data.channels.name,"ted","channel for child created in parent");
                parent_eci = data.channels.id;
                next();
            });
        },
        function(next){ // parent channel stored in child?
            pe.runQuery({
                eci: child.eci,
                rid: "io.picolabs.pico",
                name: "parent_eci", args:{},
            }, function(err, data){
                if(err) return next(err);
                //console.log("parent_eci",data);
                t.equals(data.parent,parent_eci,"parent channel for child stored in child");
                next();
            });
        },
        function(next){
            pe.runQuery({
                eci: child.eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {value:"main"},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.name,"main","child 'main' channel created");
                next();
            });
        },
        function(next){
            pe.runQuery({
                eci: child.eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {value:"admin"},
            }, function(err, data){
                if(err) return next(err);
                t.equals(data.channels.name,"admin","child 'admin' channel created");
                next();
            });
        },
        function(next){// create duplicate child
            pe.signalEvent({
                eci: root_eci,
                eid: "84",
                domain: "pico",
                type: "new_child_request",
                attrs: {name:"ted"}
            }, function(err, response){
                //console.log("children",response);
                if(err) return next(err);
                t.deepEqual("Pico_Not_Created", response.directives[0].name, "correct directive for duplicate child creation");
                next();
            });
        },
        function(next){// create child with no name(random)
            pe.signalEvent({
                eci: root_eci,
                eid: "84",
                domain: "pico",
                type: "new_child_request",
                attrs: {}
            }, function(err, response){
                //console.log("children",response);
                if(err) return next(err);
                t.deepEqual("Pico_Created", response.directives[0].name, "correct directive for random named child creation");
                next();
            });
        },/*
        function(next){
            console.log("//////////////////Simple Pico Child Deletion//////////////////");
            pe.signalEvent({
                eci: root_eci,
                eid: "85",
                domain: "pico",
                type: "delete_child_request_by_pico_id",
                attrs: {name:"ted"}
            }, function(err, response){
                if(err) return next(err);
                console.log("this is the response of children_deletion_requested: ",response);
                console.log("engine: ",pe);
                //t.deepEqual(response.directives[0].options.channel.name, "ted","correct directive");
                //channel = response.directives[0].options.channel;
                next();
            });
        },
        function(next){// compare with store,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "children",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                console.log("data: ",data);
                next();
            });
        },*/

        ///////////////////////////////// Subscription tests ///////////////
        ///////////////// Subscription Request tests
        // create two children , A,B
        // install subscription rulesets
        // create well known DID's
        // send subscriptions request from A to B
        // check for created channel in Child A
        // check for created subscription in Child A
        // check for created channel in Child B ?
        // check for created subscription in Child B ?
        // check status of subscription A is pending
        // check status of subscription B is pending
        // check attrs are correct .... ?
        function(next){// create children fo subscription tests
            console.log("////////////////// Subscription Pending Tests //////////////////");
            createChild("A",  SUBS_RID).then(function(pico) {
                subscriptionPicos["picoA"] = pico;
                return installRulesets(pico.eci, SUBS_RID);
            }).then(function(installResponse) {
                return createChild("B");
            }).then(function(picoB) {
                subscriptionPicos["picoB"] = picoB;
                return installRulesets(picoB.eci, SUBS_RID);
            }).then(function(installResponse) {
                return createSubscription(subscriptionPicos["picoA"].eci, subscriptionPicos["picoB"].eci, "A");
            }).then(function(response) {
                return dumpDB();
            }).then(function(dump) {
                var picoB = subscriptionPicos.picoB;
                var subs = getSubscriptionsFromDump(dump, picoB.id);
                subscriptionPicos.picoB.subscriptions = subs;
                t.notEqual(undefined, subs[SHARED_A], "Pico B has the subscription");
                return getDBDumpWIthDelay();
            }).then(function() {
                var picoASubs = getSubscriptionsFromDump(dump, subscriptionPicos.picoA.id);
                subscriptionPicos.picoA.subscriptions = picoASubs;
                t.notEqual(picoASubs[SHARED_A], undefined, "Pico A has the subscription");
                next();
            }).catch(function(err) {
                console.log(err);
                next(err);
            });
        },
        function(next) {
            var sub1 = subscriptionPicos.picoA.subscriptions[SHARED_A];
            var sub2 = subscriptionPicos.picoB.subscriptions[SHARED_A];
            var sub1Eci = sub1.eci;
            var sub2Eci = sub2.eci;
            var channels = dump.channel;

            // Check that the channels exist
            t.notEqual(channels[sub1Eci], undefined, "Subscription channel created");
            t.notEqual(channels[sub2Eci], undefined, "Subscription channel created");

            // Check that the subscription statuses are pending
            t.equal(sub1.attributes.status, "inbound", "Pico A's subscription status is inbound");
            t.equal(sub2.attributes.status, "outbound", "Pico B's subscription status is outbound");

            // t.equal(sub1.attributes.sid, SHARED_A);
            // t.equal(sub2.attributes.sid, SHARED_A);
            next();
        },
        //////////////// Subscription Accept tests
        function (next) {
            console.log("////////////////// Subscription Acceptance Tests //////////////////");
            pendingSubscriptionApproval(subscriptionPicos.picoA.eci, SHARED_A)
                .then(function(response) {
                    return getDBDumpWIthDelay();
                })
                .then(function() {
                    var picoASubs = getSubscriptionsFromDump(dump, subscriptionPicos.picoA.id);
                    var picoBSubs = getSubscriptionsFromDump(dump, subscriptionPicos.picoB.id);

                    t.equal(picoASubs[SHARED_A].attributes.status, "subscribed", "Pico A's subscription status is subscribed");
                    t.equal(picoBSubs[SHARED_A].attributes.status, "subscribed", "Pico B's subscription status is subscribed");
                    next();
                })
                .catch(function(err) {
                    next(err);
                });
        },
        function(next) {
            console.log("////////////////// Subscription Rejection Tests //////////////////");
            createChild("C",  SUBS_RID).then(function(pico) {
                subscriptionPicos["picoC"] = pico;
                return installRulesets(pico.eci, SUBS_RID);
            }).then(function(installResponse) {
                return createChild("D");
            }).then(function(pico) {
                subscriptionPicos["picoD"] = pico;
                return installRulesets(pico.eci, SUBS_RID);
            }).then(function(installResponse) {
                return createSubscription(subscriptionPicos["picoC"].eci, subscriptionPicos["picoD"].eci, "B");
            }).then(function(response) {
                return inboundSubscriptionRejection(subscriptionPicos.picoC.eci, "shared:B");
            }).then(function(response) {
                return getDBDumpWIthDelay();
            }).then(function() {
                var picoCSubs  = getSubscriptionsFromDump(dump, subscriptionPicos.picoC.id);
                var picoDSubs  = getSubscriptionsFromDump(dump, subscriptionPicos.picoD.id);
                t.equal(picoCSubs["shared:B"], undefined, "Rejecting subscriptions worked");
                t.equal(picoDSubs["shared:B"], undefined, "Rejecting subscriptions worked");
                next();
            }).catch(function(err) {
                next(err);
            });
        },

        //
        //                      end Wrangler tests
        //
        ////////////////////////////////////////////////////////////////////////
    ], function(err){
        t.end(err);
        stopServer();
        process.exit(err ? 1 : 0);//ensure server stops
    });

    /**
     * This function basically causes a delay before getting the dbDump.
     * Events can take time to propagate on the engine so this allows for this.
     */
    function getDBDumpWIthDelay(dumpDelay, maxTime) {
        var waitToDumpDB = dumpDelay ? dumpDelay : 500;
        var timeout = maxTime ? maxTime : 1000;
        dump = undefined;
        setTimeout(function () {
            dumpDB().then(function (data) {
                dump = data;
            });
        }, waitToDumpDB);
        return promiseWhen(function () {
            return dump !== undefined;
        }, timeout);
    }

    function installRulesets (eci, rulesets) {
        return new Promise(function(resolve, reject) {
            pe.signalEvent({
                eci: eci,
                domain: "pico",
                type: "install_rulesets_requested ",
                attrs: {rids: rulesets}
            }, function(err, response) {
                err ? reject(err) : resolve(response);
            });
        });
    }
    function createChild (name) {
        return new Promise(function(resolve, reject) {
            pe.signalEvent({
                eci: root_eci,
                eid: "84",
                domain: "pico",
                type: "new_child_request",
                attrs: {name: name}
            }, function(err, response){
                err ? reject(err) : resolve(response.directives[0].options.pico);
            });
        });
    }
    function pendingSubscriptionApproval (picoEci, subscriptionName) {
        return new Promise(function(resolve, reject) {
            pe.signalEvent({
                eci: picoEci,
                domain: "wrangler",
                type: "pending_subscription_approval",
                attrs: {"subscription_name": subscriptionName}
            }, function(err, response){
                err ? reject(err) : resolve(response);
            });
        });
    }
    function inboundSubscriptionRejection (picoEci, subscriptionName) {
        return new Promise(function(resolve, reject) {
            pe.signalEvent({
                eci: picoEci,
                domain: "wrangler",
                type: "inbound_subscription_rejection",
                attrs: {"subscription_name": subscriptionName}
            }, function(err, response){
                err ? reject(err) : resolve(response);
            });
        });
    }
    function createSubscription (eci1, eci2, name) {
        return new Promise(function(resolve, reject) {
            var attrs = {
                "name": name,
                "channel_type": "subscription",
                "subscriber_eci": eci1
            };
            pe.signalEvent({
                eci: eci2,
                eid: "subscription",
                domain: "wrangler",
                type: "subscription",
                attrs: attrs
            }, function(err, response){
                err ? reject(err) : resolve(response);
            });
        });
    }
    function dumpDB(){
        return new Promise(function(resolve, reject) {
            pe.dbDump(function(err, response){
                err ? reject(err) : resolve(response);
            });
        });
    }
    function getSubscriptionsFromDump(dump, picoId) {
        var entvars = dump.entvars;
        entvars = entvars[picoId];
        return entvars[SUBS_RID] ? entvars[SUBS_RID].subscriptions : undefined;
    }

    /**
     * This code from https://gist.github.com/kylewelsby/e678d5627d8f363a2419#file-promise-when-js-L3
     */
    function promiseWhen(condition, timeout){
        if(!timeout){
            timeout = 2000;
        }
        var done = Promise.defer();
        setTimeout(function(){
            done.reject();
        }, timeout);
        function loop(){
            if(condition()){
                return done.resolve();
            }
            setTimeout(loop,0);
        }
        setTimeout(loop,0);

        return done.promise;
    }
});
