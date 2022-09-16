module.exports = async function (RED) {
	const SEAL = require('node-seal');
	const seal = await SEAL();

	function sealHandle(node) {
		RED.nodes.createNode(this, node);
		const globalContext = this.context().global;
		globalContext.set('seal', seal);
	}
	RED.nodes.registerType('seal', sealHandle);

	RED.httpNode.post(`/genKeys`, (req, res) => {

		function createContext(json) {
			const schemeType = seal.SchemeType.ckks;
			const securityLevel = seal.SecurityLevel.none;
			const parms = seal.EncryptionParameters(schemeType);

			if (!json.parmsBase64) {
				const polyModulus = json.polyModulus;
				const coeffModulus = json.coeffModulus

				parms.setPolyModulusDegree(polyModulus);
				parms.setCoeffModulus(seal.CoeffModulus.Create(polyModulus, Int32Array.from(coeffModulus)));

			} else {
				parms.load(json.parmsBase64);
			}
			const context = seal.Context(
				parms, // Encryption Parameters
				true, // ExpandModChain
				securityLevel, // Enforce a security level
			);

			parms.delete();
			return context
		}
		const context = createContext(req.body)

		const keyGenerator = seal.KeyGenerator(context);

		const secretKey = keyGenerator.secretKey();
		const publicKeySerial = keyGenerator.createPublicKeySerializable();
		const relinKeySerial = keyGenerator.createRelinKeysSerializable();

		const secretKeyBase64 = secretKey.save();
		const publicKeyBase64 = publicKeySerial.save();
		const relinKeyBase64 = relinKeySerial.save();

		res.json({
			publicKeyBase64,
			secretKeyBase64,
			relinKeyBase64,
		});

		context.delete();
		keyGenerator.delete();
		secretKey.delete();
		publicKeySerial.delete();
		relinKeySerial.delete();
		return
	});

};
