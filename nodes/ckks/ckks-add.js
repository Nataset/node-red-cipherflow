module.exports = async function (RED) {
    function ckksAdd(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', function (msg) {
                let cipher1, cipher2;
                Object.values(msg.payload).forEach((cipher, i) => {
                    i === 0 ? (cipher1 = cipher) : (cipher2 = cipher);
                });
                const evaluator = node.CKKSContext.evaluator;
                const cipherResult = evaluator.add(cipher1.clone(), cipher2.clone());

                msg.payload = cipherResult;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-add', ckksAdd);
};
