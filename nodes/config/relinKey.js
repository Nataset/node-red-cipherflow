module.exports = function (RED) {
	function relinKeyHandle(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const nodeContext = this.context();
		const originContextNode = RED.nodes.getNode(config.originContextNode);

		if (config.isUpload == false && originContextNode !== undefined) {
			this.relinKeyBase64 = originContextNode.relinKeyBase64;
		} else if (config.isUpload == true) {
			this.relinKeyBase64 = config.relinKeyBase64;
		} else {
			//todo
			console.log('originContextNode is undefind');
		}

		nodeContext.set('config', config);
		nodeContext.set('relinKeyBase64', this.relinKeyBase64);

		RED.httpNode.get(`/relinKey/${config.id}`, (req, res) => {

			const config = nodeContext.get('config');
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
