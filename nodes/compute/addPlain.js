/* 
	add known value to the ciphertext
	---use 0 chainIndex---
	input: ciphertext in msg.payload
	output: added result ciphertext in msg.payload
*/
module.exports = function (RED) {
    const { getChainIndex } = require("../../util/getDetail.js");

    function addPlain(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const node = this;
        const outputs = parseInt(config.outputs);
        // get value from this node html page
        const value = parseFloat(config.value);

        // show value in the node status below the node if didn't value will show error in status
        if (!value) {
            const err = new Error("value field is empty");
            node.error(err);
            node.status({ fill: "red", shape: "dot", text: err.toString() });
            return;
        } else {
            node.status({
                fill: "blue",
                shape: "ring",
                text: `Value: ${value}`,
            });
        }

        node.on("input", function (msg) {
            node.status({});
            // get seal object from config node by useing config node id that passed from injectContext node
            const contextNode = RED.nodes.getNode(msg.context.contextNodeId);

            try {
                if (!contextNode) {
                    throw new Error("SEALContext node not found");
                } else if (!msg.payload) {
                    throw new Error("CipherText not found");
                } else {
                    // get seal objects needed to add value to the ciphertext from the config node
                    const context = contextNode.context;
                    const encoder = contextNode.encoder;
                    const evaluator = contextNode.evaluator;

                    const cipherText = seal.CipherText();
                    cipherText.load(context, msg.payload);

                    // encode add value to plaintext before add to the ciphertext;
                    const array = Float64Array.from(
                        { length: encoder.slotCount },
                        () => value
                    );
                    const plainText = encoder.encode(array, cipherText.scale);

                    // change chainIndex of the new plaintext to same level of ciphertext;
                    evaluator.plainModSwitchTo(
                        plainText,
                        cipherText.parmsId,
                        plainText
                    );
                    evaluator.addPlain(cipherText, plainText, cipherText);

                    // get chainIndex for more info for chainIndex see input.js node line 44
                    const chainIndex = getChainIndex(cipherText, context);

                    // if not error show chainIndex of output ciphertext
                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: `ChainIndex: ${chainIndex}`,
                    });

                    msg.latestNodeId = config.id;
                    msg.payload = cipherText.save();

                    node.send(msg);

                    // delete unuse instance of seal objects prevent out of wasm memory error
                    cipherText.delete();
                    plainText.delete();
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

    RED.nodes.registerType("add(P)", addPlain);
};
