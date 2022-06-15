module.exports = function (RED) {
    function injectContext(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        // const flowContext = this.context().flow;
        node.SEALContexts = RED.nodes.getNode(config.context);

        if (node.SEALContexts) {
            node.status({ fill: 'green', shape: 'dot', text: `using ${node.SEALContexts.name}` });
        } else {
            node.status({ fill: 'red', shape: 'dot', text: 'Context not found' });
        }

        node.on('input', function (msg) {
            try {
                if (node.SEALContexts) {
                    const contextName = node.SEALContexts.name.trim().replace(' ', '-');

                    // const SEALContextsClone = {
                    //     name: node.name,
                    //     poluModulus: node.SEALContexts.polyModulus,
                    //     coeffModulus: node.SEALContexts.coeffModulus,
                    //     scale: node.SEALContexts.scale,
                    //     secretKey: node.SEALContexts.secretKey,
                    //     publicKey: node.SEALContexts.publicKey,
                    //     relinKey: node.SEALContexts.relinKey,
                    //     galoisKey: node.SEALContexts.galoisKey,
                    //     encoder: node.SEALContexts.encoder,
                    //     encryptor: node.SEALContexts.encryptor,
                    //     decryptor: node.SEALContexts.decryptor,
                    //     evaluator: node.SEALContexts.evaluator,
                    //     context: node.SEALContexts.context,
                    // };

                    // flowContext.set(contextName, SEALContextsClone);

                    msg.context = { name: contextName, node_id: config.context };

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
