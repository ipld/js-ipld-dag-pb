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
    this.add= function(node, cb){
        if(!node || !(node instanceof Node)){
            return cb("Node is invalid");
        }
        if(!blocks){
            return cb("Blockservice is invalid");
        }
        data = node.Encoded();
        if(!data){
            return "Node is unencoded";
        }
        block= new Block(data);
        return blocks.addBlock(block, cb);

    };

    this.addRecursive= function(node, cb){

        this.add(node,function(err){
            if(err){
                return cb(err)
            }
            var links = node.Links();
            var i= 0;
            var link;
            var self=this;
            var next= function(err){
                if (err){
                    return cb(err);
                }
                i++;
                if(i < links.length){
                    link=links[i];
                    if(link.Node()){
                        return self.addRecursive(link.Node(),next);
                    }

                }else{
                    return cb();
                }
            };
            if(i < links.length){
                link=links[i];
                if(link.Node()){
                    return self.addRecursive(link.Node(),next);
                }

            }else{
                return cb();
            }

        });
    };

    this.get= function(key, cb){
        if(!key){
            return cb("Invalid Key");
        }
        if(!Blocks){
            return cb("Blockservice is invalid");
        }
        blocks.getBlock(key,function(err, block){
            if(err){
                return cb(err);
            }
            var node= new Node();
            node.data(block.data());
            return cb(null,node);
        })
    };

    // this diverges from go-ipfs this is a non recursive remove function
    this.remove= function(node, cb){
        if(!node || !(node instanceof Node)){
            return cb("Node is invalid");
        }
        if(!blocks){
            return cb("Blockservice is invalid");
        }
        data = node.Encoded();
        if(!data){
            return "Node is unencoded";
        }
        block= new Block(data);
        return blocks.remove(block, cb);
    };
    //this also diverges from go-ipfs but distinctly identifies the recursive version
    this.removeRecursive= function(node, cb){
        var links = node.Links();
        var i= 0;
        var link;
        var self=this;
        var next= function(err){
            if (err){
                return cb(err);
            }
            i++;
            if(i < links.length){
                link=links[i];
                if(link.Node()){
                    return self.removeRecursive(link.Node(),next);
                }

            }else{
                return self.remove(node, cb);
            }
        };
        if(i < links.length){
            link=links[i];
            if(link.Node()){
                return self.removeRecursive(link.Node(),next);
            }

        }else{
            return self.remove(node, cb);
        }
    };

    this.Blocks(bs);


};