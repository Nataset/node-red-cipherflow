/* 
    Exponentiation ciphertext with base is ciphertext and an exponent n for html page
    ---use n-1 chainIndex---
    input: ciphertext in msg.payload
    output: exponented result ciphertext in msg.payload
*/

module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');
	// const { handleFindError } = require('../../util/vaildation.js');

	function exponent(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		// get n from html page;
		const n = parseFloat(config.n);

		// n can't not be less than 2 if it is show error to node status
		if (n < 2) {
			const err = new Error(`exponent number can't be less than 2`);
			node.error(err);
			node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			return;
		}
		// show what user input n in html page to node status
		node.status({ fill: 'blue', shape: 'ring', text: `exponent: ${n}` });

		node.on('input', function (msg) {
			// get seal objects from config node
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

			try {
				if (!SEALContexts) {
					throw new Error(`SEALContexts not found`);
				} else if (!msg.payload.cipherText) {
					throw new Error(`cipherText not found`);
				} else {
					// compule new value of exact result
					const newExactResult = parseFloat(msg.exactResult) ** n;

					// declare variable for power the ciphertext
					const context = SEALContexts.context;
					const evaluator = SEALContexts.evaluator;
					const relinKey = SEALContexts.relinKey;
					const scale = SEALContexts.scale;

					// clone ciphertext prevent race condition
					const inputCipher = msg.payload.cipherText;
					const cipherText = inputCipher.clone();
					const resultCipher = inputCipher.clone();

					// power ciphertext by ciphertext multiply it self n time
					// rescale each time it multiply
					for (let i = 1; i < n; i++) {
						evaluator.multiply(resultCipher, cipherText, resultCipher);
						evaluator.relinearize(resultCipher, relinKey, resultCipher);
						evaluator.cipherModSwitchToNext(cipherText, cipherText);
						evaluator.rescaleToNext(resultCipher, resultCipher);
						resultCipher.setScale(scale);
					}

					const chainIndex = getChainIndex(resultCipher, context);

					// nodeStatusText += handleFindError(
					// 	node,
					// 	config,
					// 	SEALContexts,
					// 	resultCipher,
					// 	newExactResult,
					// 	inputNodeType,
					// );

					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});

					msg.exactResult = newExactResult;
					msg.latestNodeId = config.id;
					msg.payload = { cipherText: resultCipher };
					node.send(msg);

					// delete unuse seal instance prevent out of wasm memory error
					inputCipher.delete();
					cipherText.delete();
				}
			} catch (err) {
				node.error(err, msg);
				node.status({ fill: 'red', shape: 'ring', text: err });
			}
		});
	}

	RED.nodes.registerType('exponent', exponent);
};
