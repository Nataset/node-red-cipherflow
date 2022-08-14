module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function encryptHandle(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;

		node.on('input', function (msg) {
			const contextNode = RED.nodes.getNode(config.context);
			const publicKeyNode = RED.nodes.getNode(config.publicKey);

			const value = parseFloat(msg.payload);
			try {
				if (!contextNode) {
					throw new Error(`SEAL Context Node not found`);
				} else if (!publicKeyNode) {
					throw new Error(`PublicKey Node not found`);
				} else {
					//get seal objects needed to encrypt the value from the config node
					const context = contextNode.context;
					const scale = contextNode.scale;
					const publicKeyBase64 = publicKeyNode.publicKeyBase64;

					const publicKey = seal.PublicKey();
					publicKey.load(context, publicKeyBase64);

					const encoder = contextNode.encoder;
					const encryptor = seal.Encryptor(context, publicKey);

					// create array that all index equal value for html and encoder.slotCount(polyModulus / 2) long;
					const array = Float64Array.from({ length: encoder.slotCount }, () => value);
					const plainText = encoder.encode(array, scale);
					const cipherText = encryptor.encrypt(plainText);

					const chainIndex = getChainIndex(cipherText, context);

					// latestNodeId use for check if ciphertext value change, add(E) and multi(E) node using this object property
					msg.latestNodeId = config.id;
					// pass input node type for checking from node that connected to this node
					msg.payload = { cipherText: cipherText };
					// if not error show chainIndex of output ciphertext
					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});
					node.send(msg, false);
					// delete unuse instance of seal objects prevent out of wasm memory error
					publicKey.delete();
					plainText.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'ring', text: err });
			}
		});
	}

	RED.nodes.registerType('encrypt', encryptHandle);
};
