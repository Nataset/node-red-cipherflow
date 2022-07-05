module.exports = function (RED) {
    const { getChainIndex } = require('../../util/getDetail.js');

    function parseData(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const data = [];
            msg.payload.forEach((cipherResult, i) => {
                const exactResult = msg.exactResult[i];
                const error = Math.abs(cipherResult - exactResult);
                const errorPercent = (error / exactResult) * 100;
                data.push({ x: i, y: errorPercent });
            });

            msg.payload = [
                {
                    series: ['error percent'],
                    data: [data],
                    labels: [],
                },
            ];
            msg.topic = 'Data set 1';
            node.send(msg);
        });
    }

    RED.nodes.registerType('parseData', parseData);
};
