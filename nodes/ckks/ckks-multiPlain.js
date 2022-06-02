module.exports = async function (RED) {
    function ckksMultiPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const value = config.value;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', async function (msg) {
                const cipherText = msg.payload;
                const encoder = node.CKKSContext.encoder;
                const evaluator = node.CKKSContext.evaluator;
                const scale = node.CKKSContext.scale;

                const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                const plainText = encoder.encode(array, scale);
                evaluator.multiplyPlain(cipherText, plainText, cipherText);

                msg.payload = cipherText;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-multiPlain', ckksMultiPlain);
};
