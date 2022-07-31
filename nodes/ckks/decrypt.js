/*
    decrypt input ciphertext with  sealContext from config node
    ---use 0 cipherIndex---
    input: ciphertext in msg.payload
    output: array in msg.payload
*/
module.exports = function (RED) {
	function ckksDecrypt(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		// debug checkbox in html page if true will show first 10 value of array to the node-red debug page
		const debug = config.debug;

		node.on('input', function (msg) {
			// get seal objects from config node
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
						// show first 10 value in array to node-red debug page
						node.warn(result.slice(0, 10));
					}
					node.send(msg);

					// delete unuse seal instance prevent out of wasm memory error
					plainText.delete();
					inputCipher.delete();
					cipherText.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('decrypt', ckksDecrypt);
};
