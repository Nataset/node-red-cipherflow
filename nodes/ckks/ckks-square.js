module.exports = async function (RED) {
    function ckksSquare(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', async function (msg) {
                const cipherText = msg.payload;
                const evaluator = node.CKKSContext.evaluator;
                const relinKey = node.CKKSContext.relinKey;

                evaluator.square(cipherText, cipherText);
                evaluator.relinearize(cipherText, relinKey, cipherText);

                msg.payload = cipherText;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-square', ckksSquare);
};
