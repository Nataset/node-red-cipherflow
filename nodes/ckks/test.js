module.exports = function (RED) {
	function test(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const outputs = parseInt(config.outputs);
		const flowContext = this.context.flow();
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

				// complute new exact value in this node
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

				// show output ciphertext chainIndex to the node status
				node.status({
					fill: 'green',
					shape: 'ring',
					text: `ChainIndex: ${chainIndex}`,
				});

				msg.exactResult = newExactResult;
				msg.latestNodeId = config.id;
				msg.payload = { cipherText: cipherText };
				const msgArray = [msg];
				for (i = 1; i < outputs; i++) {
					const newMsg = { ...msg };
					newMsg.payload = { cipherText: cipherText.clone() };
					msgArray.push(newMsg);
				}
				node.send(msgArray);

				// delete unuse seal instance prevent out of wasm memory error
				inputCipher.delete();
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('test', test);

	RED.httpAdmin.get('/CKKSparms', RED.auth.needsPermission('test.read'), function (req, res) {
		jsonTestData = {
			context1: 'context1 data',
			context2: 'context2 data',
			context3: 'context3 data',
		};
		res.json(jsonTestData);
	});
};
