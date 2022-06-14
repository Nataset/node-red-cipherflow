module.exports = function (RED) {
    function ckksModSwitchToLast(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', function (msg) {
                const payload = msg.payload;
                const evaluator = node.CKKSContext.evaluator;
                const context = node.CKKSContext.context;
                const lastParmsId = context.lastParmsId;

                if (!payload.hasOwnProperty('size')) {
                    const plainText = payload;

                    evaluator.plainModSwitchTo(plainText, lastParmsId, plainText);

                    msg.payload = plainText;
                } else {
                    const cipherText = payload;

                    evaluator.cipherModSwitchTo(cipherText, lastParmsId, cipherText);

                    msg.payload = cipherText;
                }
                node.send(msg);
            });
        } else if (flowContext.get('context')) {
            node.on('input', function (msg) {
                const payload = msg.payload;
                const evaluator = flowContext.get('evaluator');
                const context = flowContext.get('context');
                const lastParmsId = context.lastParmsId;

                if (!payload.hasOwnProperty('size')) {
                    const plainText = payload;

                    evaluator.plainModSwitchTo(plainText, lastParmsId, plainText);

                    msg.payload = plainText;
                } else {
                    const cipherText = payload;

                    evaluator.cipherModSwitchTo(cipherText, lastParmsId, cipherText);

                    msg.payload = cipherText;
                }
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-modSwitchToLast', ckksModSwitchToLast);
};
