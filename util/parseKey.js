module.exports = {
    lineLength: 64,
    beginParms: '|------------------------BEGIN PARMS---------------------------|',
    beginKeyId: '|------------------------BEGIN KEYID---------------------------|',
    beginPbKey: '|------------------------BEGIN PBKEY---------------------------|',
    beginScKey: '|------------------------BEGIN SCKEY---------------------------|',
    beginRlKey: '|------------------------BEGIN RLKEY---------------------------|',

    stringLengthLimter: function (string, lineLength) {
        let exportText = ''
        j = 0
        for (let i = 0; i < string.length; i++) {
            if (j < lineLength) {
                exportText += string[i]
            } else if (j == lineLength) {
                exportText += '\n'
                i--
                j = -1
            }
            j++
        }
        return exportText[exportText.length - 1] !== '\n' ? exportText + '\n' : exportText
    },

    exportPublicKey: function (keyId, parmsBase64, publicKeyBase64) {
        console.log(this.lineLength)
        let exportText = ''
        exportText += this.beginKeyId + '\n';
        exportText += keyId + '\n'
        exportText += this.beginParms + '\n';
        exportText += this.stringLengthLimter(parmsBase64, this.lineLength);
        exportText += this.beginPbKey + '\n';
        exportText += this.stringLengthLimter(publicKeyBase64, this.lineLength);
        return exportText[exportText.length - 1] === '\n' ? exportText.slice(0, -1) : exportText
    },

    parsePublicKey: function (importPublicKey) {

        const keyId = importPublicKey.split('\n', 2)[1]
        const parmsBase64 = importPublicKey.split(this.beginParms, 2)[1].split(this.beginPbKey)[0].replace(/\r?\n|\r/g, '');
        const publicKeyBase64 = importPublicKey.split(this.beginPbKey)[1].replace(/\r?\n|\r/g, '');

        return { keyId, parmsBase64, publicKeyBase64 };
    },

    exportSecretKey: function (keyId, parmsBase64, secretKeyBase64) {
        console.log(this.lineLength)
        let exportText = ''
        exportText += this.beginKeyId + '\n';
        exportText += keyId + '\n'
        exportText += this.beginParms + '\n';
        exportText += this.stringLengthLimter(parmsBase64, this.lineLength);
        exportText += this.beginScKey + '\n';
        exportText += this.stringLengthLimter(secretKeyBase64, this.lineLength);
        return exportText[exportText.length - 1] === '\n' ? exportText.slice(0, -1) : exportText
    },

    parseSecretKey: function (importSecretKey) {

        const keyId = importSecretKey.split('\n', 2)[1]
        const parmsBase64 = importSecretKey.split(this.beginParms, 2)[1].split(this.beginScKey)[0].replace(/\r?\n|\r/g, '');
        const secretKeyBase64 = importSecretKey.split(this.beginScKey)[1].replace(/\r?\n|\r/g, '');

        return { keyId, parmsBase64, secretKeyBase64 };
    },

    exportRelinKey: function (keyId, parmsBase64, relinKeyBase64) {
        console.log(this.lineLength)
        let exportText = ''
        exportText += this.beginKeyId + '\n';
        exportText += keyId + '\n'
        exportText += this.beginParms + '\n';
        exportText += this.stringLengthLimter(parmsBase64, this.lineLength);
        exportText += this.beginRlKey + '\n';
        exportText += this.stringLengthLimter(relinKeyBase64, this.lineLength);
        return exportText[exportText.length - 1] === '\n' ? exportText.slice(0, -1) : exportText
    },

    parseRelinKey: function (importRelinKey) {

        const keyId = importRelinKey.split('\n', 2)[1]
        const parmsBase64 = importRelinKey.split(this.beginParms)[1].split(this.beginRlKey)[0].replace(/\r?\n|\r/g, '');
        const relinKeyBase64 = importRelinKey.split(this.beginRlKey)[1].replace(/\r?\n|\r/g, '');

        return { keyId, parmsBase64, relinKeyBase64 };
    },
}

