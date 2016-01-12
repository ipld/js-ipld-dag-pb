/*
 This is an attempt at an ipfs style merkle dag node
*/

var Buffer= require('buffer/').Buffer;
var util= require('./util');
var Node=function() {
    var Links;
    var Data;
    var Cached;
    var Encoded;
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

    this.Marshal = function(){

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



