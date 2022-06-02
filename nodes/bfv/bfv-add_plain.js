module.export = function (RED) {
    function bfvAddPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        const inputArray = JSON.parse(config.array).array;

        node.on('input', function (msg) {
            const encoder = flowContext.get('encoder');
            const evaluator = flowContext.get('evaluator');
            const cipherText = msg.payload;

            const array = Int32Array.from(inputArray);
            const addPlainText = encoder.encode(array);

            evaluator.addPlain(cipherText, addPlainText, cipherText);

            msg.payload = cipherText;
            node.send(msg);
        });
    }

    RED.nodes.registerType('BFV-Add', bfvAddPlain);
};
