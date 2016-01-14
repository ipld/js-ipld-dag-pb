var multihashing = require('multihashing');

var util= new Object();
// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
util.hash= function(data){
   return multihashing(data, 'sha2-256');

}
util.isBrowser=function(){
    try {
        return !!window;
    }
    catch(e){
        return false;
    }
};

util.isAbstractBlobStore= function(obj){
    if(!obj){
        return false;
    }
    var interface =["createWriteStream" , "createReadStream", "exists", "remove"];
    for(var i= 0; i < interface.length; i++){
        var method=interface[i];
        if(!(obj[method]) || (typeof obj[method] != 'function')){
            return false;
        }
    }
    return true;
}
module.exports =util;