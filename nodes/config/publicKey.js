module.exports = function (RED) {
	function publicKeyHandle(config) {
		RED.nodes.createNode(this, config);
		const originContextNode = RED.nodes.getNode(config.originContextNode);

		if (config.isUpload == false && originContextNode !== undefined) {
			this.publicKeyBase64 = originContextNode.publicKey.save();
		} else if (config.isUpload == true) {
			this.publicKeyBase64 = config.publicKeyBase64;
		} else {
			//todo
			console.log('originContextNode is undefind');
		}

		RED.httpNode.get(`/publicKey/${config.id}`, (req, res) => {
			res.json({
				_name: config.name,
				_id: config.id,
				publicKeyBase64: this.publicKeyBase64,
			});
		});
	}
	RED.nodes.registerType('publicKey', publicKeyHandle);
};
