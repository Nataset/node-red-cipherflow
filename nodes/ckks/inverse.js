module.exports = function (RED) {
    const { getChainIndex } = require('../../util/getDetail.js');
    const { handleFindError } = require('../../util/vaildation.js');

    function inverse(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const max = config.max;

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = RED.nodes.getNode(msg.context.nodeId);

            try {
                if (!SEALContexts) {
                    throw new Error(`SEAL Contexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`CipherText not found`);
                }

                let nodeStatusText = '';
                let newExactResult;
                const inputNodeType = msg.inputNodeType;

                if (inputNodeType == 'single') {
                    newExactResult = parseFloat(msg.exactResult) ** -1;
                } else if (inputNodeType == 'range') {
                    // newExactResult = msg.exactResult.map(value => value ** n);
                }

                console.log(newExactResult, msg.exactResult);
                console.log;

                const cipherText = msg.payload.cipherText.clone();
                const evaluator = SEALContexts.evaluator;
                const context = SEALContexts.context;
                const encoder = SEALContexts.encoder;
                const relinKey = SEALContexts.relinKey;
                const scale = SEALContexts.scale;
                const seal = SEALContexts.seal;
                const d = 3;

                const plainNormailzerArray = encoder.encode(
                    Float64Array.from({ length: encoder.slotCount }, () => 2 / max),
                    scale,
                );

                evaluator.plainModSwitchTo(
                    plainNormailzerArray,
                    cipherText.parmsId,
                    plainNormailzerArray,
                );

                // Normailze f(x) = x * UpperScale / UpperOrigin [2 / max]
                const norEncryArray = evaluator.multiplyPlain(cipherText, plainNormailzerArray);
                evaluator.relinearize(norEncryArray, relinKey, norEncryArray);
                evaluator.rescaleToNext(norEncryArray, norEncryArray);
                norEncryArray.setScale(scale);

                // compule fine inv of norEncryArray
                // first create value
                const array2 = Float64Array.from({ length: encoder.slotCount }, () => 2);
                const array1 = Float64Array.from({ length: encoder.slotCount }, () => 1);
                const plain2 = encoder.encode(array2, scale);
                const plain1 = encoder.encode(array1, scale);

                // change chainIndex of two plaintext to the norEncryArray
                evaluator.plainModSwitchTo(plain2, norEncryArray.parmsId, plain2);
                evaluator.plainModSwitchTo(plain1, norEncryArray.parmsId, plain1);

                const NegateNorEncryArray = evaluator.negate(norEncryArray);

                let a0Cipher = evaluator.addPlain(NegateNorEncryArray, plain2);
                let b0cipher = evaluator.addPlain(NegateNorEncryArray, plain1);
                let bnCipher = seal.CipherText();
                let anCipher = seal.CipherText();
                evaluator.cipherModSwitchToNext(a0Cipher, a0Cipher);

                for (let i = 0; i < d; i++) {
                    evaluator.square(b0cipher, bnCipher);
                    evaluator.relinearize(bnCipher, relinKey, bnCipher);
                    evaluator.rescaleToNext(bnCipher, bnCipher);
                    bnCipher.setScale(scale);

                    evaluator.plainModSwitchToNext(plain1, plain1);
                    evaluator.addPlain(bnCipher, plain1, anCipher);
                    evaluator.multiply(anCipher, a0Cipher, anCipher);
                    evaluator.relinearize(anCipher, relinKey, anCipher);
                    evaluator.rescaleToNext(anCipher, anCipher);
                    anCipher.setScale(scale);

                    b0cipher = bnCipher;
                    a0Cipher = anCipher.clone();
                }

                const invNorEncryArray = anCipher;
                // end of find inv of norEncryArray

                // find Normailze(1) * invNorEncryArray
                // Normailze(1) = 1 * UpperScale/UpperOrigin [2 / max]
                const oneNorEncrypt = encoder.encode(
                    Float64Array.from({ length: encoder.slotCount }, () => 2 / max),
                    scale,
                );
                evaluator.plainModSwitchTo(oneNorEncrypt, invNorEncryArray.parmsId, oneNorEncrypt);

                const resultEncryArray = evaluator.multiplyPlain(invNorEncryArray, oneNorEncrypt);
                evaluator.relinearize(resultEncryArray, relinKey, resultEncryArray);
                evaluator.rescaleToNext(resultEncryArray, resultEncryArray);

                const chainIndex = getChainIndex(resultEncryArray, context);
                nodeStatusText += `ChainIndex: ${chainIndex}`;

                nodeStatusText += handleFindError(
                    node,
                    config,
                    SEALContexts,
                    resultEncryArray,
                    newExactResult,
                    inputNodeType,
                );

                node.status({
                    fill: 'green',
                    shape: 'ring',
                    text: nodeStatusText,
                });

                msg.exactResult = newExactResult;
                msg.latestNodeId = config.id;
                msg.payload = { cipherText: resultEncryArray };
                node.send(msg);
            } catch (err) {
                node.error(err);
                node.status({ fill: 'red', shape: 'dot', text: err.toString() });
            }
        });
    }

    RED.nodes.registerType('inverse', inverse);
};
