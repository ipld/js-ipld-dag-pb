/*
 This is an attempt at an ipfs style merkle dag node
*/

var Buffer= require('buffer/').Buffer;
var util= require('./util');
var protobuf = require('protocol-buffers');
var merkledagproto = "message PBLink {optional bytes Hash = 1; optional string Name = 2;optional uint64 Tsize = 3;} message PBNode {repeated PBLink Links = 2; optional bytes Data = 1;}";
var merklepb=  protobuf(merkledagproto);
var Node=function() {
    var Links = [];
    var Data;
    var Cached;
    var Encoded;
    //sort links by their name field
    var linkSort= function(a,b){return a.Name().toString('hex').localeCompare( b.Name().toString('hex'));};

    this.Data= function(){
        if(arguments.length == 0){
            return Data;
        }else{
            if (arguments[0] instanceof Buffer){
                Data= arguments[0];
            }
            return this;
        }
    }

    //link to another node
    var MakeLink = function (node){
        var size = node.Size();
        var mh = node.MultiHash();
        if(!(size && mh)){
           return null;
        }
        return new Link(null,size,mh)
    };

    // AddNodeLink adds a link to another node.
    this.AddNodeLink = function (name, node) {
        if( typeof name != "string" || !(node instanceof Node)){
            return
        }
        var link= MakeLink(node);
        if(!link){
            return
        }
        link.Name(name);
        link.Node(node);
        this.AddRawLink(name, link);
    };

    // AddRawLink adds a copy of a link to this node
    this.AddRawLink= function(name, link){
        if( typeof name != "string" || !(link instanceof Link)){
            return
        }
        Encoded= null;
        Links.push(new Link(link.Name(), link.Size(), link.Hash(), link.Node()));
    };

    // AddNodeLinkClean adds a link to another node. without keeping a reference to
    // the child node
    this.AddNodeLinkClean= function(name, node){
        if( typeof name != "string" || !(link instanceof Link)){
            return
        }
        var link= MakeLink(node);
        if(!link){
            return
        }

        Encoded= null;
        link.Name(name);
        this.AddRawLink(name, link);
    };

    this.MultiHash=function(){
        this.Encoded();
        return Cached;
    };

    // Size returns the total size of the data addressed by node,
    // including the total sizes of references.
    this.Size = function () {
        var buf= this.Encoded();
        if(!buf){
            return 0;
        }
        size =buf.length;
        for(link in Links){
            size += link.Size();
        }
        return size;
    };

    // Encoded returns the encoded raw data version of a Node instance.
    // It may use a cached encoded version, unless the force flag is given.
    this.Encoded = function (force) {
        if (force || !Encoded) {
            Encoded = this.Marshal();

            if (Encoded) {
                Cached = util.hash(Encoded);
            }
        }
        return Encoded;
    };

    //Encode into a Protobuf
    this.Marshal = function(){
      var pbn = getPBNode();
      var data = merklepb.PBNode.encode(pbn);
      return data;
    };

    //Decode from a Protobuf
    this.UnMarshal = function(data){
        var pbn = merklepb.PBNode.encode(data);
        for(link in pbn.Links){
           var lnk = new Link(link.Name, link.Tsize, link.Hash);
           Links.push(lnk);
        }
        Links.sort(linkSort);
        Data = pbn.Data;

    };

    //Helper method to get a protobuf object equivalent
    var getPBNode = function(){
        var pbn = new Object();
        pbn.Links= [];
        if(Links.length > 0){
            Links.sort(linkSort);
            for(link in Links){
                pbn.Links.push({
                    Name: link.Name(),
                    Tsize: link.Size(),
                    Hash: link.Hash()
                });
            }
        }
        if(Data && Data.length > 0){
            pbn.Data =Data;
        }else{
            pbn.Data = new Buffer();
        }
       return pbn;
    };
}

// Link represents an IPFS Merkle DAG Link between Nodes.
var Link = function(name, size, hash, node){
    var Name;
    var Size;
    var Hash;
    var Node;
    this.Name= function(){
        if(arguments.length == 0){
            return Name;
        }else{
            if (typeof arguments[0] == 'string'){
                Name= arguments[0];
            }
            return this;
        }
    }
    this.Size= function(){
        if(arguments.length == 0){
            return Size;
        }else{
            if (typeof arguments[0] == 'number'){
                Size= arguments[0];
            }
            return this;
        }
    }
    this.Hash= function(){
        if(arguments.length == 0){
            return Hash;
        }else{
            if (arguments[0] instanceof Buffer){
                Hash= arguments[0];
            }
            return this;
        }
    }

    this.Node= function(){
        if(arguments.length == 0){
            return Node;
        }else{
            if (arguments[0] instanceof Node){
                Node= arguments[0];
            }
            return this;
        }
    }
    this.Name(unname);
    this.Size(size);
    this.Hash(hash);
    this.Node(node);
 }



