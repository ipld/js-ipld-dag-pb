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
    var linkSort= function(a,b){return a.Name().toString('hex').localeCompare( b.Name().toString('hex'));};
    this.AddNodeLink = function (name, node) {

    };
    this.Size = function () {

    };

    this.Encoded = function () {
        if (arguments.length == 0) {


            return Encoded;
        } else {
            if (arguments[0] instanceof Buffer) {
                Encoded = arguments[0];
            }
            return this;
        }
    };

    this.Cached = function () {
        if (arguments.length == 0) {
            return Cached;
        } else {
            if (arguments[0] instanceof Buffer) {
                Cached = arguments[0];
            }
            return this;

        }
    };
    //Encode into Protobuf
    this.Marshal = function(){
      var pbn = getPBNode();
      var data = merklepb.PBNode.encode(pbn);
      return data;
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
    var Encoded;
    var Cached;
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



