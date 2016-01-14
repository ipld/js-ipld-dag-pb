var BlockService= require('./blockservice');
var Node = require('./node');
var Block = require('./block');

var DAGService= function(bs){
    var blocks;
    this.blocks = function(){
        if(arguments.length == 0){
            return blocks;
        }else{
            if (arguments[0] instanceof BlockService){
                blocks= arguments[0];
            }
            return this;
        }
    };
    this.add= function(node){
        if(!node || !(node instanceof Node)){
            return null
        }
        if(!blocks){
            return null;
        }
        data = node.Encoded();
        if(!data){
            return null;
        }
        block= new Block(data);
        return blocks.addBlock(block);

    };

    this.addRecursive= function(node){
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
        for(var i= 0; i < links.length; i++){
            var link= links[i];
            if(link.Node()){
                return this.AddRecursive(link);
            }
        }
    };

    this.get= function(mh){
        if(!mh){
            return null;
        }
        if(!Blocks){
            return null;
        }
        block= n.blocks.Block(mh);
        if(!block){
            return null;
        }
        var node= new Node();
        node.UnMarshal(block.Data());
        return node;
    };

    this.Blocks(bs);


};