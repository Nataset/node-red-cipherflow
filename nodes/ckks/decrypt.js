module.exports = function (RED) {
	const debuglength = RED.settings.debugMaxLength || 1000;

	function ckksDecrypt(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const debug = config.debug;
		// const flowContext = node.context().flow;

		node.on('input', function (msg) {
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);
			try {
				if (!SEALContexts) {
					throw new Error('SEALContexts not found');
				} else if (!SEALContexts.decryptor) {
					throw new Error('decryptor not found');
				} else if (!msg.payload.cipherText) {
					throw new Error('cipherText not found');
				} else {
					const inputCipher = msg.payload.cipherText;
					const cipherText = inputCipher.clone();

					const encoder = SEALContexts.encoder;
					const decryptor = SEALContexts.decryptor;
					const plainText = decryptor.decrypt(cipherText);
					const result = encoder.decode(plainText);

					msg.payload = result;
					if (debug) {
						node.warn(result.slice(0, 10));
					}
					node.send(msg);

					// delete unuse seal instance prevent out of wasm memory error
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('decrypt', ckksDecrypt);
};
