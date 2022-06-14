module.exports = function (RED) {
    function ckksMulti(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', function (msg) {
                let cipher1, cipher2;
                Object.values(msg.payload).forEach((cipher, i) => {
                    i === 0 ? (cipher1 = cipher) : (cipher2 = cipher);
                });
                const evaluator = node.CKKSContext.evaluator;
                const cipherResult = evaluator.multiply(cipher1.clone(), cipher2.clone());

                msg.payload = cipherResult;
                node.send(msg);
            });
        } else if (flowContext.get('context')) {
            node.on('input', function (msg) {
                let cipher1, cipher2;
                Object.values(msg.payload).forEach((cipher, i) => {
                    i === 0 ? (cipher1 = cipher) : (cipher2 = cipher);
                });
                const evaluator = flowContext.get('evaluator');
                const cipherResult = evaluator.multiply(cipher1.clone(), cipher2.clone());

                msg.payload = cipherResult;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }
    ckksMulti;
    RED.nodes.registerType('ckks-multi', ckksMulti);
};
