module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function rangeInput(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const start = parseFloat(config.start);
		const end = parseFloat(config.end);
		// const flowContext = node.context().flow;

		// if (!value) {
		//     const err = new Error('variable Value field is empty');
		//     node.error(err);
		//     node.status({ fill: 'red', shape: 'dot', text: err.toString() });
		//     return;
		// }

		node.status({ fill: 'grey', shape: 'ring' });

		node.on('input', function (msg) {
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

			try {
				if (!SEALContexts) {
					throw new Error(`SEALContexts not found`);
				} else {
					const context = SEALContexts.context;
					const encoder = SEALContexts.encoder;
					const encryptor = SEALContexts.encryptor;
					const scale = SEALContexts.scale;

					const step = (end - start) / (encoder.slotCount - 1);

					const array = Float64Array.from(
						{ length: encoder.slotCount },
						(_, i) => start + step * i,
					);

					const plainText = encoder.encode(array, scale);
					const cipherText = encryptor.encrypt(plainText);

					const chainIndex = getChainIndex(cipherText, context);

					msg.inputNodeId = config.id;
					msg.latestNodeId = config.id;
					msg.inputNodeType = 'range';
					msg.exactResult = array;
					msg.payload = { cipherText: cipherText };

					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});

					node.send(msg);
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'ring', text: err });
			}
		});
	}

	RED.nodes.registerType('rangeInput', rangeInput);
};
