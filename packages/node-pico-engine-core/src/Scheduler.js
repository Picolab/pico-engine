module.exports = function(conf){

    var curr_timeout;

    /**
     * call update everytime the schedule in the db changes
     */
    var update = function update(){
        conf.db.nextScheduleEventAt(function(err, next){
            if(curr_timeout){
                //always clear the timeout since we're about to re-schedule it
                if(!conf.is_test_mode){
                    clearTimeout(curr_timeout);
                }
                curr_timeout = null;
            }
            if(err) return conf.onError(err);
            if(!next){
                return;//nothing to schedule
            }
            var onTime = function(){
                //run the scheduled task
                conf.onEvent(next, function(err){
                    if(err){
                        conf.onError(err);
                        //handle the error
                        //but don't stop b/c we want it removed from the schedule
                    }
                    conf.db.removeScheduleEventAt(next.id, next.at, function(err){
                        if(err) conf.onError(err);
                        update();//check the schedule for the next
                    });
                });
            };

            if(conf.is_test_mode){
                //in test mode they manually trigger execution of curr_timeout
                curr_timeout = onTime;
            }else{
                //Execute the event by milliseconds from now.
                //If it's in the past it will happen on the next tick
                curr_timeout = setTimeout(onTime, next.at.getTime() - Date.now());
            }
        });
    };

    update();//trigger the initial schedule

    var r = {
        update: update,
    };
    if(conf.is_test_mode){
        r.test_mode_trigger = function(){
            if(curr_timeout){
                curr_timeout();
            }
        };
    }
    return r;
};
