
if (util.isBrowser()){
    window.Buffer = require('buffer/').Buffer;
}
var Datastore= require('abstract-blob-store');
var blockPrefix= "blocks";
var Blockstore = function(datastore){


};