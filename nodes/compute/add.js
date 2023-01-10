module.exports = function (RED) {
    const { getChainIndex } = require("../../util/getDetail.js");

    function add(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const node = this;
        // get node context(like global store in node) for manage multiple input
        const nodeContext = node.context();
        // set queue and latestNodeId to empty array and null when first create node
        nodeContext.set("firstQueue", []);
        nodeContext.set("secondQueue", []);
        nodeContext.set("firstNodeId", null);
        nodeContext.set("secondNodeId", null);

        node.status({ fill: "grey", shape: "ring" });

        node.on("input", function (msg) {
            node.status({});
            // get seal objects from config node
            const contextNode = RED.nodes.getNode(msg.context.contextNodeId);

            try {
                if (!contextNode) {
                    throw new Error("SEALContext not found");
                } else if (!msg.payload) {
                    throw new Error("CipherText not found");
                }

                // get Queue and latestNodeId when msg come
                const firstQueue = nodeContext.get("firstQueue");
                const secondQueue = nodeContext.get("secondQueue");
                let firstNodeId = nodeContext.get("firstNodeId");
                let secondNodeId = nodeContext.get("secondNodeId");

                // if msg is a first msg run code below
                if (firstNodeId == null || msg.latestNodeId == firstNodeId) {
                    // clone msg ciphertext
                    const firstCipher = msg.payload;
                    // set firstNodeId to check order of the msg;
                    firstNodeId = msg.latestNodeId;
                    nodeContext.set("firstNodeId", firstNodeId);
                    // push object contain needed value to the firstQueue
                    firstQueue.push({
                        cipher: firstCipher,
                        // exactValue: msg.exactResult,
                    });
                    // set node status to waiting
                    node.status({
                        fill: "yellow",
                        shape: "ring",
                        text: "wait for another ciphertext",
                    });
                } // if msg is a second msg run code below, or msg is coming for the secondNodeId
                else if (
                    secondNodeId == null ||
                    msg.latestNodeId == secondNodeId
                ) {
                    // clone msg ciphertext
                    const secondCipher = msg.payload;
                    // set secondNodeId to check order of the msg
                    secondNodeId = msg.latestNodeId;
                    nodeContext.set("secondNodeId", secondNodeId);
                    // push object contain needed value to the secondQueue
                    secondQueue.push({
                        cipher: secondCipher,
                        // exactValue: msg.exactResult,
                    });
                    // set node status to waiting
                    node.status({
                        fill: "yellow",
                        shape: "ring",
                        text: "wait for another ciphertext",
                    });
                } else {
                    throw new Error("input more than 2 ciphertext");
                }

                if (firstQueue.length > 0 && secondQueue.length > 0) {
                    const context = contextNode.context;
                    const evaluator = contextNode.evaluator;

                    // shift object out from queue
                    const firstValue = firstQueue.shift();
                    const secondValue = secondQueue.shift();

                    const firstCipher = seal.CipherText();
                    const secondCipher = seal.CipherText();

                    firstCipher.load(context, firstValue.cipher);
                    secondCipher.load(context, secondValue.cipher);

                    // declare variable for add two ciphertext

                    // equal fisrtCipher chainIndex to secondCipher chainIndex
                    const firstChainIndex = getChainIndex(firstCipher, context);
                    const secondChainIndex = getChainIndex(
                        secondCipher,
                        context
                    );
                    firstChainIndex - secondChainIndex > 0
                        ? evaluator.cipherModSwitchTo(
                              firstCipher,
                              secondCipher.parmsId,
                              firstCipher
                          )
                        : evaluator.cipherModSwitchTo(
                              secondCipher,
                              firstCipher.parmsId,
                              secondCipher
                          );

                    const resultCipher = evaluator.add(
                        firstCipher,
                        secondCipher
                    );
                    const chainIndex = getChainIndex(resultCipher, context);

                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: `ChainIndex: ${chainIndex}`,
                    });

                    // msg.exactResult = newExact;
                    msg.latestNodeId = config.id;
                    msg.payload = resultCipher.save();

                    node.send(msg);

                    // delete seal object instance prevent out of wasm memory
                    firstCipher.delete();
                    secondCipher.delete();
                    resultCipher.delete();
                }
            } catch (err) {
                node.error(err);
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: err.toString(),
                });
                return;
            }
        });

        node.on("close", function () {
            nodeContext.set("firstQueue", []);
            nodeContext.set("secondQueue", []);
            nodeContext.set("firstNodeId", null);
            nodeContext.set("secondNodeId", null);
        });
    }

    RED.nodes.registerType("add(E)", add);
};
