// IPFS integration for decentralized storage
const { create } = require('ipfs-http-client');
const ipfs = create({ url: 'https://ipfs.io' });

async function uploadToIPFS(content) {
  const { path } = await ipfs.add(content);
  return path;
}

async function getFromIPFS(hash) {
  const stream = ipfs.cat(hash);
  let data = '';
  for await (const chunk of stream) {
    data += chunk.toString();
  }
  return data;
}

module.exports = { uploadToIPFS, getFromIPFS };
