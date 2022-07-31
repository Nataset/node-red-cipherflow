module.exports = async function (RED) {
	function CKKSPublicKey(node) {
		RED.nodes.createNode(this, node);

		if (node.isUpload == false) {
			const originContextNode = RED.nodes.getNode(node.originContextNode);
			this.publicKey = originContextNode.publicKey.save();
			this.relinKey = originContextNode.relinKey.save();
		} else if (node.isUpload == true) {
			this.publicKey = node.publicKey;
			this.relinKey = node.relinKey;
		}
	}
	RED.nodes.registerType('ckks-publicKey', CKKSPublicKey);
};
