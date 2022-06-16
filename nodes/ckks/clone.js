module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');

    function clone(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const topic = config.topic;
        // const flowContext = node.context().flow;

        if (!topic) {
            const err = new Error('cloned variable name field is empty');
            node.error(err);
            node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            return;
        }

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.node_id);

            try {
                if (!SEALContexts) {
                    throw new Error(`SEALContexts not found`);
                } else {
                    const cipherText = msg.payload.cipherText;
                    const context = SEALContexts.context;

                    const cipherTextClone = cipherText.clone();

                    const chainIndex = getChainIndex(cipherTextClone, context);
                    const currentScale = getScale(cipherTextClone);

                    if (msg.topic == topic) {
                        throw new Error(
                            `cloned variable can't have same name As an origin variable`,
                        );
                    }
                    msg.topic = topic;
                    msg.payload = { cipherText: cipherTextClone };

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: `ChainIndex: ${chainIndex}, Scale: ${currentScale}`,
                    });

                    node.send(msg);
                }
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'ring', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('clone', clone);
};
