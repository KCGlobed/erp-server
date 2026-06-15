const { Storage } = require('@google-cloud/storage');
const storage = new Storage({projectId: 'gcc-website-484409', keyFilename: 'erp.json'});
const bucket = storage.bucket('erp-bucket-gcc');
bucket.iam.getPolicy().then(([policy]) => {
  policy.bindings.push({
    role: 'roles/storage.objectViewer',
    members: ['allUsers'],
  });
  return bucket.iam.setPolicy(policy);
}).then(() => console.log('Bucket made public')).catch(e => console.error(e));
