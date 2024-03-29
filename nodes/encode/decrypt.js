module.exports = function (RED) {
    function decryptHandle(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const node = this;

        node.on("input", function (msg) {
            node.status({});
            const contextNode = RED.nodes.getNode(config.context);
            const secretKeyNode = RED.nodes.getNode(config.secretKey);

            try {
                if (!contextNode) {
                    throw new Error(`SEAL Context Node not found`);
                } else if (!secretKeyNode) {
                    throw new Error(`SecretKey Node not found`);
                } else {
                    const context = contextNode.context;
                    const cipherText = seal.CipherText();
                    cipherText.load(context, msg.payload);

                    // get seal objects needed to encrypt the value from the config node
                    const secretKey = seal.SecretKey();
                    secretKey.load(context, secretKeyNode.secretKeyBase64);
                    const encoder = contextNode.encoder;
                    const decryptor = seal.Decryptor(context, secretKey);
                    const plainText = decryptor.decrypt(cipherText);
                    const result = encoder.decode(plainText);
                    msg.payload = result;
                    if (config.showToDebug) {
                        // show first 10 value in array to node-red debug page
                        node.warn(result.slice(0, 10));
                    }
                    node.send(msg);

                    // delete unuse seal instance prevent out of wasm memory error
                    decryptor.delete();
                    plainText.delete();
                    cipherText.delete();
                    secretKey.delete();
                }
            } catch (err) {
                node.error(err);
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: err.toString(),
                });
            }
        });
    }

    RED.nodes.registerType("decrypt", decryptHandle);
};
