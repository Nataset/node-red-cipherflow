module.exports = function (RED) {
	function relinKeyHandle(config) {
		RED.nodes.createNode(this, config);
		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		const originContextNode = RED.nodes.getNode(config.originContextNode);

		if (config.isUpload == false && originContextNode !== undefined) {
			this.relinKey = originContextNode.relinKey;
		} else if (config.isUpload == true) {
			const relinKey = seal.RelinKeys();
			relinKey.load(config.relinKeyBase64);
			this.relinKey = relinKey;
		} else {
			//todo
			console.log('originContextNode is undefind');
		}

		RED.httpNode.get(`/relinKey/${config.id}`, (req, res) => {
			res.json({
				_name: config.name,
				_id: config.id,
				relinKeyBase64: this.relinKey.save(),
			});
		});
	}
	RED.nodes.registerType('relinKey', relinKeyHandle);
};
