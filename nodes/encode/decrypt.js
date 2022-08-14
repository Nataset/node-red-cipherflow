module.exports = function (RED) {
	function decryptHandle(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;

		node.on('input', function (msg) {
			const contextNode = RED.nodes.getNode(config.context);
			const secretKeyNode = RED.nodes.getNode(config.secretKey);

			try {
				if (!contextNode) {
					throw new Error(`SEAL Context Node not found`);
				} else if (!secretKeyNode) {
					throw new Error(`SecretKey Node not found`);
				} else {
					const inputCipher = msg.payload.cipherText;
					const cipherText = inputCipher.clone();

					// get seal objects needed to encrypt the value from the config node
					const context = contextNode.context;
					const secretKey = secretKeyNode.secretKey;

					const encoder = contextNode.encoder;
					const decryptor = seal.Decryptor(context, secretKey);
					const plainText = decryptor.decrypt(cipherText);
					const result = encoder.decode(plainText);

					msg.payload = result;
					if (config.showToDebug) {
						// show first 10 value in array to node-red debug page
						node.warn(result.slice(0, 10));
					}
					node.send(msg);

					// delete unuse seal instance prevent out of wasm memory error
					inputCipher.delete();
					decryptor.delete();
					plainText.delete();
					cipherText.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('decrypt', decryptHandle);
};
