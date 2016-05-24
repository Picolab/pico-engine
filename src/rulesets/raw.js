module.exports = {
  provided_functions: {
    sayRawHello: {
      type: 'raw',
      fn: function(ctx, res){
        res.end('raw hello!');
      }
    }
  }
};
