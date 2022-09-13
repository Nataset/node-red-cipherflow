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
		let context;

		try {
			if (!config.isUpload) {
				try {
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

					this.scale = Math.pow(2, config.scale);

				} catch (err) {
					throw err;
				}


			} else if (config.isUpload && config.importData !== '') {
				try {
					const splitData = config.importData.split('\n-----BEGIN SCALE EXPONENT-----\n')
					const parmsBase64 = splitData[0];
					parms.load(parmsBase64);
					context = seal.Context(parms, true, securityLevel);

					this.scale = Math.pow(2, splitData[1]);
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
			//time
			// console.time('secretKey');
			const secretKey = keyGenerator.secretKey();
			// console.timeEnd('secretKey');
			// const skSize = secretKey.save().length / 1e6;
			// console.log("sk size:", skSize)

			// console.time('publicKey');
			const publicKeySerial = keyGenerator.createPublicKeySerializable();
			// console.timeEnd('publicKey');
			// const pkSize = publicKeySerial.save().length / 1e6;
			// console.log("pk size:", pkSize)

			// console.time('relinKey');
			const relinKeySerial = keyGenerator.createRelinKeysSerializable();
			// console.timeEnd('relinKey');
			// const rkSize = relinKeySerial.save().length / 1e6;
			// console.log("rk size:", rkSize)

			const publicKeyBase64 = publicKeySerial.save();
			const relinKeyBase64 = relinKeySerial.save();


			this.context = context;
			this.parms = parms;
			this.keyGenerator = keyGenerator;
			this.secretKey = secretKey;
			this.publicKeyBase64 = publicKeyBase64;
			this.relinKeyBase64 = relinKeyBase64;
			this.encoder = encoder;
			this.evaluator = evaluator;
			this.keyId = keyId;


			nodeContext.set('config', config);
			nodeContext.set('parms', parms);
			nodeContext.set('keyId', keyId);
			nodeContext.set('scaleExponent', config.scale)

		} catch (err) {
			console.error(err);
		}


		RED.httpNode.get(`/parms/${config.id}`, (req, res) => {
			const config = nodeContext.get('config');
			const parms = nodeContext.get('parms');
			const keyId = nodeContext.get('keyId');
			const scaleExponent = nodeContext.get('scaleExponent');

			res.json({
				_name: config.name,
				_id: config.id,
				keyId: keyId,
				parmsBase64: parms.save(),
				scaleExponent: scaleExponent
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
