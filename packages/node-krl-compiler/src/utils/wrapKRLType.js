module.exports = function(e, type, args){
  return e('new', e('id', 'ctx.krl.' + type), args);
};
