module.exports = function (RED) {
	function secretKeyHandle(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const nodeContext = this.context();
		const originContextNode = RED.nodes.getNode(config.originContextNode);


		if (config.isUpload == false && originContextNode !== undefined) {
			this.secretKeyBase64 = originContextNode.secretKey.save();
		} else if (config.isUpload == true) {
			this.secretKeyBase64 = config.secretKeyBase64;
		} else {
			//todo
			console.log('originContextNode is undefind');
		}

		nodeContext.set('config', config);
		nodeContext.set('secretKeyBase64', this.secretKeyBase64);

		RED.httpNode.get(`/secretKey/${config.id}`, (req, res) => {

			const config = nodeContext.get('config');
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
