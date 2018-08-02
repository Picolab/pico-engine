/**
 * This is the list of migrations
 *
 * The key's are version ids, and should be prefixed with timestamps
 * (new Date()).toISOString().replace(/-|\..*|:/g, "")
 *
 * This way migrations can be applied in chronological order, since each migrations
 * builds on the previous one
 *
 * NOTE: migrations should be immutable, meaning they should produce the same result
 * regardless of codebase state.
 * Therefore you should NOT depend on DB.js (i.e. do not `require("../DB")`)
 * because DB will change how it reads/writes the leveldb but the migrations should not.
 * Yes, that means duplicating code is the right thing to do in this context.
 */
module.exports = {
  '20170727T211511_appvars': require('./20170727T211511_appvars'),
  '20170727T223943_entvars': require('./20170727T223943_entvars'),
  '20170803T211131_eci-to-pico_id': require('./20170803T211131_eci-to-pico_id'),
  '20170803T214146_channel': require('./20170803T214146_channel'),
  '20170804T214426_pico-ruleset': require('./20170804T214426_pico-ruleset'),
  '20170810T170618_parent-child': require('./20170810T170618_parent-child'),
  '20170823T213214_admin_eci': require('./20170823T213214_admin_eci'),
  '20171031T182007_pvar_index': require('./20171031T182007_pvar_index'),
  '20171117T191959_admin_policy_id': require('./20171117T191959_admin_policy_id'),
  '20180222T195856_state_machine': require('./20180222T195856_state_machine'),
  '20180223T162324_wranger_rid': require('./20180223T162324_wranger_rid')
}
