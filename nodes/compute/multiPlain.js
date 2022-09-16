/* 
	multiply known value to the ciphertext
	---use 1 chainIndex---
	input: ciphertext in msg.payload
	output: multiplied result ciphertext in msg.payload
*/
module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function multiPlain(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;
		// get value from node html page
		const value = parseFloat(config.value);
		const outputs = parseInt(config.outputs);

		if (!value) {
			const err = new Error('value field is empty');
			node.error(err);
			node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			return;
		} else {
			node.status({ fill: 'blue', shape: 'ring', text: `Value: ${value}` });
		}

		node.on('input', function (msg) {
			// get seal objects from config node
			const contextNode = RED.nodes.getNode(msg.context.contextNodeId);
			const relinKeyNode = RED.nodes.getNode(msg.relinKey.relinKeyNodeId);

			try {
				if (!contextNode) {
					throw new Error('SEALContext node not found');
				} else if (!msg.payload.cipherText) {
					throw new Error('cipherText not found');
				} else {
					// cloen the ciphertext prevent race condition
					const inputCipher = msg.payload.cipherText;
					const cipherText = inputCipher.clone();

					// get seal objects needed to multiply value to the ciphertext from config ndoe
					const context = contextNode.context;
					const encoder = contextNode.encoder;
					const evaluator = contextNode.evaluator;
					const scale = contextNode.scale;
					const relinKey = seal.RelinKeys();
					relinKey.load(context, relinKeyNode.relinKeyBase64);

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

					// if not error show chainIndex of output ciphertext
					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});

					msg.latestNodeId = config.id;
					msg.payload = { cipherText: cipherText };
					const msgArray = [msg];
					for (i = 1; i < outputs; i++) {
						const newMsg = { ...msg };
						newMsg.payload = { cipherText: cipherText.clone() };
						msgArray.push(newMsg);
					}

					node.send(msgArray, false);

					// delete unuse instance of seal objects prevent out of wasm memory error
					inputCipher.delete();
					plainText.delete();
					relinKey.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('multi(P)', multiPlain);
};
