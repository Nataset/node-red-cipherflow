module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');
    function chainDown(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const n = config.n;

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.node_id);
            try {
                if (!SEALContexts) {
                    throw new Error(`SEAL Contexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`CipherText not found`);
                }
                const cipherText = msg.payload.cipherText.clone();
                const evaluator = SEALContexts.evaluator;
                const context = SEALContexts.context;

                for (let i = 0; i < n; i++) {
                    evaluator.cipherModSwitchToNext(cipherText, cipherText);
                }

                const chainIndex = getChainIndex(cipherText, context);
                const currentScale = getScale(cipherText);

                node.status({
                    fill: 'green',
                    shape: 'ring',
                    text: `ChainIndex: ${chainIndex}, Scale: ${currentScale}`,
                });

                msg.payload = { cipherText: cipherText };
                node.send(msg);
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('chain down', chainDown);
};
