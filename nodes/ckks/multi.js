const { getChainIndex, getScale, logParameters } = require('../util.js');

module.exports = function (RED) {
    function multi(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const isRescale = config.rescale;
        const nodeContext = node.context();
        nodeContext.set('firstQueue', []);
        nodeContext.set('secondQueue', []);
        nodeContext.set('firstNodeId', null);
        nodeContext.set('secondNodeId', null);

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

            try {
                if (!SEALContexts) {
                    throw new Error('SEALContext not found');
                } else if (!msg.payload.cipherText) {
                    throw new Error('cipherText not found');
                }

                const firstQueue = nodeContext.get('firstQueue');
                const secondQueue = nodeContext.get('secondQueue');
                let firstNodeId = nodeContext.get('firstNodeId');
                let secondNodeId = nodeContext.get('secondNodeId');

                if (firstNodeId == null || msg.latestNodeId == firstNodeId) {
                    const firstCipher = msg.payload.cipherText.clone();
                    firstNodeId = msg.latestNodeId;
                    nodeContext.set('firstNodeId', firstNodeId);
                    firstQueue.push(firstCipher);
                    node.status({
                        fill: 'yellow',
                        shape: 'ring',
                        text: 'wait for another ciphertext',
                    });
                } else if (secondNodeId == null || msg.latestNodeId == secondNodeId) {
                    const secondCipher = msg.payload.cipherText.clone();
                    secondNodeId = msg.latestNodeId;
                    nodeContext.set('secondNodeId', secondNodeId);
                    secondQueue.push(secondCipher);
                    node.status({
                        fill: 'yellow',
                        shape: 'ring',
                        text: 'wait for another ciphertext',
                    });
                } else {
                    throw new Error('input more than 2 ciphertext');
                }

                if (firstQueue.length > 0 && secondQueue.length > 0) {
                    // get firstCipher, secondCipher from Queue
                    const firstCipher = firstQueue.shift();
                    const secondCipher = secondQueue.shift();
                    const context = SEALContexts.context;
                    const evaluator = SEALContexts.evaluator;
                    const relinKey = SEALContexts.relinKey;
                    const scale = SEALContexts.scale;

                    // equal fisrtCipher chainIndex to secondCipher chainIndex
                    const firstChainIndex = getChainIndex(firstCipher, context);
                    const secondChainIndex = getChainIndex(secondCipher, context);
                    firstChainIndex - secondChainIndex > 0
                        ? evaluator.cipherModSwitchTo(
                              firstCipher,
                              secondCipher.parmsId,
                              firstCipher,
                          )
                        : evaluator.cipherModSwitchTo(
                              secondCipher,
                              firstCipher.parmsId,
                              secondCipher,
                          );

                    // multiply firstCipher and secondCipher
                    const resultCipher = evaluator.multiply(firstCipher, secondCipher);
                    evaluator.relinearize(resultCipher, relinKey, resultCipher);

                    // rescale the result cipher
                    if (isRescale) {
                        evaluator.rescaleToNext(resultCipher, resultCipher);
                        resultCipher.setScale(scale);
                    }

                    // getChainIndex for the resultCipher and show it to the node status(text below node in node-red)
                    const chainIndex = getChainIndex(resultCipher, context);
                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: `ChainIndex: ${chainIndex}`,
                    });

                    //sent output msg
                    msg.latestNodeId = config.id;
                    msg.payload = { cipherText: resultCipher };
                    node.send(msg);
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
                return;
            }
        });

        node.on('close', function () {
            nodeContext.set('firstQueue', []);
            nodeContext.set('secondQueue', []);
            nodeContext.set('firstNodeId', null);
            nodeContext.set('secondNodeId', null);
        });
    }

    RED.nodes.registerType('multi(E)', multi);
};
