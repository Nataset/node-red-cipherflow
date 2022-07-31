module.exports = function (RED) {
	function secretKeyHandle(config) {
		RED.nodes.createNode(this, config);
		const originContextNode = RED.nodes.getNode(config.originContextNode);

		if (config.isUpload == false && originContextNode !== undefined) {
			this.secretKeyBase64 = originContextNode.secretKey.save();
		} else if (config.isUpload == true) {
			this.secretKeyBase64 = config.secretKeyBase64;
		} else {
			//todo
			console.log('originContextNode is undefind');
		}

		RED.httpNode.get(`/secretKey/${config.id}`, (req, res) => {
			res.json({
				_name: config.name,
				_id: config.id,
				secretKeyBase64: this.secretKeyBase64,
			});
		});
	}
	RED.nodes.registerType('secretKey', secretKeyHandle);
};
