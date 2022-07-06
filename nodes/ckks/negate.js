/*
    negate ciphertext input value
    ---use 0 chainIndex---
    input: ciphertext in msg.payload
    output: negated result ciphertext in msg.payload
*/

module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');
	// const { handleFindError } = require('../../util/vaildation.js');

	function negate(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		// node status show grey ring when first create
		node.status({ fill: 'grey', shape: 'ring' });

		node.on('input', function (msg) {
			// get seal objects from config node
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

			try {
				if (!SEALContexts) {
					throw new Error(`SEAL Contexts not found`);
				} else if (!msg.payload.cipherText) {
					throw new Error(`CipherText not found`);
				}

				const newExactResult = -1 * parseFloat(msg.exactResult);

				// clone input ciphertext to prevent race condition error
				const inputCipher = msg.payload.cipherText;
				const cipherText = inputCipher.clone();

				// declare varibale for negate ciphertext
				const evaluator = SEALContexts.evaluator;
				const context = SEALContexts.context;

				// negate the ciphertext
				evaluator.negate(cipherText, cipherText);

				const chainIndex = getChainIndex(cipherText, context);

				// nodeStatusText += handleFindError(
				// 	node,
				// 	config,
				// 	SEALContexts,
				// 	cipherText,
				// 	newExactResult,
				// 	inputNodeType,
				// );

				// show output ciphertext chainIndex to the node status
				node.status({
					fill: 'green',
					shape: 'ring',
					text: `ChainIndex: ${chainIndex}`,
				});

				msg.exactResult = newExactResult;
				msg.latestNodeId = config.id;
				msg.payload = { cipherText: cipherText };
				node.send(msg);

				// delete unuse seal instance prevent out of wasm memory error
				inputCipher.delete();
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('negate', negate);
};
