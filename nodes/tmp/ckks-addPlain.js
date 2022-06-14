module.exports = function (RED) {
    function ckksAddPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const value = config.value;
        const flowContext = this.context().flow;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', function (msg) {
                const cipherText = msg.payload;
                const encoder = node.CKKSContext.encoder;
                const evaluator = node.CKKSContext.evaluator;
                const context = node.CKKSContext.context;
                const scale = node.CKKSContext.scale;
                const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                const plainText = encoder.encode(array, scale);
                if (config.myCheckBox) {
                    const lastParmsId = context.lastParmsId;
                    evaluator.plainModSwitchTo(plainText, lastParmsId, plainText);
                }
                evaluator.addPlain(cipherText, plainText, cipherText);
                msg.payload = cipherText;
                node.send(msg);
            });
        } else if (flowContext.get('context')) {
            node.on('input', function (msg) {
                const cipherText = msg.payload;
                const encoder = flowContext.get('encoder');
                const evaluator = flowContext.get('evaluator');
                const context = flowContext.get('context');
                const scale = flowContext.get('scale');
                const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                const plainText = encoder.encode(array, scale);
                if (config.myCheckBox) {
                    const lastParmsId = context.lastParmsId;
                    evaluator.plainModSwitchTo(plainText, lastParmsId, plainText);
                }
                evaluator.addPlain(cipherText, plainText, cipherText);
                msg.payload = cipherText;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-addPlain', ckksAddPlain);
};
