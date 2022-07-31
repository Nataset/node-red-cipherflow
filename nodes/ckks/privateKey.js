module.exports = async function (RED) {
	function CKKSPrivateKey(node) {
		RED.nodes.createNode(this, node);
	}
	RED.nodes.registerType('ckks-privateKey', CKKSPrivateKey);
};
