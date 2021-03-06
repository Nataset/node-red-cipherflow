module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');

    function subPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const value = config.value;
        // const flowContext = node.context().flow;

        if (!value) {
            const err = new Error('value field is empty');
            node.error(err);
            node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            return;
        }

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.nodeId);
            // const SEALContexts = flowContext.get(msg.contextName);
            try {
                if (!SEALContexts) {
                    throw new Error('SEALContext not found');
                } else if (!msg.payload.cipherText) {
                    throw new Error('cipherText not found');
                } else {
                    const cipherText = msg.payload.cipherText.clone();

                    const context = SEALContexts.context;
                    const encoder = SEALContexts.encoder;
                    const evaluator = SEALContexts.evaluator;

                    const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                    const plainText = encoder.encode(array, cipherText.scale);
                    evaluator.plainModSwitchTo(plainText, cipherText.parmsId, plainText);
                    evaluator.subPlain(cipherText, plainText, cipherText);

                    const chainIndex = getChainIndex(cipherText, context);
                    const currentScale = getScale(cipherText);

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: `ChainIndex: ${chainIndex}, Scale: ${currentScale}`,
                    });

                    msg.payload = { cipherText: cipherText };
                    node.send(msg);
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('sub(P)', subPlain);
};
