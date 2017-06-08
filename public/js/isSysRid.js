window.isSysRid = function(rid){
  return rid === "Subscriptions"
      || rid === "io.picolabs.logging"
      || rid === "io.picolabs.oauth_server"
      || rid === "io.picolabs.pico"
      || rid === "io.picolabs.visual_params";
};
