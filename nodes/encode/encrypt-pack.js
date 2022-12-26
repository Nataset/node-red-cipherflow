module.exports = function (RED) {
    const { getChainIndex } = require("../../util/getDetail.js");

    function encryptHandle(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const nodeContext = this.context();
        nodeContext.set("numberArray", []);
        nodeContext.set("timeArray", []);
        const startNull = Math.pow(2, 50) - 1000;
        const endNull = Math.pow(2, 30);
        const ckksNull = -((startNull + endNull) / 2);

        const node = this;

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
            // const used = process.memoryUsage();
            // for (let key in used) {
            //     console.log(
            //         `Memory: ${key} ${
            //             Math.round((used[key] / 1024 / 1024) * 100) / 100
            //         } MB`
            //     );
            // }
            // console.log("----------------------------------");
            const numberArray = nodeContext.get("numberArray");
            const timeArray = nodeContext.get("timeArray");
            const contextNode = RED.nodes.getNode(config.context);
            const publicKeyNode = RED.nodes.getNode(config.publicKey);

            const outputs = parseInt(config.outputs);

            // handle input type of number or array
            let payload;
            try {
                // if input isn't number show error to node status
                if (parseFloat(msg[config.msgKey]) === NaN) {
                    throw new Error(`msg.${config.msgKey} isn't number`);
                }

                // push new number in msg.payload(or value in config.msgKey) to the numberArray
                const time = Date.now();
                node.warn("Time=" + time);
                numberArray.unshift(parseFloat(msg[config.msgKey]));
                timeArray.unshift(parseFloat(time));

                // if numberArray size is less than value that user set save array and waiting for another input
                if (numberArray.length < config.numberArrayLength) {
                    nodeContext.set("numberArray", numberArray);
                    nodeContext.set("timeArray", timeArray);
                    node.status({
                        fill: "blue",
                        shape: "ring",
                        text: `waiting ${numberArray.length}/${config.numberArrayLength}`,
                    });
                    return;
                    // else set numberArray to empty array and continue
                } else {
                    nodeContext.set("numberArray", numberArray.slice(0, -1));
                    nodeContext.set("timeArray", timeArray.slice(0, -1));
                    payload = numberArray;
                    payload2 = timeArray;
                }

                if (!contextNode) {
                    throw new Error(`SEAL Context Node not found`);
                } else if (!publicKeyNode) {
                    throw new Error(`PublicKey node not found`);
                } else {
                    console.log("what te");
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

                    const array2 = Float64Array.from(
                        { length: encoder.slotCount },
                        (_, i) => (payload2[i] ? payload2[i] : 0)
                    );
                    const plainText2 = encoder.encode(array2, scale);
                    const cipherTextTime = encryptor.encrypt(plainText2);

                    const chainIndex = getChainIndex(cipherText, context);

                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: `ChainIndex: ${chainIndex}`,
                    });

                    // delete unuse instance of seal objects prevent out of wasm memory error

                    // latestNodeId use for check if ciphertext value change, add(E) and multi(E) node using this object property
                    msg.latestNodeId = config.id;
                    // pass input node type for checking from node that connected to this node
                    msg.payload = {
                        cipherText: cipherText.save(),
                        timestamp: cipherTextTime.save(),
                    };
                    // if not error show chainIndex of output ciphertext

                    cipherText.delete();
                    cipherTextTime.delete();
                    plainText.delete();
                    publicKey.delete();
                    encryptor.delete();

                    node.send(msg, true);
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: "red", shape: "ring", text: err });
            }
        });
    }

    RED.nodes.registerType("encrypt-pack", encryptHandle);
};
