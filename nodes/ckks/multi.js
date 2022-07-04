module.exports = function (RED) {
    const { getChainIndex } = require('../../util/getDetail.js');
    const { handleFindError } = require('../../util/vaildation.js');

    function multi(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        // const isRescale = config.rescale;
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
                    firstQueue.push({
                        cipher: firstCipher,
                        exactValue: msg.exactResult,
                        inputNodeType: msg.inputNodeType,
                    });
                    node.status({
                        fill: 'yellow',
                        shape: 'ring',
                        text: 'wait for another ciphertext',
                    });
                } else if (secondNodeId == null || msg.latestNodeId == secondNodeId) {
                    const secondCipher = msg.payload.cipherText.clone();
                    secondNodeId = msg.latestNodeId;
                    nodeContext.set('secondNodeId', secondNodeId);
                    secondQueue.push({
                        cipher: secondCipher,
                        exactValue: msg.exactResult,
                        inputNodeType: msg.inputNodeType,
                    });
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
                    const firstValue = firstQueue.shift();
                    const secondValue = secondQueue.shift();

                    const firstCipher = firstValue.cipher.clone();
                    const secondCipher = secondValue.cipher.clone();
                    const firstExact = firstValue.exactValue;
                    const secondExact = secondValue.exactValue;
                    const firstInputNodeType = firstValue.inputNodeType;
                    const secondInputNodeType = secondValue.inputNodeType;

                    let nodeStatusText = '';
                    let newExact;

                    if (firstInputNodeType == 'single' && secondInputNodeType == 'single') {
                        newExact = firstExact * secondExact;
                    } else if (firstInputNodeType == 'single' && secondInputNodeType == 'range') {
                        newExact = secondExact.map(value => value + firstExact);
                    } else if (firstInputNodeType == 'range' && secondInputNodeType == 'single') {
                        newExact = firstExact.map(value => value + secondExact);
                    } else if (firstInputNodeType == 'range' && secondInputNodeType == 'range') {
                        newExact = firstExact.map((value, i) => value + secondExact[i]);
                    }
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
                    // if (isRescale) {
                    evaluator.rescaleToNext(resultCipher, resultCipher);
                    resultCipher.setScale(scale);
                    // }

                    // getChainIndex for the resultCipher and show it to the node status(text below node in node-red)
                    const chainIndex = getChainIndex(resultCipher, context);
                    nodeStatusText += `ChainIndex: ${chainIndex}`;

                    if (firstInputNodeType == 'single' && secondInputNodeType == 'single') {
                        nodeStatusText += handleFindError(
                            node,
                            config,
                            SEALContexts,
                            resultCipher,
                            newExact,
                            'single',
                        );
                    } else {
                        nodeStatusText += handleFindError(
                            node,
                            config,
                            SEALContexts,
                            resultCipher,
                            newExact,
                            'range',
                        );
                    }

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: nodeStatusText,
                    });

                    msg.exactResult = newExact;
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
