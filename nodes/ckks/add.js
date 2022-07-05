module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');
	// const { handleFindError } = require('../../util/vaildation.js');

	function add(config) {
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

				// if msg is a first msg run code below
				if (firstNodeId == null || msg.latestNodeId == firstNodeId) {
					// clone msg ciphertext
					const firstCipher = msg.payload.cipherText.clone();
					// set firstNodeId to check order of the msg;
					firstNodeId = msg.latestNodeId;
					nodeContext.set('firstNodeId', firstNodeId);
					// push object contain needed value to the firstQueue
					firstQueue.push({
						cipher: firstCipher,
						exactValue: msg.exactResult,
					});
					// set node status to waiting
					node.status({
						fill: 'yellow',
						shape: 'ring',
						text: 'wait for another ciphertext',
					});
				} // if msg is a second msg run code below, or msg is coming for the secondNodeId
				else if (secondNodeId == null || msg.latestNodeId == secondNodeId) {
					// clone msg ciphertext
					const secondCipher = msg.payload.cipherText.clone();
					// set secondNodeId to check order of the msg
					secondNodeId = msg.latestNodeId;
					nodeContext.set('secondNodeId', secondNodeId);
					// push object contain needed value to the secondQueue
					secondQueue.push({
						cipher: secondCipher,
						exactValue: msg.exactResult,
					});
					// set node status to waiting
					node.status({
						fill: 'yellow',
						shape: 'ring',
						text: 'wait for another ciphertext',
					});
				} else {
					throw new Error('input more than 2 ciphertext');
				}

				if (firstQueue.length > 0 && secondQueue.length > 0) {
					// shift object out from queue
					const firstValue = firstQueue.shift();
					const secondValue = secondQueue.shift();

					// clone first and second ciphertext prevent racecondition
					const firstCipher = firstValue.cipher.clone();
					const secondCipher = secondValue.cipher.clone();
					const firstExact = parseFloat(firstValue.exactValue);
					const secondExact = parseFloat(secondValue.exactValue);

					// compule new exact value for this node
					const newExact = firstExact + secondExact;

					// declare variable for add two ciphertext
					const context = SEALContexts.context;
					const evaluator = SEALContexts.evaluator;

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

					const resultCipher = evaluator.add(firstCipher, secondCipher);
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

					//delete seal object instance
					firstValue.cipher.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({
					fill: 'red',
					shape: 'dot',
					text: err.toString(),
				});
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

	RED.nodes.registerType('add(E)', add);
};
