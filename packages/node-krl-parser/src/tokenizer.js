module.exports = function(src, opts){
  opts = opts || {};

  var r = [];

  var c;
  var buff = "";
  var i = 0;

  var pushTok = function(type){
    r.push({type: type, src: buff});
    buff = "";
  };
  var ctxChange = function(){
    if(buff.length > 0){
      r.push(buff);
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
