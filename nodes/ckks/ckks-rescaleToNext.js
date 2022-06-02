module.exports = async function (RED) {
    function ckksRescaleToNext(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', async function (msg) {
                const cipherText = msg.payload;
                const evaluator = node.CKKSContext.evaluator;

                evaluator.rescaleToNext(cipherText, cipherText);

                msg.payload = cipherText;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-rescaleToNext', ckksRescaleToNext);
};
