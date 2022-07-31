module.exports = function (RED) {
	function contextHandle(config) {
		RED.nodes.createNode(this, config);
		const globalContext = this.context().global;
		const seal = globalContext.get('seal');

		const schemeType = seal.SchemeType.ckks;
		const securityLevel = seal.SecurityLevel.none;
		const parms = seal.EncryptionParameters(schemeType);
		let relinKey = seal.RelinKeys();
		let context = undefined;

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
			const [parmsBase64, relinKeyBase64] = config.importData.split(
				'----------relinKey----------',
			);

			parms.load(parmsBase64);
			context = seal.Context(parms, false, securityLevel);
			relinKey.load(context, relinKeyBase64);
		} else {
			//todo
			console.log(`did't upload importData`);
			return;
		}
		const encoder = seal.CKKSEncoder(context);
		const evaluator = seal.Evaluator(context);

		const keyGenerator = seal.KeyGenerator(context);
		const secretKey = keyGenerator.secretKey();
		const publicKey = keyGenerator.createPublicKey();
		if (!config.isUpload) relinKey = keyGenerator.createRelinKeys();

		this.context = context;
		this.parms = parms;
		this.keyGenerator = keyGenerator;
		this.secretKey = secretKey;
		this.publicKey = publicKey;
		this.relinKey = relinKey;
		this.scale = Math.pow(2, config.scale);
		this.encoder = encoder;
		this.evaluator = evaluator;

		RED.httpNode.get(`/parms/${config.id}`, function (req, res) {
			res.json({
				_name: config.name,
				_id: config.id,
				parmsBase64: parms.save(),
				relinKeyBase64: relinKey.save(),
			});
		});

		this.on('close', done => {
			context.delete();
			parms.delete();
			keyGenerator.delete();
			this.secretKey.delete();
			this.publicKey.delete();
			this.relinKey.delete();

			delete this;
			done();
		});
	}
	RED.nodes.registerType('context', contextHandle);
};
