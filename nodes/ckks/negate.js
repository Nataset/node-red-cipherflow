module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');
    function negate(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

            try {
                if (!SEALContexts) {
                    throw new Error(`SEAL Contexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`CipherText not found`);
                }
                const cipherText = msg.payload.cipherText.clone();
                const evaluator = SEALContexts.evaluator;
                const context = SEALContexts.context;

                evaluator.negate(cipherText, cipherText);

                const chainIndex = getChainIndex(cipherText, context);

                node.status({
                    fill: 'green',
                    shape: 'ring',
                    text: `ChainIndex: ${chainIndex}`,
                });

                msg.latestNodeId = config.id;
                msg.payload = { cipherText: cipherText };
                node.send(msg);
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('negate', negate);
};
