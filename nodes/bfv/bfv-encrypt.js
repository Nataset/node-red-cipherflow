const loadSeal = require('../../util/load_seal');

module.exports = async function (RED) {
    function bfvEncrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;

        node.on('input', async function (msg) {
            const seal = await loadSeal(this);

            const schemeType = seal.SchemeType.bfv;
            const securityLevel = seal.SecurityLevel.none;
            const polyModulusDegree = 4096;
            const bitSizes = [36, 36, 37];
            const bitSize = 20;

            const parms = seal.EncryptionParameters(schemeType);

            // Set the PolyModulusDegree
            parms.setPolyModulusDegree(polyModulusDegree);

            // Create a suitable set of CoeffModulus primes
            parms.setCoeffModulus(
                seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes)),
            );

            // Set the PlainModulus to a prime of bitSize 20.
            parms.setPlainModulus(seal.PlainModulus.Batching(polyModulusDegree, bitSize));

            const context = seal.Context(
                parms, // Encryption Parameters
                false, // ExpandModChain
                securityLevel, // Enforce a security level
            );

            const keyGenerator = seal.KeyGenerator(context);
            const secretKey = keyGenerator.secretKey();
            const publicKey = keyGenerator.createPublicKey();
            const encoder = seal.BatchEncoder(context);
            const encryptor = seal.Encryptor(context, publicKey);
            const decryptor = seal.Decryptor(context, secretKey);
            const evaluator = seal.Evaluator(context);

            flowContext.set('encoder', encoder);
            flowContext.set('encryptor', encryptor);
            flowContext.set('decryptor', decryptor);
            flowContext.set('evaluator', evaluator);

            const array = msg.payload.array;

            const plainText = encoder.encode(Int32Array.from(array));
            const cipherText = encryptor.encrypt(plainText);

            msg.payload = cipherText;
            node.send(msg);
        });
    }

    RED.nodes.registerType('BFV-Encrypt', bfvEncrypt, {
        credentials: {
            username: { type: 'text' },
            password: { type: 'password' },
        },
    });
};
