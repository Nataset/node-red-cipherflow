module.export = function (RED) {
    function bfvDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = node.context().flow;

        node.on('input', async function (msg) {
            const encoder = flowContext.get('encoder');
            const decryptor = flowContext.get('decryptor');
            const cipherText = msg.payload;

            // // Decrypt the CipherText
            const decryptedPlainText = decryptor.decrypt(cipherText);

            // // Decode the PlainText
            const decodedArray = encoder.decode(decryptedPlainText);

            msg.payload = decodedArray;
            node.send(msg);
        });
    }
    RED.nodes.registerType('BFV-Decrypt', bfvDecrypt);
};
