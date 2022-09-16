module.exports = function (RED) {
	function publicKeyHandle(config) {
		RED.nodes.createNode(this, config);
		const nodeContext = this.context();

		try {
			const publicKeyBase64 = config.importData;
			this.publicKeyBase64 = publicKeyBase64

		} catch (err) {
			console.error(err);
		}

		nodeContext.set('publicKeyBase64', this.publicKeyBase64);

		RED.httpNode.get(`/publicKey/${config.id}`, (req, res) => {
			const publicKeyBase64 = nodeContext.get('publicKeyBase64');
			res.json({
				_name: config.name,
				_id: config.id,
				publicKeyBase64: publicKeyBase64,
			});
		});
	}
	RED.nodes.registerType('publicKey', publicKeyHandle);
};
