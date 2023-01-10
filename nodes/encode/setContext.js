module.exports = function (RED) {
    function setContextHandle(config) {
        RED.nodes.createNode(this, config);

        const globalContext = this.context().global;
        const seal = globalContext.get("seal");
        if (!seal) return;

        const node = this;

        const outputs = parseInt(config.outputs);

        node.on("input", function (msg) {
            node.status({});
            const contextNode = RED.nodes.getNode(config.context);
            const relinKeyNode = RED.nodes.getNode(config.relinKey);

            try {
                if (!contextNode) {
                    throw new Error(`SEAL Context Node not found`);
                } else if (!relinKeyNode) {
                    throw new Error(`RelinKey Node not found`);
                } else {
                    msg.context = { contextNodeId: contextNode.id };
                    msg.relinKey = { relinKeyNodeId: relinKeyNode.id };
                    msg.latestNodeId = config.id;
                    node.send(msg);
                }
            } catch (err) {
                node.error(err);
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: err.toString(),
                });
            }
        });
    }

    RED.nodes.registerType("setContext", setContextHandle);
};
