module.exports = function (RED) {
    function injectContext(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = this.context().flow;
        node.SEALContexts = RED.nodes.getNode(config.context);

        if (node.SEALContexts) {
            node.status({ fill: 'green', shape: 'dot', text: `using ${node.SEALContexts.name}` });
        } else {
            node.status({ fill: 'red', shape: 'dot', text: 'Context not found' });
        }

        node.on('input', function (msg) {
            try {
                if (node.SEALContexts) {
                    console.log('TEST');
                    const contextName = node.SEALContexts.name.trim().replace(' ', '-');

                    flowContext.set(contextName, node.SEALContexts);
                    msg.contextName = contextName;

                    node.send(msg);
                } else {
                    throw new Error(`SEALContexts not found, Please select Context`);
                }
            } catch (err) {
                node.error(err);
            }
        });
    }

    RED.nodes.registerType('ckks-injectContext', injectContext);

    RED.httpAdmin.post(
        '/inject/:id',
        RED.auth.needsPermission('inject.write'),
        function (req, res) {
            const node = RED.nodes.getNode(req.params.id);
            if (node != null) {
                try {
                    node.receive();
                    res.sendStatus(200);
                } catch (err) {
                    res.sendStatus(500);
                    node.error(RED._('inject.failed', { error: err.toString() }));
                }
            } else {
                res.sendStatus(404);
            }
        },
    );
};
