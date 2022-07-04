module.exports = function (RED) {
    const { getChainIndex } = require('../../util/getDetail.js');
    const { handleFindError } = require('../../util/vaildation.js');

    function addPlain(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const value = parseFloat(config.value);
        // const flowContext = node.context().flow;
        const showErrorPercent = config.showErrorPercent;
        const showErrorDetail = config.showErrorDetail;

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
                    throw new Error('CipherText not found');
                } else {
                    let nodeStatusText = '';
                    let newExactResult;
                    const inputNodeType = msg.inputNodeType;

                    if (inputNodeType == 'single') {
                        newExactResult = parseFloat(msg.exactResult) + value;
                    }

                    const cipherText = msg.payload.cipherText.clone();
                    const context = SEALContexts.context;
                    const encoder = SEALContexts.encoder;
                    const evaluator = SEALContexts.evaluator;

                    const array = Float64Array.from({ length: encoder.slotCount }, () => value);
                    const plainText = encoder.encode(array, cipherText.scale);
                    evaluator.plainModSwitchTo(plainText, cipherText.parmsId, plainText);
                    evaluator.addPlain(cipherText, plainText, cipherText);

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

    RED.nodes.registerType('add(P)', addPlain);
};
