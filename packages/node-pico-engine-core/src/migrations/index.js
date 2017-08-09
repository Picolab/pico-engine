/**
 * This is the list of migrations
 *
 * The key's are version ids, and should be prefixed with timestamps
 * (new Date()).toISOString().replace(/-|\..*|:/g, "")
 *
 * This way migrations can be applied in chronological order, since each migrations
 * builds on the previous one
 */
module.exports = {
    "20170727T211511_appvars": require("./20170727T211511_appvars"),
    "20170727T223943_entvars": require("./20170727T223943_entvars"),
    "20170803T211131_eci-to-pico_id": require("./20170803T211131_eci-to-pico_id"),
    "20170803T214146_channel": require("./20170803T214146_channel"),
    "20170804T214426_pico-ruleset": require("./20170804T214426_pico-ruleset"),
};
