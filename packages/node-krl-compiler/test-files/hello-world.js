module.exports = {
    name: 'hello_world'
    rules: {
        say_hello: {
            select: {
                graph: {
                    'echo': {
                        'hello': {'a': true}
                    }
                },
                eventexprs: {
                    a: function(ctx, callback){
                        callback(undefined, ctx.event.domain === 'echo' && ctx.event.type === 'hello');
                    }
                },
                state_machine: {
                    start: [
                        ['a', 'end'],
                        [['not', 'a'], 'start']
                    ]
                }
            },
            action: function(ctx, callback){
                callback(undefined, {
                    type: 'directive',
                    name: 'say',
                    options: {
                        something: 'Hello World'
                    }
                });
            }
        }
    }
};
