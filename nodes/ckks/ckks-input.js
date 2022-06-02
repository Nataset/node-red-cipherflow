module.exports = function (RED) {
    function CKKSInput(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        const value = config.value;
        const topic = config.name;

        this.CKKSContext = RED.nodes.getNode(config.context);
        if (this.CKKSContext) {
            node.on('input', function (msg) {
                let array = Float64Array.from(
                    { length: node.CKKSContext.encoder.slotCount },
                    () => value,
                );
                msg.topic = topic;
                msg.payload = array;
                node.send(msg);
            });
        } else if (flowContext.get('context')) {
            node.on('input', function (msg) {
                let array = Float64Array.from(
                    { length: flowContext.get('encoder').slotCount },
                    () => value,
                );
                msg.topic = topic;
                msg.payload = array;
                node.send(msg);
            });
        } else {
            console.log('SOMETHING BROKE');
        }
    }

    RED.nodes.registerType('ckks-input', CKKSInput);
};
