module.exports = {
  get: function(ctx,id){
    if(id === "eci"){
      return ctx.event.eci;
    }
  }
};
