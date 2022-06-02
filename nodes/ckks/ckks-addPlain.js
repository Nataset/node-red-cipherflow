module.exports = async function (RED) {
    function ckksAddPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const value = config.value;
        const checkbox = config.MyCheckBox;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', async function (msg) {
                const cipherText = msg.payload;
                const encoder = node.CKKSContext.encoder;
                const evaluator = node.CKKSContext.evaluator;
                const context = node.CKKSContext.context;
                const scale = node.CKKSContext.scale;
                const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                const plainText = encoder.encode(array, scale);
                if (checkbox) {
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
