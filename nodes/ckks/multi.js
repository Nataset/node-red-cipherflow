module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');
	const { handleFindError } = require('../../util/vaildation.js');

	function multi(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		// get node context(like global store in node) for manage multiple input
		const nodeContext = node.context();

		// set queue and latestNodeId to empty array and null when first create node
		nodeContext.set('firstQueue', []);
		nodeContext.set('secondQueue', []);
		nodeContext.set('firstNodeId', null);
		nodeContext.set('secondNodeId', null);

		node.status({ fill: 'grey', shape: 'ring' });

		node.on('input', function (msg) {
			// get seal objects from config node
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

			try {
				if (!SEALContexts) {
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
						exactValue: msg.exactResult,
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
						exactValue: msg.exactResult,
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
					const firstExact = firstValue.exactValue;
					const secondExact = secondValue.exactValue;
					const firstInputNodeType = firstValue.inputNodeType;
					const secondInputNodeType = secondValue.inputNodeType;

					const newExact = firstExact * secondExact;

					const context = SEALContexts.context;
					const evaluator = SEALContexts.evaluator;
					const relinKey = SEALContexts.relinKey;
					const scale = SEALContexts.scale;

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

					// if (firstInputNodeType == 'single' && secondInputNodeType == 'single') {
					// 	nodeStatusText += handleFindError(
					// 		node,
					// 		config,
					// 		SEALContexts,
					// 		resultCipher,
					// 		newExact,
					// 		'single',
					// 	);
					// } else {
					// 	nodeStatusText += handleFindError(
					// 		node,
					// 		config,
					// 		SEALContexts,
					// 		resultCipher,
					// 		newExact,
					// 		'range',
					// 	);
					// }

					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});

					msg.exactResult = newExact;
					msg.latestNodeId = config.id;
					msg.payload = { cipherText: resultCipher };
					node.send(msg);

					// delete seal object instance prevent out of wasm memory
					firstValue.cipher.delete();
					secondValue.cipher.delete();
					firstCipher.delete();
					secondCipher.delete();
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
