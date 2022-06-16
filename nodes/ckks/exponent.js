module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');

    function exponent(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const isRescale = config.rescale;
        const n = config.n;
        // const flowContext = node.context().flow;

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.node_id);
            // const SEALContexts = flowContext.get(msg.contextName);

            try {
                if (!SEALContexts) {
                    throw new Error(`SEALContexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`cipherText not found`);
                } else {
                    const context = SEALContexts.context;
                    const evaluator = SEALContexts.evaluator;
                    const relinKey = SEALContexts.relinKey;
                    const scale = SEALContexts.scale;

                    const cipherText = msg.payload.cipherText.clone();
                    const resultCipher = msg.payload.cipherText.clone();

                    for (let i = 1; i < n; i++) {
                        evaluator.multiply(resultCipher, cipherText, resultCipher);
                        evaluator.relinearize(resultCipher, relinKey, resultCipher);
                        if (isRescale) {
                            evaluator.cipherModSwitchToNext(cipherText, cipherText);
                            evaluator.rescaleToNext(resultCipher, resultCipher);
                            resultCipher.setScale(scale);
                        }
                    }

                    const chainIndex = getChainIndex(resultCipher, context);
                    const currentScale = getScale(resultCipher);

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: `ChainIndex: ${chainIndex}, Scale: ${currentScale}`,
                    });

                    msg.payload = { cipherText: resultCipher };
                    node.send(msg);
                }
            } catch (err) {
                node.error(err, msg);
                node.status({ fill: 'red', shape: 'ring', text: err });
            }
        });
    }

    RED.nodes.registerType('exponent', exponent);
};
