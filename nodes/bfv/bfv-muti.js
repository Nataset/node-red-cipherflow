module.export = function (RED) {
    function bfvMuti(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        const inputArray = JSON.parse(config.array).array;

        node.on('input', function (msg) {
            const encoder = flowContext.get('encoder');
            const encryptor = flowContext.get('encryptor');
            const evaluator = flowContext.get('evaluator');
            const cipherText = msg.payload;

            const array = Int32Array.from(inputArray);
            const mutiPlainText = encoder.encode(array);
            const mutiCipherText = encryptor.encrypt(mutiPlainText);

            evaluator.multiply(cipherText, mutiCipherText, cipherText);

            msg.payload = cipherText;
            node.send(msg);
        });
    }
    RED.nodes.registerType('BFV-Muti', bfvMuti);
};
