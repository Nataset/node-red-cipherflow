/*
    input value node, value will be encrypt to ciphertext using SEAL object in the config node 
    that passed from injectContext node, output is ciphertext in msg.payload
*/

module.exports = function (RED) {
	const { getChainIndex } = require('../../util/getDetail.js');

	function CKKSInput(config) {
		RED.nodes.createNode(this, config);
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
			const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

			try {
				if (!SEALContexts) {
					throw new Error(`SEALContexts not found`);
				} else {
					// get seal objects needed to encrypt the value from the config node
					const context = SEALContexts.context;
					const encoder = SEALContexts.encoder;
					const encryptor = SEALContexts.encryptor;
					const scale = SEALContexts.scale;
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

					// latestNodeId use for check if ciphertext value change, add(E) and multi(E) node using this object property
					msg.latestNodeId = config.id;
					// pass input node type for checking from node that connected to this node
					msg.exactResult = value;
					msg.payload = { cipherText: cipherText };

					// if not error show chainIndex of output ciphertext
					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ChainIndex: ${chainIndex}`,
					});
					node.send(msg);

					// delete unuse instance of seal objects prevent out of wasm memory error
					plainText.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'ring', text: err });
			}
		});
	}

	RED.nodes.registerType('input', CKKSInput);
};
