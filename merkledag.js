var Blockstore= require('abstract-blob-store');
var Node = require('./node');

var DAGService= function(bs){
    var Blocks;
    this.Blocks = function(){
        if(arguments.length == 0){
            return Blocks;
        }else{
            if (arguments[0] instanceof Blocks){
                Blocks= arguments[0];
            }
            return this;
        }
    };
    this.Add= function(node){
        if(!node || !(node instanceof Node)){
            return null
        }
    };

    this.Blocks(bs);


};