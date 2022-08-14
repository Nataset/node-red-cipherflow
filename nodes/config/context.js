module.exports = async function (RED) {
	const random = require('randomstring');
	function contextHandle(config) {
		RED.nodes.createNode(this, config);
		const keyId = random.generate(4);
		const nodeContext = this.context();

		const globalContext = this.context().global;
		const seal = globalContext.get('seal');
		if (!seal) return

		const schemeType = seal.SchemeType.ckks;
		const securityLevel = seal.SecurityLevel.none;
		let parms = seal.EncryptionParameters(schemeType);

		try {
			if (!config.isUpload) {
				const polyModulusDegree = config.polyModulus;
				const bitSizes = JSON.parse(config.coeffModulus).value;
				parms.setPolyModulusDegree(polyModulusDegree);
				parms.setCoeffModulus(
					seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes)),
				);

				context = seal.Context(
					parms, // Encryption Parameters
					true, // ExpandModChain
					securityLevel, // Enforce a security level
				);
			} else if (config.isUpload && config.importData !== '') {
				try {

					parmsBase64 = config.importData;
					parms.load(parmsBase64);
					context = seal.Context(parms, true, securityLevel);
				} catch (err) {
					throw new Error('Import Context Fail');
				}
			} else {
				//todo
				console.log(`did't upload importData`);
				return;
			}

			const encoder = seal.CKKSEncoder(context);
			const evaluator = seal.Evaluator(context);
			const keyGenerator = seal.KeyGenerator(context);
			const secretKey = keyGenerator.secretKey();
			const publicKeySerial = keyGenerator.createPublicKeySerializable();
			const relinKeySerial = keyGenerator.createRelinKeysSerializable();
			const publicKeyBase64 = publicKeySerial.save();
			const relinKeyBase64 = relinKeySerial.save();


			this.context = context;
			this.parms = parms;
			this.keyGenerator = keyGenerator;
			this.secretKey = secretKey;
			this.publicKeyBase64 = publicKeyBase64;
			this.relinKeyBase64 = relinKeyBase64;
			this.scale = Math.pow(2, config.scale);
			this.encoder = encoder;
			this.evaluator = evaluator;
			this.keyId = keyId;


			nodeContext.set('config', config);
			nodeContext.set('parms', parms);
			nodeContext.set('keyId', keyId);

		} catch (err) {
			console.error(err);
		}


		RED.httpNode.get(`/parms/${config.id}`, (req, res) => {
			const config = nodeContext.get('config');
			const parms = nodeContext.get('parms');
			const keyId = nodeContext.get('keyId');

			res.json({
				_name: config.name,
				_id: config.id,
				keyId: keyId,
				parmsBase64: parms.save(),
			});
		});

		this.on('close', done => {
			this.context.delete();
			this.parms.delete();
			this.keyGenerator.delete();
			this.secretKey.delete();
			this.publicKeySerial.delete();
			this.relinKeySerial.delete();
			this.publicKeyBase64.delete();
			this.relinKeyBase64.delete();

			done();
		});


	}
	RED.nodes.registerType('context', contextHandle);
};
