/* 
    multiply known value to the ciphertext
    ---use 1 chainIndex---
    input: ciphertext in msg.payload
    output: multiplied result ciphertext in msg.payload
*/
module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');
	const { handleFindError } = require('../../util/vaildation.js');

	function multiPlain(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		// get value from node html page
		const value = parseFloat(config.value);
		// const flowContext = node.context().flow;

		if (!value) {
			const err = new Error('value field is empty');
			node.error(err);
			node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			return;
		} else {
			node.status({ fill: 'blue', shape: 'ring', text: `Value: ${value}` });
		}

		node.on('input', function (msg) {
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);
			// const SEALContexts = flowContext.get(msg.contextName);
			try {
				if (!SEALContexts) {
					throw new Error('SEALContext not found');
				} else if (!msg.payload.cipherText) {
					throw new Error('cipherText not found');
				} else {
					// compute new exact value of this node
					const newExactResult = msg.exactResult * value;

					// cloen the ciphertext prevent race condition
					const cipherText = msg.payload.cipherText.clone();

					// get seal objects needed to multiply value to the ciphertext from config ndoe
					const context = SEALContexts.context;
					const encoder = SEALContexts.encoder;
					const evaluator = SEALContexts.evaluator;
					const scale = SEALContexts.scale;
					const relinKey = SEALContexts.relinKey;

					// encode value to plaintext before multiply to ciphertext
					const array = Float64Array.from({ length: encoder.slotCount }, () => value);
					const plainText = encoder.encode(array, cipherText.scale);
					// change plaintext chainIndex to same level of ciphertext
					evaluator.plainModSwitchTo(plainText, cipherText.parmsId, plainText);
					evaluator.multiplyPlain(cipherText, plainText, cipherText);
					// relinearize to reduce size of the ciphertext and improve precision
					evaluator.relinearize(cipherText, relinKey, cipherText);

					// rescale ciphertext make future operator can operate with result ciphertext
					evaluator.rescaleToNext(cipherText, cipherText);
					cipherText.setScale(scale);

					const chainIndex = getChainIndex(cipherText, context);
					// nodeStatusText += `ChainIndex: ${chainIndex}`;

					// nodeStatusText += handleFindError(
					// 	node,
					// 	config,
					// 	SEALContexts,
					// 	cipherText,
					// 	newExactResult,
					// 	inputNodeType,
					// );

					// if not error show chainIndex of output ciphertext
					node.status({
						fill: 'green',
						shape: 'ring',
						text: nodeStatusText,
					});

					msg.exactResult = newExactResult;
					msg.latestNodeId = config.id;
					msg.payload = { cipherText: cipherText };
					node.send(msg);

					// delete unuse instance of seal objects prevent out of wasm memory error
					plainText.delete();
					msg.payload.cipherText.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('multi(P)', multiPlain);
};
