module.exports = function (RED) {
    function toBase64(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const outputs = parseInt(config.outputs);

        node.on("input", function (msg) {
            node.status({});
            try {
                const ciphertext = msg.payload.cipherText;
                const base64Data = ciphertext.save();

                ciphertext.delete();

                const newMsg = {};

                newMsg.payload = base64Data;

                const msgArray = [newMsg];
                for (i = 1; i < outputs; i++) {
                    const cloneMsg = { ...newMsg };
                    msgArray.push(cloneMsg);
                }
                node.send(msgArray);
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

    RED.nodes.registerType("toBase64", toBase64);
};
