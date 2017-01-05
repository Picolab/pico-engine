module.exports = function(src, opts){
  opts = opts || {};

  var r = [];

  var c;
  var next_is_escaped;

  var is_in_beesting = false;
  var beesting_curly_count = 0;

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
      pushTok("RAW");
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
      pushTok("WHITESPACE");

    ///////////////////////////////////////////////////////////////////////////
    //string
    }else if(c === "\""){
      ctxChange();
      i++;
      next_is_escaped = false;
      while(i < src.length){
        c = src[i];
        buff += c;
        if(next_is_escaped){
          next_is_escaped = false;
        }else{
          if(c === "\\"){
            next_is_escaped = true;
          }
          if(c === "\""){
            break;
          }
        }
        i++;
      }
      pushTok("STRING");

    ///////////////////////////////////////////////////////////////////////////
    //chevron
    }else if(false
        || (c === "<" && (src[i + 1] === "<"))
        || (c === "}" && is_in_beesting && beesting_curly_count === 0)
        ){
      ctxChange();
      if(is_in_beesting){
        pushTok("CHEVRON-BEESTING-CLOSE");
        i++;
        is_in_beesting = false;
      }else{
        buff = src.substring(i, i + 2);
        i += 2;
        pushTok("CHEVRON-OPEN");
      }
      next_is_escaped = false;
      while(i < src.length){
        c = src[i];
        if(next_is_escaped){
          next_is_escaped = false;
        }else{
          if(c === "\\"){
            next_is_escaped = true;
          }
          if(c === ">" && (src[i + 1] === ">")){
            if(buff.length > 0){
              pushTok("CHEVRON-STRING");
            }
            buff = src.substring(i, i + 2);
            i += 1;
            pushTok("CHEVRON-CLOSE");
            break;
          }
          if(c === "#" && (src[i + 1] === "{")){
            if(buff.length > 0){
              pushTok("CHEVRON-STRING");
            }
            buff = src.substring(i, i + 2);
            i += 1;
            pushTok("CHEVRON-BEESTING-OPEN");
            is_in_beesting = true;
            beesting_curly_count = 0;
            break;
          }
        }
        buff += c;
        i++;
      }

    ///////////////////////////////////////////////////////////////////////////
    //number
    }else if(/^[0-9]$/.test(c) || (c === "." && /^[0-9]$/.test(src[i + 1]))){
      ctxChange();
      buff = "";
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
      pushTok("NUMBER");

    ///////////////////////////////////////////////////////////////////////////
    //regexp
    }else if(c === "r" && src[i+1] === "e" && src[i+2] === "#"){
      ctxChange();
      buff = src.substring(i, i + 3);
      i += 3;
      next_is_escaped = false;
      while(i < src.length){
        c = src[i];
        buff += c;
        if(next_is_escaped){
          next_is_escaped = false;
        }else{
          if(c === "\\"){
            next_is_escaped = true;
          }
          if(c === "#"){
            if(src[i + 1] === "i"){
              i++;
              c = src[i];
              buff += c;
              if(src[i + 1] === "g"){
                i++;
                c = src[i];
                buff += c;
              }
            }else if(src[i + 1] === "g"){
              i++;
              c = src[i];
              buff += c;
              if(src[i + 1] === "i"){
                i++;
                c = src[i];
                buff += c;
              }
            }
            break;
          }
        }
        i++;
      }
      pushTok("REGEXP");

    ///////////////////////////////////////////////////////////////////////////
    //symbol
    }else if(/^[a-zA-Z_$]$/.test(c)){
      ctxChange();
      buff = "";
      while(i < src.length){
        c = src[i];
        buff += c;
        if(!/^[a-zA-Z0-9_$]$/.test(src[i + 1])){
          break;
        }
        i++;
      }
      pushTok("SYMBOL");

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
      pushTok("LINE-COMMENT");

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
      pushTok("BLOCK-COMMENT");

    ///////////////////////////////////////////////////////////////////////////
    //raw
    }else if("(){}[];".indexOf(c) >= 0){//single char groups
      ctxChange();
      pushTok("RAW");
      if(is_in_beesting){
        if(c === "{"){
          beesting_curly_count++;
        }else if(c === "}"){
          beesting_curly_count--;
        }
      }
    }else{
      buff += c;
    }
    i++;
  }
  ctxChange();

  return r;
};
