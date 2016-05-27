var λ = require('contra');

module.exports = function(items, onItem, callback){

  var found_item;

  λ.each.series(items, function(item, next){
    if(found_item){
      next();
      return;
    }
    onItem(item, function(err, ret){
      if(err) return next(err);
      if(!found_item && ret){
        found_item = item;
      }
      next();
    });

  }, function(err){
    callback(err, found_item);
  });
};
