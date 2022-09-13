module.exports = function (RED) {
    function toCiphertext(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get('seal');
        if (!seal) return

        const node = this;
        const outputs = parseInt(config.outputs);

        node.on('input', function (msg) {
            const contextNode = RED.nodes.getNode(config.context);

            try {
                const context = contextNode.context
                const ciphertext = seal.CipherText();
                const base64Data = msg.payload

                ciphertext.load(context, base64Data);

                msg.payload = { cipherText: ciphertext };
                const msgArray = [msg];
                for (i = 1; i < outputs; i++) {
                    const newMsg = { ...msg };
                    newMsg.payload = { cipherText: ciphertext.clone() };
                    msgArray.push(newMsg);
                }
                node.send(msgArray);

            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('toCiphertext', toCiphertext);
};
