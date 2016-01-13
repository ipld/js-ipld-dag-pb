/*
 This is an attempt at an ipfs style merkle dag node
*/

var util= require('./util');
var protobuf = require('protocol-buffers');
var merkledagproto = "message PBLink {optional bytes Hash = 1; optional string Name = 2;optional uint64 Tsize = 3;} message PBNode {repeated PBLink Links = 2; optional bytes Data = 1;}";
var merklepb=  protobuf(merkledagproto);
if (util.isBrowser()){
    window.Buffer = require('buffer/').Buffer;
}
var Node=function() {
    var Links = [];
    var Data;
    var Cached;
    var Encoded;
    //sort links by their name field
    var linkSort= function(a,b){return a.Name().toString('hex').localeCompare( b.Name().toString('hex'));};

    // Getter/Setter chain for Data
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

    // Getter/Setter chain for Links
    this.Links= function(){
        if(arguments.length == 0){
            return Links;
        }else{
            if (Array.isArray(arguments[0])){
                for(var i; i < arguments[0].length; i++){
                    if (!(arguments[0][i] instanceof Link)){
                       return this;
                    }
                }
                Links = arguments[0];
            }

            return this;
        }
    }
    // UpdateNodeLink return a copy of the node with the link name set to point to
    // that. If a link of the same name existed, it is removed.
    this.UpdateNodeLink= function(name, node){
        var newnode= this.Copy();
        newnode.RemoveNodeLink(name);
        newnode.AddNodeLink(name,node);
        return newnode;
    };

    // Copy returns a copy of the node.
    // NOTE: does not make copies of Node objects in the links.
    this.Copy= function(){
        if(Data && Data.length > 0){
            buf= new Buffer(Data.length);
            Data.copy(buf)
            node= new Node();
            node.Data(buf);
            node.Links(Links.slice());
            return node;
        }
        return null;
    }
    // Remove a link on this node by the given name
    this.RemoveNodeLink= function(name){
        Encoded = null;
        var good = [];
        var found;
        for(var i=0; i < Links.length; i++){
            var link= Links[i];
            if (link.Name() != name) {
                good.push(link);
            } else{
                found= true;
            }
        }
        Links= good;
    };

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
        var pbn = merklepb.PBNode.decode(data);
        for(link in pbn.Links){
           var lnk = new Link(link.Name(), link.Tsize(), link.Hash());
           Links.push(lnk);
        }
        Links.sort(linkSort);
        Data = pbn.Data;
        return this;
    };

    //Helper method to get a protobuf object equivalent
    var getPBNode = function(){
        var pbn = {};
        pbn.Links= [];
        if(Links.length > 0){
            Links.sort(linkSort);
            for(link in Links){
                pbn.Links.push({
                    Hash: link.Hash(),
                    Name: link.Name(),
                    Tsize: link.Size()
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
var Ntype= Node;
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
            if (arguments[0] instanceof Ntype){
                Node= arguments[0];
            }
            return this;
        }
    }
    this.Name(name);
    this.Size(size);
    this.Hash(hash);
    this.Node(node);
}
module.exports.Link = Link;
module.exports.Node= Node;

