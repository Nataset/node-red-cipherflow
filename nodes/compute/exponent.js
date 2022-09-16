/* 
	Exponentiation ciphertext with base is ciphertext and an exponent n for html page
	---use n-1 chainIndex---
	input: ciphertext in msg.payload
	output: exponented result ciphertext in msg.payload
*/

module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function exponent(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;
		const outputs = config.outputs;
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
			const contextNode = RED.nodes.getNode(msg.context.contextNodeId);
			const relinKeyNode = RED.nodes.getNode(msg.relinKey.relinKeyNodeId);

			try {
				if (!contextNode) {
					throw new Error(`SEALContexts not found`);
				} else if (!msg.payload.cipherText) {
					throw new Error(`cipherText not found`);
				} else {
					// compule new value of exact result

					// declare variable for power the ciphertext
					const context = contextNode.context;
					const evaluator = contextNode.evaluator;
					const relinKey = seal.RelinKeys();
					relinKey.load(context, relinKeyNode.relinKeyBase64);
					const scale = contextNode.scale;

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

					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});

					msg.latestNodeId = config.id;
					msg.payload = { cipherText: resultCipher };
					const msgArray = [msg];
					for (i = 1; i < outputs; i++) {
						const newMsg = { ...msg };
						newMsg.payload = { cipherText: resultCipher.clone() };
						msgArray.push(newMsg);
					}

					node.send(msgArray, false);

					// delete unuse seal instance prevent out of wasm memory error
					inputCipher.delete();
					cipherText.delete();
					relinKey.delete();

				}
			} catch (err) {
				node.error(err, msg);
				node.status({ fill: 'red', shape: 'ring', text: err });
			}
		});
	}

	RED.nodes.registerType('exponent', exponent);
};
