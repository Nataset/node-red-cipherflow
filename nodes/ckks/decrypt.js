module.exports = function (RED) {
    function ckksDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        // const flowContext = node.context().flow;

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.node_id);
            try {
                if (!SEALContexts) {
                    throw new Error('SEALContexts not found');
                } else if (!SEALContexts.decryptor) {
                    throw new Error('decryptor not found');
                } else if (!msg.payload.cipherText) {
                    throw new Error('cipherText not found');
                } else {
                    const context = SEALContexts.context;
                    const cipherText = msg.payload.cipherText.clone();
                    const cipherTextBase64 = cipherText.save();
                    const newCipherText = SEALContexts.seal.CipherText();

                    newCipherText.load(context, cipherTextBase64);

                    const encoder = SEALContexts.encoder;
                    const decryptor = SEALContexts.decryptor;
                    const plainText = decryptor.decrypt(newCipherText);
                    const result = encoder.decode(plainText);

                    msg.payload = result.slice(0, 10);
                    node.send(msg);
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('decrypt', ckksDecrypt);
};
