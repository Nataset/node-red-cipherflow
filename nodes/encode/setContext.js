module.exports = function (RED) {
    function setContextHandle(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const node = this;

        const outputs = parseInt(config.outputs);

        node.on("input", function (msg) {
            node.status({});
            const contextNode = RED.nodes.getNode(config.context);
            const relinKeyNode = RED.nodes.getNode(config.relinKey);

            try {
                // if msg.payload is string trying load the string to ciphertext
                if (typeof msg.payload === "string") {
                    const context = contextNode.context;
                    const ciphertext = seal.CipherText();
                    ciphertext.load(context, msg.payload);
                    msg.payload = { cipherText: ciphertext };
                }

                if (!contextNode) {
                    throw new Error(`SEAL Context Node not found`);
                } else if (!relinKeyNode) {
                    throw new Error(`RelinKey Node not found`);
                } else {
                    const ciphertext = msg.payload.cipherText;
                    msg.context = { contextNodeId: contextNode.id };
                    msg.relinKey = { relinKeyNodeId: relinKeyNode.id };
                    msg.latestNodeId = config.id;

                    const msgArray = [msg];
                    for (i = 1; i < outputs; i++) {
                        const newMsg = { ...msg };
                        newMsg.payload = { cipherText: ciphertext.clone() };
                        msgArray.push(newMsg);
                    }

                    node.send(msgArray, false);
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

    RED.nodes.registerType("setContext", setContextHandle);
};
