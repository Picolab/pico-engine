var test = require("tape");
var path = require("path");
var async = require("async");
var tempfs = require("temp-fs");
var setupServer = require("./setupServer");
var startPicoEngine = require("./startPicoEngine");

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
        startPicoEngine({
            host: "http://localhost:8080",
            home: dir.path,
            no_logging: true,
        }, function(err, pe){
            if(err) throw err;//throw ensures process is killed with non-zero exit code

            //setup the server without throwing up
            setupServer(pe);

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

test("pio-engine", function(t){
    var pe, root_eci, stopServer, child_count, child, channels ,channel;
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
        function(next){// store channels,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "channel",
                args: {},
            }, function(err, data){
                if(err) return next(err);
                channels = data.channels;
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
                console.log("//////////////////Channel Creation//////////////////");
                t.equals(data.channels.length > channels.length, true,"channel was created");
                t.equals(data.channels.length, channels.length + 1,"single channel was created");
                var found = false;
                for(var i = 0; i < data.channels.length; i++) {
                    if (data.channels[i].id == channel.id) {
                        found = true;
                        t.deepEqual(channel, data.channels[i],"new channel is the same channel from directive");
                        break;
                    }
                }
                t.equals(found, true,"found correct channel in deepEqual");//redundant check
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
        /*function(next){// eciFromName,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "eciFromName",
                args: {name:channel.name},
            }, function(err, data){
                if(err) return next(err);
                //console.log("eci",data);
                //t.equals(data,channel.eci,"eciFromName");
                next();
            });
        },
        function(next){// nameFromEci,
            pe.runQuery({
                eci: root_eci,
                rid: "io.picolabs.pico",
                name: "nameFromEci",
                args: {eci:channel.eci},
            }, function(err, data){
                if(err) return next(err);
                //console.log("name",data);
                //t.equals(data,channel.name,"nameFromEci");
                next();
            });
        },*/
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
                //channel = response.directives[0].options.channel;
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
                t.equals(data.channels.length >= channels.length, true,"channel was removed");
                t.equals(data.channels.length, channels.length ,"single channel was removed");
                var found = false;
                for(var i = 0; i < data.channels.length; i++) {
                    if (data.channels[i].id == channel.id) {
                        found = true;
                        //t.deepEqual(channel, data.channels[i],"new channel is the same channel from directive");
                        break;
                    }
                }
                t.equals(found, false,"correct channel removed");
                next();
            });
        },


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
                if(err) return next(err);
                //console.log("this is the create child response:",response.directives[0].options.pico);
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
                //console.log("children",data.children);
                t.equals(data.children.length > child_count, true,"created a pico"); // created a child
                t.equals(data.children.length , child_count+1, "created a single pico"); // created only 1 child
                var found = false;
                for(var i = 0; i < data.children.length; i++) {
                    if (data.children[i].id == child.id) {
                        found = true;
                        t.deepEqual(child, data.children[i],"new pico is the same pico from directive");
                        break;
                    }
                }
                t.deepEqual(found, true,"new child pico found");//check that child is the same from the event above
                next();
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
});
