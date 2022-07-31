/*
    ciphertext compare exactvalue to find diff and error percent
    ---use 0 cipherIndex---
    input: ciphertext in msg.payload
    output: object contain ciphertext compare detail in msg.payload
*/

module.exports = function (RED) {
	function debug(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		const showToDebug = config.showToDebug;

		function getAvgFirstTen(array) {
			if (array.length > 10) array = array.slice(0, 10);

			const sum = array.reduce((prevValue, curValue) => prevValue + curValue, 0);
			const avgValueArray = sum / 10;

			return avgValueArray;
		}

		function getDebugDetail(cipherResult, exactResult) {
			const avgResult = getAvgFirstTen(cipherResult);
			const error = Math.abs(exactResult - avgResult);
			const errorPercent = Math.abs((error / exactResult) * 100);

			return {
				cipherResult: avgResult,
				exactResult: exactResult,
				error: error,
				errorPercent: errorPercent,
			};
		}

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

					// declare varibale for compare ciphertext to exact value
					const encoder = SEALContexts.encoder;
					const decryptor = SEALContexts.decryptor;
					const plainText = decryptor.decrypt(cipherText);
					const resultArray = encoder.decode(plainText);
					const exact = msg.exactResult;

					// send array result from decrypted ciphertext, and exact value to getDebugDetail
					const debugDetail = getDebugDetail(resultArray, exact);

					// if (showToDebug) {
					node.warn(debugDetail);
					// }

					node.status({
						fill: 'green',
						shape: 'ring',
						text: `ErrorPercent: ${debugDetail.errorPercent}`,
					});

					node.send(msg);

					// delete unuse seal instance prevent out of wasm memory error
					// inputCipher.delete();
					cipherText.delete();
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('seal-debug', debug);
};
