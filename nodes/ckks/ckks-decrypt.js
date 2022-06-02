module.exports = function (RED) {
    function ckksDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', function (msg) {
                const cipherText = msg.payload;
                const encoder = node.CKKSContext.encoder;
                const decryptor = node.CKKSContext.decryptor;
                const plainText = decryptor.decrypt(cipherText);
                const result = encoder.decode(plainText);

                msg.payload = result;
                node.send(msg);
            });
        } else if (flowContext.get('context')) {
            node.on('input', function (msg) {
                const cipherText = msg.payload;
                const encoder = flowContext.get('encoder');
                const decryptor = flowContext.get('decryptor');
                const plainText = decryptor.decrypt(cipherText);
                const result = encoder.decode(plainText);

                msg.payload = result;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-decrypt', ckksDecrypt);
};
