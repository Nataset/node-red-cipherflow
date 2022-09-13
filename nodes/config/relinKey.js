module.exports = function (RED) {
	const parseKey = require('./../../util/parseKey');
	function relinKeyHandle(config) {
		RED.nodes.createNode(this, config);

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const nodeContext = this.context();
		const originContextNode = RED.nodes.getNode(config.originContextNode);
		const contextSmallName = 'Small [default]';
		const contextMediumName = 'Medium [default]';
		const contextLargeName = 'Large [default]';

		try {
			if (config.name == contextSmallName || config.name == contextMediumName || config.name === contextLargeName) {
				this.keyId = originContextNode.keyId;
				this.relinKeyBase64 = globalContext.get(`rk_${originContextNode.id}`)

				if (!this.relinKeyBase64) {
					this.relinKeyBase64 = originContextNode.relinKeyBase64;
					globalContext.set(`rk_${originContextNode.id}`, this.relinKeyBase64)
				}
				this.relinKey = seal.RelinKeys();
				this.relinKey.load(originContextNode.context, this.relinKeyBase64);
				this.parmsBase64 = originContextNode.parms.save();

			}
			else if (config.isUpload == false && originContextNode !== undefined) {
				this.keyId = originContextNode.keyId;
				this.relinKey = seal.RelinKeys();
				this.relinKey.load(originContextNode.context, originContextNode.relinKeyBase64);
				this.relinKeyBase64 = originContextNode.relinKeyBase64;
				this.parmsBase64 = originContextNode.parms.save();
			} else if (config.isUpload == true) {
				try {
					const { keyId, parmsBase64, relinKeyBase64 } = parseKey.parseRelinKey(config.importData);
					const parms = seal.EncryptionParameters(seal.SchemeType.ckks);
					parms.load(parmsBase64);

					const context = seal.Context(
						parms, // Encryption Parameters
						true, // ExpandModChain
						seal.SecurityLevel.none, // Enforce a security level
					);


					this.keyId = keyId
					this.relinKey = seal.RelinKeys();
					this.relinKey.load(context, relinKeyBase64);
					this.relinKeyBase64 = relinKeyBase64;
					this.parmsBase64 = parmsBase64

					parms.delete();
					context.delete();
					delete parms;
					delete context;
				} catch (err) {
					throw new Error('Import Relinear Key Fail')
				}
			} else {
				//todo
				console.log('originContextNode is undefind');
			}
		} catch (err) {
			console.error(err);
		}

		nodeContext.set('config', config);
		nodeContext.set('relinKeyBase64', this.relinKeyBase64);
		nodeContext.set('parmsBase64', this.parmsBase64);
		nodeContext.set('keyId', this.keyId);

		RED.httpNode.get(`/relinKey/${config.id}`, (req, res) => {

			const config = nodeContext.get('config');
			const parmsBase64 = nodeContext.get('parmsBase64');
			const relinKeyBase64 = nodeContext.get('relinKeyBase64');
			const keyId = nodeContext.get('keyId');

			res.json({
				_name: config.name,
				_id: config.id,
				keyId: keyId,
				parmsBase64: parmsBase64,
				relinKeyBase64: relinKeyBase64,
			});
		});
	}
	RED.nodes.registerType('relinKey', relinKeyHandle);
};
