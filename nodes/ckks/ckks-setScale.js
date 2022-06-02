module.exports = function (RED) {
    function ckksSetScale(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', function (msg) {
                const cipherText = msg.payload;
                const scale = node.CKKSContext.scale;

                cipherText.setScale(scale);

                msg.payload = cipherText;
                node.send(msg);
            });
        } else if (flowContext.get('context')) {
            node.on('input', function (msg) {
                const cipherText = msg.payload;
                const scale = flowContext.get('scale');

                cipherText.setScale(scale);

                msg.payload = cipherText;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-setScale', ckksSetScale);
};
