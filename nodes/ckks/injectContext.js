/* 
    start node for the flow of homomorphic SEAL encryption by cick the button on 
    the left of this node it will post(inject) to the it self and input event will run,
*/
module.exports = function (RED) {
	function injectContext(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		// get seal objects by used config node id that user select in the html page of this node
		node.SEALContexts = RED.nodes.getNode(config.context);

		// show status when what SEALContexts that user is select if not will show error in node status
		if (node.SEALContexts) {
			node.status({
				fill: 'green',
				shape: 'dot',
				text: `using ${node.SEALContexts.name}`,
			});
		} else {
			node.status({
				fill: 'red',
				shape: 'dot',
				text: 'Context not found',
			});
		}

		node.on('input', function (msg) {
			try {
				if (node.SEALContexts) {
					// send the id of SEAL context config node to another node that connect to this node
					const contextName = node.SEALContexts.name.trim().replace(' ', '-');
					msg.context = { name: contextName, nodeId: config.context };

					node.send(msg);
				} else {
					throw new Error(`SEALContexts not found, Please select Context`);
				}
			} catch (err) {
				node.error(err);
			}
		});
	}

	RED.nodes.registerType('start', injectContext);

	// post function for the inject node-red feature
	RED.httpAdmin.post(
		'/inject/:id',
		RED.auth.needsPermission('inject.write'),
		function (req, res) {
			const node = RED.nodes.getNode(req.params.id);
			if (node != null) {
				try {
					node.receive();
					res.sendStatus(200);
				} catch (err) {
					res.sendStatus(500);
					node.error(RED._('inject.failed', { error: err.toString() }));
				}
			} else {
				res.sendStatus(404);
			}
		},
	);
};
