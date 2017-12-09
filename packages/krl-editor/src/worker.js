ace.define("ace/mode/krl_worker",["require","exports","ace/lib/oop","ace/worker/mirror"],function(acequire, exports){
    var oop = acequire("../lib/oop");
    var Mirror = acequire("../worker/mirror").Mirror;

    var KRLWorker = function(sender){
        Mirror.call(this, sender);
        this.setTimeout(200);
    };
    oop.inherits(KRLWorker, Mirror);

    KRLWorker.prototype.onUpdate = function(){
        var value = this.doc.getValue();
        var errors = [];

        errors.push({
            row: 3,
            column: 3,
            text: "This error worked!",
            type: "error"
        });

        this.sender.emit("annotate", errors);
    };

    exports.KRLWorker = KRLWorker;
});
