module.exports = function (msg, outputs, cipherText) {
    msg.payload = cipherText.save();
    const msgArray = [msg];
    for (i = 0; i < outputs; i++) {
        const newMsg = { ...msg };
        msgArray.push(newMsg);
    }

    return msgArray;
};
