
var util= require('./util');
if (util.isBrowser()){
    window.Buffer = require('buffer/').Buffer;
}

//Immutable block of data
var Block = function (data){
    if(!data){
        return null;
    }
    var data= new Buffer(data);
    var multihash= util.hash(data);

    this.Key= function(){
        return multihash
    }

    this.Data = function(){
        return data
    }
    return this;
}
module.exports= Block;