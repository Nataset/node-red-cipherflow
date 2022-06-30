module.exports = function (RED) {
    const { getChainIndex } = require('../../util/getDetail.js');
    const { handleFindError } = require('../../util/vaildation.js');

    function multiPlain(config) {
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
                    let nodeStatusText = '';
                    let newExactResult;
                    const inputNodeType = msg.inputNodeType;

                    if (inputNodeType == 'single') {
                        newExactResult = msg.exactResult * value;
                    } else if (inputNodeType == 'range') {
                        newExactResult = msg.exactResult.map(num => num * value);
                    }

                    const cipherText = msg.payload.cipherText.clone();

                    const context = SEALContexts.context;
                    const encoder = SEALContexts.encoder;
                    const evaluator = SEALContexts.evaluator;
                    const scale = SEALContexts.scale;
                    const relinKey = SEALContexts.relinKey;

                    const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                    const plainText = encoder.encode(array, cipherText.scale);
                    evaluator.plainModSwitchTo(plainText, cipherText.parmsId, plainText);
                    evaluator.multiplyPlain(cipherText, plainText, cipherText);
                    evaluator.relinearize(cipherText, relinKey, cipherText);

                    evaluator.rescaleToNext(cipherText, cipherText);
                    cipherText.setScale(scale);

                    const chainIndex = getChainIndex(cipherText, context);
                    nodeStatusText += `ChainIndex: ${chainIndex}`;

                    nodeStatusText += handleFindError(
                        node,
                        config,
                        SEALContexts,
                        cipherText,
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
                    msg.payload = { cipherText: cipherText };
                    node.send(msg);
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('multi(P)', multiPlain);
};
