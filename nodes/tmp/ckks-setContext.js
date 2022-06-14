const SEAL = require('node-seal');

module.exports = async function (RED) {
    function ckksSetContext(config) {
        RED.nodes.createNode(this, config);
        const flowContext = this.context().flow;
        const node = this;

        node.on('input', async function (msg) {
            const seal = await SEAL();
            const { parmsBase64, pkBase64, rlkBase64, scale } = JSON.parse(msg.payload);
            Object.keys(msg.payload, key => {
                console.log(key);
            });
            const parms = seal.EncryptionParameters();
            parms.load(parmsBase64);

            const context = seal.Context(parms, true, seal.SecurityLevel.none);

            const public_key = seal.PublicKey();
            const relin_key = seal.RelinKeys();
            public_key.load(context, pkBase64);
            relin_key.load(context, rlkBase64);

            // const encryptor = seal.Encryptor(context, public_key);
            // const evaluator = seal.Evaluator(context);
            // const encoder = seal.Encoder(context);

            // flowContext.set('publicKey', public_key);
            // flowContext.set('relinKey', relin_key);
            // flowContext.set('context', context);
            // flowContext.set('encryptor', encryptor);
            // flowContext.set('evaluator', evaluator);
            // flowContext.set('encoder', encoder);
            // flowContext.set('scale', Math.pow(2, scale));

            // msg.payload = 'Context already setted up';
        });
    }

    RED.nodes.registerType('ckks-setContext', ckksSetContext);
};
