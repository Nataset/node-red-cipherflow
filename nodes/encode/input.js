/*
	input value node, value will be encrypt to ciphertext using SEAL object in the config node 
	that passed from injectContext node, output is ciphertext in msg.payload
*/

module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function CKKSInput(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;
		// get value from this node html page
		const value = parseFloat(config.value);
		// show value in the node status below the node if didn't value will show error in status
		if (!value) {
			const err = new Error('variable Value field is empty');
			node.error(err);
			node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			return;
		} else {
			node.status({ fill: 'blue', shape: 'ring', text: `Value: ${value}` });
		}

		node.on('input', function (msg) {
			// get seal object from config node by useing config node id that passed from injectContext node
			const contextNode = RED.nodes.getNode(config.context);
			const publicKeyNode = RED.nodes.getNode(config.publicKey);
			const relinKeyNode = RED.nodes.getNode(config.relinKey);

			try {
				if (!contextNode) {
					throw new Error(`SEALContexts not found`);
				} else {
					// get seal objects needed to encrypt the value from the config node
					const context = contextNode.context;
					const publicKey = publicKeyNode.publicKey;

					const encoder = contextNode.encoder;
					const encryptor = seal.Encryptor(context, publicKey);
					const scale = contextNode.scale;
					// create array that all index equal value for html and encoder.slotCount(polyModulus / 2) long;
					const array = Float64Array.from({ length: encoder.slotCount }, () => value);

					const plainText = encoder.encode(array, scale);
					const cipherText = encryptor.encrypt(plainText);

					/* 
						get chainIndex for show in node status, 
						chainIndex depend on coeffModulus in the parms in config node
						only ciphertext and ciphertext multiply operation use one chainIndex
						other operation will not use chainIndex
						(exponent, and inverse  node also use chainIndex, because it use multiply operation in the node)
					*/
					const chainIndex = getChainIndex(cipherText, context);

					msg.context = { contextNodeId: contextNode.id };
					msg.relinKey = { relinKeyNodeId: relinKeyNode.id }

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
					encryptor.delete();
					plainText.delete();
				}
			} catch (err) {
				// if (err = 'ciphertext data is invalid') {
				// 	node.status({ fill: 'red', shape: 'ring', text: `Public Key didn't match Context` });
				// } else {
				node.error(err);
				node.status({ fill: 'red', shape: 'ring', text: err });
				// }
			}
		});
	}

	RED.nodes.registerType('input', CKKSInput);

	RED.httpAdmin.post('/inject/:id', RED.auth.needsPermission('start.write'), function (req, res) {
		const node = RED.nodes.getNode(req.params.id);
		if (node != null) {
			try {
				node.receive();
				res.sendStatus(200);
			} catch (err) {
				res.sendStatus(500);
				node.error(RED._('inject.failed', { error: err.toString() }));
			}
		} else {
			res.sendStatus(404);
		}
	});
};
