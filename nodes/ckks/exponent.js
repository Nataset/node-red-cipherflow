module.exports = function (RED) {
    const { getChainIndex } = require('../../util/getDetail.js');
    const { handleFindError } = require('../../util/vaildation.js');

    function exponent(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const n = parseFloat(config.n);
        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

            try {
                if (!SEALContexts) {
                    throw new Error(`SEALContexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`cipherText not found`);
                } else {
                    let nodeStatusText = '';
                    let newExactResult;
                    const inputNodeType = msg.inputNodeType;

                    if (inputNodeType == 'single') {
                        newExactResult = parseFloat(msg.exactResult) ** n;
                    } else if (inputNodeType == 'range') {
                        newExactResult = msg.exactResult.map(value => value ** n);
                    }

                    const context = SEALContexts.context;
                    const evaluator = SEALContexts.evaluator;
                    const relinKey = SEALContexts.relinKey;
                    const scale = SEALContexts.scale;

                    const cipherText = msg.payload.cipherText.clone();
                    const resultCipher = msg.payload.cipherText.clone();

                    for (let i = 1; i < n; i++) {
                        evaluator.multiply(resultCipher, cipherText, resultCipher);
                        evaluator.relinearize(resultCipher, relinKey, resultCipher);
                        evaluator.cipherModSwitchToNext(cipherText, cipherText);
                        evaluator.rescaleToNext(resultCipher, resultCipher);
                        resultCipher.setScale(scale);
                    }

                    const chainIndex = getChainIndex(resultCipher, context);
                    nodeStatusText += `ChainIndex: ${chainIndex}`;

                    nodeStatusText += handleFindError(
                        node,
                        config,
                        SEALContexts,
                        resultCipher,
                        newExactResult,
                        inputNodeType,
                    );

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: nodeStatusText,
                    });

                    msg.exactResult = newExactResult;
                    msg.latestNodeId = config.id;
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
