const selfsigned = require('selfsigned');
const fs = require('fs');

(async () => {
    const attrs = [{ name: 'commonName', value: 'localhost' }];

    const pems = await selfsigned.generate(attrs, {
        algorithm: 'sha256',
        days: 365,
        keySize: 2048
    });

    fs.writeFileSync('key.pem', pems.private);
    fs.writeFileSync('cert.pem', pems.cert);

    console.log("Certificates generated!");
})();