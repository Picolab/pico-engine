module.exports = function(conf){

    var curr_timeout;

    /**
     * call update everytime the schedule in the db changes
     */
    var update = function update(){
        conf.db.nextScheduleEventAt(function(err, next){
            if(curr_timeout){
                //always clear the timeout since we're about to re-schedule it
                clearTimeout(curr_timeout);
                curr_timeout = null;
            }
            if(err)return conf.onError(err);
            if(!next){
                return;//nothing to schedule
            }
            curr_timeout = setTimeout(function(){

                //run the scheduled task
                conf.onEvent(next);

                conf.db.removeScheduleEventAt(next.id, next.at, function(err){
                    if(err) conf.onError(err);
                    update();//check the schedule for the next
                });
            }, next.at.getTime() - Date.now());
        });
    };

    update();//trigger the initial schedule

    return {
        update: update,
    };
};
