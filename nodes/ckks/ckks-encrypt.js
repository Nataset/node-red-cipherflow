const loadSeal = require('../../util/load_seal');

module.exports = async function (RED) {
    function ckksEncrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.CKKSContext = RED.nodes.getNode(config.context);

        if (this.CKKSContext) {
            node.on('input', async function (msg) {
                const array = msg.payload;
                const encoder = node.CKKSContext.encoder;
                const encryptor = node.CKKSContext.encryptor;
                const scale = node.CKKSContext.scale;
                const plainText = encoder.encode(array, scale);
                const cipherText = encryptor.encrypt(plainText);

                msg.payload = cipherText;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-encrypt', ckksEncrypt);
};
