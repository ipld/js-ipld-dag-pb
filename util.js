var multihashing = require('multihashing');

var util= new Object();
// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
util.hash= function(data){
   return multihashing(data, 'sha2-256');

}

module.exports =util;