window.isSysRid = function(rid){
  return rid === "io.picolabs.subscription"
      || rid === "io.picolabs.logging"
      || rid === "io.picolabs.oauth_server"
      || rid === "io.picolabs.wrangler"
      || rid === "io.picolabs.visual_params";
};
