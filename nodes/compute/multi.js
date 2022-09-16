module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function multi(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;
		// get node context(like global store in node) for manage multiple input
		const nodeContext = node.context();
		const outputs = parseInt(config.outputs);

		// set queue and latestNodeId to empty array and null when first create node
		nodeContext.set('firstQueue', []);
		nodeContext.set('secondQueue', []);
		nodeContext.set('firstNodeId', null);
		nodeContext.set('secondNodeId', null);

		node.status({ fill: 'grey', shape: 'ring' });

		node.on('input', function (msg) {
			// get seal objects from config node
			const contextNode = RED.nodes.getNode(msg.context.contextNodeId);
			const relinKeyNode = RED.nodes.getNode(msg.relinKey.relinKeyNodeId);

			try {
				if (!contextNode) {
					throw new Error('SEALContext not found');
				} else if (!msg.payload.cipherText) {
					throw new Error('cipherText not found');
				}

				// get Queue and latestNodeId when msg come
				const firstQueue = nodeContext.get('firstQueue');
				const secondQueue = nodeContext.get('secondQueue');
				let firstNodeId = nodeContext.get('firstNodeId');
				let secondNodeId = nodeContext.get('secondNodeId');

				if (firstNodeId == null || msg.latestNodeId == firstNodeId) {
					const firstCipher = msg.payload.cipherText;
					firstNodeId = msg.latestNodeId;
					nodeContext.set('firstNodeId', firstNodeId);
					firstQueue.push({
						cipher: firstCipher,
					});
					node.status({
						fill: 'yellow',
						shape: 'ring',
						text: 'wait for another ciphertext',
					});
				} else if (secondNodeId == null || msg.latestNodeId == secondNodeId) {
					const secondCipher = msg.payload.cipherText;
					secondNodeId = msg.latestNodeId;
					nodeContext.set('secondNodeId', secondNodeId);
					secondQueue.push({
						cipher: secondCipher,
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

					// clone first and second ciphertext prevent racecondition
					const firstCipher = firstValue.cipher.clone();
					const secondCipher = secondValue.cipher.clone();

					const context = contextNode.context;
					const evaluator = contextNode.evaluator;
					const relinKey = seal.RelinKeys();
					relinKey.load(context, relinKeyNode.relinKeyBase64);
					const scale = contextNode.scale;

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
					// nodeStatusText += `ChainIndex: ${chainIndex}`;

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

					// delete seal object instance prevent out of wasm memory
					firstValue.cipher.delete();
					secondValue.cipher.delete();
					firstCipher.delete();
					secondCipher.delete();
					relinKey.delete();
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
