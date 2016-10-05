ruleset io.picolabs.module-defined {
  meta {
    provides getInfo, getName
    shares getInfo
    configure using configured_name = "Default"
  }
  global {
    privateFn = function(){
      "privateFn = name: " + configured_name + " memo: " + ent:memo
    }
    getName = function(){
      configured_name
    }
    getInfo = function(){
      {
        "name": getName(),
        "memo": ent:memo,
        "privateFn": privateFn()
      }
    }
  }
  rule store_memo {
    select when module_defined store_memo memo re#^(.*)$# setting(text);

    send_directive("store_memo") with
      greeting = greeting
      memo_to_store = text

    always {
      ent:memo := "Name: " + configured_name + " Memo: " + text
    }
  }
}
