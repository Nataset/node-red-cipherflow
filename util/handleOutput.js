module.exports = function (node, config, msg, cipherText) {
    // if (config.outputs == 1) {
    //     msg.latestNodeId = config.id;
    //     msg.payload.cipherText = cipherText;
    //     node.send(newMsg);
    // } else {
    // const arrayMsg = Array.from({ length: config.outputs }, (_, i) => {
    //     const newMsg = {};
    //     const cloneCipherText = cipherText.clone();
    //     cipherText.test = 'WTF MY friend';
    //     newMsg.context = msg.context;
    //     newMsg.latestNodeId = config.id;
    //     newMsg.payload = { cipherText: cloneCipherText };
    //     return newMsg;

    msg.payload = { cipherText: cipherText.clone() };
    cipherText.test = 'fuck you man';

    const cipherTextClone = cipherText.clone();

    const secondMsg = {};
    secondMsg.context = msg.context;
    secondMsg.payload = { cipherText: cipherTextClone };
    // });

    node.send([msg, secondMsg]);
};
