module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');

    function ckksMultiPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const value = config.value;
        const isRescale = config.rescale;
        const flowContext = node.context().flow;

        if (!value) {
            const err = new Error('value field is empty');
            node.error(err);
            node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            return;
        }

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = flowContext.get(msg.contextName);
            try {
                if (!SEALContexts) {
                    throw new Error('SEALContext not found');
                } else if (!msg.payload.cipherText) {
                    throw new Error('CipherText not found');
                } else {
                    const cipherText = msg.payload.cipherText;

                    const context = SEALContexts.context;
                    const encoder = SEALContexts.encoder;
                    const evaluator = SEALContexts.evaluator;
                    const scale = SEALContexts.scale;

                    const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                    const plainText = encoder.encode(array, scale);
                    evaluator.multiplyPlain(cipherText, plainText, cipherText);

                    if (isRescale) {
                        evaluator.rescaleToNext(cipherText, cipherText);
                        cipherText.setScale(scale);
                    }

                    const chainIndex = getChainIndex(cipherText, context);
                    const currentScale = getScale(cipherText);

                    node.status({
                        fill: 'green',
                        shape: 'dot',
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

    RED.nodes.registerType('ckks-multiPlain', ckksMultiPlain);
};
