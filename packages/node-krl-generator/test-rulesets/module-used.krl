ruleset io.picolabs.module-used {
    meta {
        use module io.picolabs.module-defined
            alias my_module_dflt

        use module io.picolabs.module-defined
            alias my_module_conf
            with
                configured_name = "Jim"

        shares now
    }
    global {
        now = function(){
            time:now()
        }
    }
    rule dflt_name {
        select when module_used dflt_name;
        send_directive("dflt_name", {"name": my_module_dflt:getName()});
    }
    rule conf_name {
        select when module_used conf_name;
        send_directive("conf_name", {"name": my_module_conf:getName()});
    }
    rule dflt_info {
        select when module_used dflt_info;
        send_directive("dflt_info", {"info": my_module_dflt:getInfo()});
    }
    rule conf_info {
        select when module_used conf_info;
        send_directive("conf_info", {"info": my_module_conf:getInfo()});
    }
}
