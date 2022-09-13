module.exports = function (RED) {
	const parseKey = require('../../util/parseKey');
	function secretKeyHandle(config) {
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
				this.secretKeyBase64 = globalContext.get(`sk_${originContextNode.id}`)
				if (!this.secretKeyBase64) {
					this.secretKeyBase64 = originContextNode.secretKey.save();
					globalContext.set(`sk_${originContextNode.id}`, this.secretKeyBase64)
				}
				this.secretKey = seal.SecretKey();
				this.secretKey.load(originContextNode.context, this.secretKeyBase64);
				this.parmsBase64 = originContextNode.parms.save();

			} else if (config.isUpload == false && originContextNode !== undefined) {
				this.keyId = originContextNode.keyId;
				this.secretKey = originContextNode.secretKey;
				this.secretKeyBase64 = originContextNode.secretKey.save();
				this.parmsBase64 = originContextNode.parms.save();
			} else if (config.isUpload == true) {
				try {
					const { keyId, parmsBase64, secretKeyBase64 } = parseKey.parseSecretKey(config.importData);
					const parms = seal.EncryptionParameters(seal.SchemeType.ckks);
					parms.load(parmsBase64);

					const context = seal.Context(
						parms, // Encryption Parameters
						true, // ExpandModChain
						seal.SecurityLevel.none, // Enforce a security level
					);
					this.keyId = keyId
					this.secretKey = seal.SecretKey();
					this.secretKey.load(context, secretKeyBase64);
					this.secretKeyBase64 = secretKeyBase64;
					this.parmsBase64 = parmsBase64

					parms.delete();
					context.delete();
					delete parms;
					delete context;
				} catch (err) {
					throw new Error('Import Secret Key Fail');
				}
			} else {
				//todo
				console.log('originContextNode is undefind');
			}

		} catch (err) {
			console.error(err)
		}

		nodeContext.set('config', config);
		nodeContext.set('secretKeyBase64', this.secretKeyBase64);
		nodeContext.set('parmsBase64', this.parmsBase64);
		nodeContext.set('keyId', this.keyId);

		RED.httpNode.get(`/secretKey/${config.id}`, (req, res) => {

			const config = nodeContext.get('config');
			const secretKeyBase64 = nodeContext.get('secretKeyBase64');
			const parmsBase64 = nodeContext.get('parmsBase64');
			const keyId = nodeContext.get('keyId');

			res.json({
				_name: config.name,
				_id: config.id,
				keyId: keyId,
				parmsBase64: parmsBase64,
				secretKeyBase64: secretKeyBase64,
			});
		});

		this.on('close', (done) => {
			this.secretKey.delete();
			delete this.secretKey
			done();
		})
	}
	RED.nodes.registerType('secretKey', secretKeyHandle);
};
