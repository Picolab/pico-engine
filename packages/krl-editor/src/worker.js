var compiler = require("krl-compiler");

ace.define("ace/mode/krl_worker",["require","exports","ace/lib/oop","ace/worker/mirror"],function(acequire, exports){
    var oop = acequire("../lib/oop");
    var Mirror = acequire("../worker/mirror").Mirror;

    var KRLWorker = function(sender){
        Mirror.call(this, sender);
        this.setTimeout(200);
    };
    oop.inherits(KRLWorker, Mirror);

    KRLWorker.prototype.onUpdate = function(){
        var krl_src = this.doc.getValue();
        var errors = [];

        try{
            var out = compiler(krl_src);
            out.warnings.forEach(function(w){
                errors.push({
                    row: w.loc.start.line - 1,
                    column: w.loc.start.column,
                    text: w.message,
                    type: "warning"
                });
            });
        }catch(err){
            if(err.where && err.where.line){
                errors.push({
                    row: err.where.line - 1,
                    column: err.where.col,
                    text: err + "",
                    type: "error"
                });
            }else if(err.krl_compiler && err.krl_compiler.loc && err.krl_compiler.loc.start){
                errors.push({
                    row: err.krl_compiler.loc.start.line - 1,
                    column: err.krl_compiler.loc.start.column,
                    text: err + "",
                    type: "error"
                });
            }else{
                errors.push({
                    row: 0,
                    column: 0,
                    text: err + "",
                    type: "error"
                });
            }
        }

        this.sender.emit("annotate", errors);
    };

    exports.KRLWorker = KRLWorker;
});
