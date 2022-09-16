module.exports = function (RED) {
	function secretKeyHandle(config) {
		RED.nodes.createNode(this, config);

		const nodeContext = this.context();

		try {
			const secretKeyBase64 = config.importData;
			this.secretKeyBase64 = secretKeyBase64;

		} catch (err) {
			console.error(err)
		}
		nodeContext.set('secretKeyBase64', this.secretKeyBase64);

		RED.httpNode.get(`/secretKey/${config.id}`, (req, res) => {
			const secretKeyBase64 = nodeContext.get('secretKeyBase64');
			res.json({
				_name: config.name,
				_id: config.id,
				secretKeyBase64: secretKeyBase64,
			});
		});
	}

	RED.nodes.registerType('secretKey', secretKeyHandle);
};
