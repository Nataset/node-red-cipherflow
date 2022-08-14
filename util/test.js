const parmsBase64 = `XqEQBAACAABTAAAAAAAAACi1L/AEv4xM4aT0WTnRNjynW5Awy+ABE=`
const publicKey = `kHdNx51IlHhTRNE9aP1dcRYeoPVY7gKWhghnQ1jhRScVqYLvDMAClCdm1LZF0ZHG0IBvH6AbyAg1EVjOJKb40udqKpml6owiFjADpodSdmUwQtqocBMGZEFyTRm0kYbNvzdvACiZqAVkZBh1bXSFIU+bWJ/qgS44ecL6qTGEcsdK5OCnE9dJ3xxtUBUVSIn+B5ICMkNE9DCQyiQXOBmoIUAahXloyp1+YN+IwMPLQTfSquxZ66bq2uWHkMEgmxmiRLXpbnIxQZRVlHMDShFNkJh1YmD0q2MTVggnJDy84CriIFLCDACMokmJK6AKHAoct1cU5Bl7GEkiiDorJpZhmWtLtC2OjxsWfliyWCCLjFAzMKpUQlR54QXV1s0KpJgSZaNNKbc2lYORhhpXsBQpMtC6ktYKLLpcxTCxMyRqJZT1NB1wV8RSNkTVGZbM8LWBzhw4OqokuGli0clZcByT+sqpepn+G0OIBkuljqyUgSpYvh4RYtagWYZZnJhxjOsEvVEqNVEsLSpEtrj6ljSmS3DkhfLueCcHb4OSB3LXQpgMCAuTJcG1zMrs055Hue4NRimvvC+G2jRUxL/7smOPdk8flxgUXB9W4rqwmCSh6rG/eQvkkh1itEpww0L14YuVKpQe5B0CQTFkND5YY8qriWJKJA0UEIBAizUBpSHTzBt8p5kzqgYdLQjdJVaUStkUf2DrZxbILg5OkGtR8EKLCYKyKIo+TLz5e9raYqJWLTLhNpjIcCcrcAspFqvjoSeTfWwavHDjeL1eSZdshmVQ1IOk5UjsdcPXpKPLCykXDQZQtNETYukrRSQmmMKdM/BaxqHNMc/1QBwe2I0kMLJUMR3KSVDReBTzaeD6gEcAKZs5UaNoVj61an6bnD+qGa6EjWSrZTNmyEj42mYLnwAysohEqMmj83ThKbAEEqimQ0w55FtpYDvmhBYIH6w2BDICmBRhQNVIxYK02EEBmZBHrZU1enwvWACFSsTOwnXFNqnCDXEmJEpwkMv3SCqYebV/dPxLwQOIqarI+ZqdDpkTwsEbKcS1ARw+aqqeWHkpAWxvTREibFq26ftEGIh7prJAURWWc1CTII0cxbQgOLyjgRbJRL4BAxDTEg512jxkHO1SiHaqDYJThMnhIjXRuL8UNM1+qeNlYMFKnig1ObdVPhWVcY/U7IUoyBxIyWLg57HyAwaInk9fNl8+oZpRHlw9InR6oHDDTHXGPEgyaV`
const keyId = `SD34d`

const parseKey = require('./parseKey');

const test = parseKey.exportPublicKey(keyId, parmsBase64, publicKey);
const result = parseKey.parsePublicKey(test);
console.log(result)
