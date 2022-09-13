module.exports = function (RED) {
	const parseKey = require('./../../util/parseKey');
	function publicKeyHandle(config) {
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
				this.publicKeyBase64 = globalContext.get(`pk_${originContextNode.id}`)

				if (!this.publicKeyBase64) {
					this.publicKeyBase64 = originContextNode.publicKeyBase64;
					globalContext.set(`pk_${originContextNode.id}`, this.publicKeyBase64)
				}
				this.publicKey = seal.PublicKey();
				this.publicKey.load(originContextNode.context, this.publicKeyBase64);
				this.parmsBase64 = originContextNode.parms.save();

			}
			else if (config.isUpload == false && originContextNode !== undefined) {
				this.keyId = originContextNode.keyId;
				this.publicKey = seal.PublicKey();
				this.publicKey.load(originContextNode.context, originContextNode.publicKeyBase64);
				this.publicKeyBase64 = originContextNode.publicKeyBase64;
				this.parmsBase64 = originContextNode.parms.save();
			} else if (config.isUpload == true) {
				try {
					const { keyId, parmsBase64, publicKeyBase64 } = parseKey.parsePublicKey(config.importData);
					const parms = seal.EncryptionParameters(seal.SchemeType.ckks);
					parms.load(parmsBase64);

					const context = seal.Context(
						parms, // Encryption Parameters
						true, // ExpandModChain
						seal.SecurityLevel.none, // Enforce a security level
					);
					this.keyId = keyId
					this.publicKey = seal.PublicKey();
					this.publicKey.load(context, publicKeyBase64);
					this.publicKeyBase64 = publicKeyBase64;
					this.parmsBase64 = parmsBase64

					parms.delete();
					context.delete();
					delete parms;
					delete context;
				} catch (err) {
					throw new Error('Import Public Key Fail')
				}
			} else {
				//todo
				console.log('originContextNode is undefind');
			}

		} catch (err) {
			console.error(err);
		}

		nodeContext.set('config', config);
		nodeContext.set('publicKeyBase64', this.publicKeyBase64);
		nodeContext.set('parmsBase64', this.parmsBase64);
		nodeContext.set('keyId', this.keyId);

		RED.httpNode.get(`/publicKey/${config.id}`, (req, res) => {
			const config = nodeContext.get('config');
			const parmsBase64 = nodeContext.get('parmsBase64');
			const publicKeyBase64 = nodeContext.get('publicKeyBase64');
			const keyId = nodeContext.get('keyId');

			res.json({
				_name: config.name,
				_id: config.id,
				keyId: keyId,
				parmsBase64: parmsBase64,
				publicKeyBase64: publicKeyBase64,
			});
		});

		this.on('close', (done) => {
			this.publicKey.delete();
			delete this.publicKey
			done();
		})
	}
	RED.nodes.registerType('publicKey', publicKeyHandle);
};
