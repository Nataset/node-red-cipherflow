module.exports = async function (RED) {
	const SEAL = require('node-seal');
	let seal = await SEAL();
	RED.seal = seal;

	function sealHandle(node) {
		RED.nodes.createNode(this, node);
		const globalContext = this.context().global;
		globalContext.set('seal', seal);
		this.seal = seal;
	}
	RED.nodes.registerType('seal', sealHandle);
};
