var _ = require("lodash");
var lt = require("long-timeout");//makes it possible to have a timeout longer than 24.8 days (2^31-1 milliseconds)
var cuid = require("cuid");
var schedule = require("node-schedule");

module.exports = function(conf){

    var curr_timeout;
    var cron_by_id = {};
    var most_recent_update_id;


    var clearCurrTimeout = function(){
        if(curr_timeout && !conf.is_test_mode){
            lt.clearTimeout(curr_timeout);
        }
        curr_timeout = null;
    };

    var pending_at_removes = 0;

    /**
     * call update everytime the schedule in the db changes
     */
    var update = function update(){
        if(pending_at_removes !== 0){
            return;//remove will call update() when it's done
        }
        var my_update_id = cuid();
        most_recent_update_id = my_update_id;
        conf.db.nextScheduleEventAt(function(err, next){
            if(most_recent_update_id !== my_update_id){
                //schedule is out of date
                return;
            }
            //always clear the timeout since we're about to re-schedule it
            clearCurrTimeout();
            if(err) return conf.onError(err);
            if(!next){
                return;//nothing to schedule
            }
            var onTime = function(){
                clearCurrTimeout();//mostly for testing, but also to be certain
                if(most_recent_update_id !== my_update_id){
                    //schedule is out of date
                    return;
                }

                //remove it, but let the scheduler know that it's pending
                pending_at_removes++;
                conf.db.removeScheduleEventAt(next.id, next.at, function(err){
                    pending_at_removes--;
                    if(err) conf.onError(err);
                    update();//check the schedule for the next
                });

                //emit the scheduled task
                conf.onEvent(next.event);
            };

            if(conf.is_test_mode){
                //in test mode they manually trigger execution of curr_timeout
                curr_timeout = onTime;
            }else{
                //Execute the event by milliseconds from now.
                //If it's in the past it will happen on the next tick
                curr_timeout = lt.setTimeout(onTime, next.at.getTime() - Date.now());
            }
        });
    };

    var r = {
        update: update,
        addCron: function(timespec, id, event_orig){
            //clone in case event_orig get's mutated
            var event = _.cloneDeep(event_orig);

            if(_.has(cron_by_id, id)){
                if(true
                    && timespec === cron_by_id[id].timespec
                    && _.isEqual(event, cron_by_id[id].event)
                ){
                    return;//nothing changed
                }
                cron_by_id[id].job.cancel();//kill this cron so we can start a new on
            }
            var handler = function(){
                conf.onEvent(event);
            };
            cron_by_id[id] = {
                timespec: timespec,
                event: event,
                job: conf.is_test_mode
                    ? {handler: handler, cancel: _.noop}
                    : schedule.scheduleJob(timespec, handler)
            };
        },
        rmCron: function(id){
            if(!_.has(cron_by_id, id)){
                return;
            }
            cron_by_id[id].job.cancel();
            delete cron_by_id[id];
        },
    };
    if(conf.is_test_mode){
        r.test_mode_triggerTimeout = function(){
            if(curr_timeout){
                curr_timeout();
            }
        };
        r.test_mode_triggerCron = function(id){
            if(_.has(cron_by_id, id)){
                cron_by_id[id].job.handler();
            }
        };
    }
    return r;
};
