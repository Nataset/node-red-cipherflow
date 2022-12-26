/*
	negate ciphertext input value
	---use 0 chainIndex---
	input: ciphertext in msg.payload
	output: negated result ciphertext in msg.payload
*/

module.exports = function (RED) {
    const { getChainIndex } = require("../../util/getDetail.js");

    function negate(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const node = this;
        const outputs = parseInt(config.outputs);
        // node status show grey ring when first create
        node.status({ fill: "grey", shape: "ring" });

        node.on("input", function (msg) {
            node.status({});
            // get seal objects from config node
            const contextNode = RED.nodes.getNode(msg.context.contextNodeId);

            try {
                if (!contextNode) {
                    throw new Error(`SEAL Contexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`CipherText not found`);
                }

                // clone input ciphertext to prevent race condition error
                const inputCipher = msg.payload.cipherText;
                const cipherText = inputCipher.clone();

                // declare varibale for negate ciphertext
                const evaluator = contextNode.evaluator;
                const context = contextNode.context;

                // negate the ciphertext
                evaluator.negate(cipherText, cipherText);

                const chainIndex = getChainIndex(cipherText, context);

                // show output ciphertext chainIndex to the node status
                node.status({
                    fill: "green",
                    shape: "ring",
                    text: `ChainIndex: ${chainIndex}`,
                });

                msg.latestNodeId = config.id;
                msg.payload = { cipherText: cipherText };
                const msgArray = [msg];
                for (i = 1; i < outputs; i++) {
                    const newMsg = { ...msg };
                    newMsg.payload = { cipherText: cipherText.clone() };
                    msgArray.push(newMsg);
                }
                node.send(msgArray, false);

                // delete unuse seal instance prevent out of wasm memory error
                inputCipher.delete();
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

    RED.nodes.registerType("negate", negate);
};
