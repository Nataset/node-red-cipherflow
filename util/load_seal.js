const SEAL = require('node-seal');

module.export = async node => {
    const globalContext = node.context().global;
    if (globalContext.get('seal') == undefined) {
        const seal = await SEAL();
        globalContext.set('seal', seal);
        return seal;
    } else {
        return globalContext.get('seal');
    }
};
