module.exports = function(src, opts){
  opts = opts || {};

  var r = [];

  var c;
  var buff = "";
  var i = 0;
  var next_loc = 0;

  var pushTok = function(type){
    var loc = {start: next_loc, end: next_loc + buff.length};
    r.push({
      type: type,
      src: buff,
      loc: loc
    });
    next_loc = loc.end;
    buff = "";
  };
  var ctxChange = function(){
    if(buff.length > 0){
      pushTok("raw");
    }
    buff = c;
  };

  while(i < src.length){
    c = src[i];

    ///////////////////////////////////////////////////////////////////////////
    //whitespace
    if(/^\s$/.test(c)){
      ctxChange();
      while(i < src.length){
        c = src[i];
        if(!/^\s$/.test(src[i + 1])){
          break;
        }
        buff += c;
        i++;
      }
      pushTok("whitespace");

    ///////////////////////////////////////////////////////////////////////////
    //string
    }else if(c === "\""){
      ctxChange();
      i++;
      while(i < src.length){
        c = src[i];
        buff += c;
        if(c === "\"" && (src[i - 1] !== "\\")){
          break;
        }
        i++;
      }
      pushTok("string");

    ///////////////////////////////////////////////////////////////////////////
    //chevron
    }else if(c === "<" && (src[i + 1] === "<")){
      ctxChange();
      i++;
      while(i < src.length){
        c = src[i];
        buff += c;
        if(c === ">" && (src[i - 1] === ">") && (src[i - 2] !== "\\")){
          break;
        }
        i++;
      }
      pushTok("chevron");

    ///////////////////////////////////////////////////////////////////////////
    //number
    }else if(/^[0-9]$/.test(c) || (c === "." && /^[0-9]$/.test(src[i + 1]))){
      ctxChange();
      i++;
      var has_seen_decimal = c === ".";
      while(i < src.length){
        c = src[i];
        buff += c;
        if(!/^[0-9]$/.test(src[i + 1])){
          if(src[i+1] === "." && !has_seen_decimal){
            has_seen_decimal = true;
          }else{
            break;
          }
        }
        i++;
      }
      pushTok("number");

    ///////////////////////////////////////////////////////////////////////////
    //line-comment
    }else if(c === "/" && (src[i + 1] === "/")){
      ctxChange();
      i++;
      while(i < src.length){
        c = src[i];
        buff += c;
        if(c === "\n" || c === "\r"){
          break;
        }
        i++;
      }
      pushTok("line-comment");

    ///////////////////////////////////////////////////////////////////////////
    //block-comment
    }else if(c === "/" && (src[i + 1] === "*")){
      ctxChange();
      i++;
      while(i < src.length){
        c = src[i];
        buff += c;
        if(c === "/" && (src[i-1] === "*")){
          break;
        }
        i++;
      }
      pushTok("block-comment");

    ///////////////////////////////////////////////////////////////////////////
    //raw
    }else{
      buff += c;
    }
    i++;
  }
  ctxChange();

  return r;
};
