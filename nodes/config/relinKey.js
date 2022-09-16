module.exports = function (RED) {
	function relinKeyHandle(config) {
		RED.nodes.createNode(this, config);

		const nodeContext = this.context();

		try {
			const relinKeyBase64 = config.importData;
			this.relinKeyBase64 = relinKeyBase64;

		} catch (err) {
			console.error(err);
		}

		nodeContext.set('relinKeyBase64', this.relinKeyBase64);
		RED.httpNode.get(`/relinKey/${config.id}`, (req, res) => {
			const relinKeyBase64 = nodeContext.get('relinKeyBase64');
			res.json({
				_name: config.name,
				_id: config.id,
				relinKeyBase64: relinKeyBase64,
			});
		});
	}
	RED.nodes.registerType('relinKey', relinKeyHandle);
};
