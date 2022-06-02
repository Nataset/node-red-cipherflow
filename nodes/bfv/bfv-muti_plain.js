module.exports = function (RED) {
    function bfvMutiPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        const inputArray = JSON.parse(config.array).array;

        node.on('input', function (msg) {
            const encoder = flowContext.get('encoder');
            const evaluator = flowContext.get('evaluator');
            const cipherText = msg.payload;

            const array = Int32Array.from(inputArray);
            const mutiPlainText = encoder.encode(array);

            evaluator.multiplyPlain(cipherText, mutiPlainText, cipherText);

            msg.payload = cipherText;
            console.log(cipherText);
            node.send(msg);
        });
    }
    RED.nodes.registerType('BFV-MutiPlain', bfvMutiPlain);
};
