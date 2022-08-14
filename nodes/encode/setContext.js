module.exports = function (RED) {
	function setContextHandle(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const node = this;

		node.on('input', function (msg) {
			const contextNode = RED.nodes.getNode(config.context);
			const relinKeyNode = RED.nodes.getNode(config.relinKey);

			try {
				if (!contextNode) {
					throw new Error(`SEAL Context Node not found`);
				} else if (!relinKeyNode) {
					throw new Error(`RelinKey Node not found`);
				} else {
					msg.context = { contextNodeId: contextNode.id };
					msg.relinKey = { relinKeyNodeId: relinKeyNode.id };
					msg.latestNodeId = config.id;

					const relinKey = seal.RelinKeys();
					relinKey.load(contextNode.context, relinKey.relinKeyBase64);
					relinKeyNode.relinKey = relinKey;

					node.send(msg, false);
				}
			} catch (err) {
				node.error(err);
				node.status({ fill: 'red', shape: 'dot', text: err.toString() });
			}
		});
	}

	RED.nodes.registerType('setContext', setContextHandle);
};
