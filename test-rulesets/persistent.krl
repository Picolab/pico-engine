ruleset io.picolabs.persistent {
    meta {
        shares getName, getAppVar, getUser, getUserFirstname
    }
    global {
        getName = function(){
            ent:name;
        }
        getAppVar = function(){
            app:appvar;
        }
        getUser = function(){
            ent:user;
        }
        getUserFirstname = function(){
            ent:user{["firstname"]};
        }
    }
    rule store_my_name {
        select when store name name re#^(.*)$# setting(my_name)

        send_directive("store_name", {"name": my_name});

        always {
            ent:name := my_name
        }
    }
    rule store_appvar {
        select when store appvar appvar re#^(.*)$# setting(my_appvar)

        send_directive("store_appvar", {"appvar": my_appvar});

        always {
            app:appvar := my_appvar
        }
    }
    rule store_user_firstname {
        select when store user_firstname firstname re#^(.*)$# setting(firstname)

        send_directive("store_user_firstname", {"name": firstname});

        always {
            ent:user := {"lastname": "McCoy"};
            ent:user{["firstname"]} := firstname
        }
    }
    rule clear_user {
        select when store clear_user

        send_directive("clear_user");

        always {
            clear ent:user
        }
    }
    rule clear_appvar {
        select when store clear_appvar

        send_directive("clear_appvar");

        always {
            clear app:appvar
        }
    }
}
