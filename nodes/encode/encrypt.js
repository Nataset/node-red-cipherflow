module.exports = function (RED) {
    const multipleOutput = require("../../util/multipleOutput.js");
    const { getChainIndex } = require("../../util/getDetail.js");

    function encryptHandle(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const nodeContext = this.context();
        nodeContext.set("numberArray", []);

        const node = this;

        const outputs = parseInt(config.outputs);

        // check value in node config
        try {
            if (!config.context) {
                throw new Error(`didn't select context`);
            } else if (!config.publicKey) {
                throw new Error(`didn't select publickey`);
            } else if (!config.msgKey) {
                throw new Error(`didn't set received msg key`);
            } else if (!config.numberArrayLength) {
                throw new Error(`didn't set number length`);
            }
        } catch (err) {
            node.error(err);
            node.status({ fill: "red", shape: "ring", text: err });
        }

        node.on("input", function (msg) {
            node.status({});
            // const used = process.memoryUsage();
            // for (let key in used) {
            //     console.log(
            //         `Memory: ${key} ${
            //             Math.round((used[key] / 1024 / 1024) * 100) / 100
            //         } MB`
            //     ;)
            // }
            // console.log("----------------------------------");
            const numberArray = nodeContext.get("numberArray");
            const contextNode = RED.nodes.getNode(config.context);
            const publicKeyNode = RED.nodes.getNode(config.publicKey);

            // handle input type of number or array
            let payload;
            try {
                if (config.isReceivedNumber === "true") {
                    // if input isn't number show error to node status
                    if (parseFloat(msg[config.msgKey]) === NaN) {
                        throw new Error(`msg.${config.msgKey} isn't number`);
                    }

                    // push new number in msg.payload(or value in config.msgKey) to the numberArray
                    numberArray.push(parseFloat(msg[config.msgKey]));

                    // if numberArray size is less than value that user set save array and waiting for another input
                    if (numberArray.length < config.numberArrayLength) {
                        nodeContext.set("numberArray", numberArray);
                        node.status({
                            fill: "blue",
                            shape: "ring",
                            text: `waiting ${numberArray.length}/${config.numberArrayLength}`,
                        });
                        return;
                        // else set numberArray to empty array and continue
                    } else {
                        nodeContext.set("numberArray", []);
                        payload = numberArray;
                    }
                } else {
                    if (!Array.isArray(msg[config.msgKey])) {
                        throw new Error(`msg.${config.msgKey} isn't array`);
                    }
                    payload = msg[config.msgKey];
                }

                if (!contextNode) {
                    throw new Error(`SEAL Context Node not found`);
                } else if (!publicKeyNode) {
                    throw new Error(`PublicKey node not found`);
                } else {
                    //get seal objects needed to encrypt the value from the config node
                    const context = contextNode.context;
                    const scale = contextNode.scale;
                    const publicKey = seal.PublicKey();
                    publicKey.load(context, publicKeyNode.publicKeyBase64);
                    const encoder = contextNode.encoder;
                    const encryptor = seal.Encryptor(context, publicKey);

                    if (payload.length > encoder.slotCount) {
                        throw new Error(
                            "input array length is longer than context can handle"
                        );
                    }

                    // create array that all index equal value for html and encoder.slotCount(polyModulus / 2) long;
                    const array = Float64Array.from(
                        { length: encoder.slotCount },
                        (_, i) => (payload[i] ? payload[i] : 0)
                    );
                    const plainText = encoder.encode(array, scale);
                    const cipherText = encryptor.encrypt(plainText);

                    const chainIndex = getChainIndex(cipherText, context);

                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: `ChainIndex: ${chainIndex}`,
                    });

                    msg.context = { contextNodeId: contextNode.id };
                    // latestNodeId use for check if ciphertext value change, add(E) and multi(E) node using this object property
                    msg.latestNodeId = config.id;
                    // pass input node type for checking from node that connected to this node
                    msg.payload = cipherText.save();
                    // if not error show chainIndex of output ciphertext
                    const msgArray = multipleOutput(msg, outputs, cipherText);

                    node.send(msgArray);

                    // delete unuse instance of seal objects prevent out of wasm memory error
                    cipherText.delete();
                    plainText.delete();
                    publicKey.delete();
                    encryptor.delete();
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: "red", shape: "ring", text: err });
            }
        });
    }

    RED.nodes.registerType("encrypt", encryptHandle);
};
