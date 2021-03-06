module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');

    function sub(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const xName = config.xName;
        const yName = config.yName;
        const resultName = config.resultName;
        // const flowContext = node.context().flow;
        const nodeContext = node.context();

        if (!xName || !yName) {
            const err = new Error(`did't specific variables name`);
            node.error(err);
            node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            return;
        }

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

            if (msg.topic == xName) {
                const xCipher = msg.payload.cipherText.clone();
                nodeContext.set('xCipher', xCipher);
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: 'wait for another ciphertext',
                });
            } else if (msg.topic == yName) {
                const yCipher = msg.payload.cipherText.clone();
                nodeContext.set('yCipher', yCipher);
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: 'wait for another ciphertext',
                });
            }

            const xCipher = nodeContext.get('xCipher');
            const yCipher = nodeContext.get('yCipher');
            try {
                if (!SEALContexts) {
                    throw new Error('SEALContext not found');
                } else if (!msg.payload.cipherText) {
                    throw new Error('cipherText not found');
                } else if (xCipher && yCipher) {
                    const context = SEALContexts.context;
                    const evaluator = SEALContexts.evaluator;

                    const resultCipher = evaluator.sub(xCipher, yCipher);

                    const chainIndex = getChainIndex(resultCipher, context);
                    const currentScale = getScale(resultCipher);

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: `ChainIndex: ${chainIndex}, Scale: ${currentScale}`,
                    });

                    msg.topic = resultName ? resultName : xName;
                    msg.payload = { cipherText: resultCipher };
                    node.send(msg);
                    nodeContext.set('xCipher', '');
                    nodeContext.set('yCipher', '');
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('sub(E)', sub);
};
