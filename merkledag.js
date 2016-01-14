var BlockService= require('./blockservice');
var Node = require('./node');
var Block = require('./block');

var DAGService= function(bs){
    var Blocks;
    this.Blocks = function(){
        if(arguments.length == 0){
            return Blocks;
        }else{
            if (arguments[0] instanceof BlockService){
                Blocks= arguments[0];
            }
            return this;
        }
    };
    this.Add= function(node){
        if(!node || !(node instanceof Node)){
            return null
        }
        if(!Blocks){
            return null;
        }
        data = node.Encoded();
        if(!data){
            return null;
        }
        block= new Block(data);
        return Blocks.AddBlock(block);

    };

    this.AddRecursive= function(node){
        if(!node || !(node instanceof Node)){
            return null
        }
        if(!Blocks){
            return null;
        }
        data = node.Encoded();
        if(!data){
            return null;
        }
        var links = node.Links();
        for(var i= 0; i < node.Links().length; i++){
            var link= links[i];
            if(link.Node()){
                return this.AddRecursive(link);
            }
        }
    };

    this.Get= function(mh){
        if(!mh){
            return null;
        }
        if(!Blocks){
            return null;
        }
        block= n.Blocks.Block(mh);
        if(!block){
            return null;
        }
        var node= new Node();
        node.UnMarshal(block.Data());
        return node;
    };

    this.Blocks(bs);


};