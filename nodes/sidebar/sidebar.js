module.exports = function (RED) {
	function sidebar(config) {
		RED.nodes.createNode(this, config);
		console.log('this shit should append');
	}

	RED.nodes.registerType('ckks-sidebar', sidebar);
};
