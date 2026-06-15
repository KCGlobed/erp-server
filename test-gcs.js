const { Storage } = require('@google-cloud/storage');
const storage = new Storage({projectId: 'gcc-website-484409', keyFilename: 'erp.json'});
const bucket = storage.bucket('erp-bucket-gcc');
const file = bucket.file('profiles/cmpzfsk8x000i7nuvgs4x2dlw-photo-1781508612048.png');
file.makePublic().then(() => console.log('Made public')).catch(e => console.error(e));
