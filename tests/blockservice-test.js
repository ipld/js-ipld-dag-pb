var BlockService= require('../blockservice');
var test = require('tape');
var Block = require('../block');
var bufeq = require('buffer-equal');
var fs= require('fs-blob-store');
var util= require('../util')
test('Test blockservice', function(t){
    var datastore= fs("blocks");
    t.is(util.isAbstractBlobStore(datastore), true, 'datastore is an abstact-blob-store');
    var blockService= new BlockService(datastore);
    var block1= new Block("You can't change me,  Baby I was born this way!");
    var block2= new Block("Another useless test block");
    var block3= new Block("A different useless test block");
    var block4= new Block("An enterprising test block with dreams");
    var blocks= [block2,block3, block4];
    var keys=[block2.key().toString('hex'),block3.key().toString('hex'), block4.key().toString('hex')];

    var addOneCb= function(err){
        t.is(!err,true,"Add a block wihout error")
        blockService.getBlock(block1.key().toString('hex'), getOneCb);
    };
    var getOneCb= function(err,obj){
        t.is(!err,true,"Get a block without error");
        t.is(obj instanceof Block, true,"Is it really a block?");
        t.is(obj.key().equals(block1.key()), true, "Is it really the same block?");
        blockService.addBlocks(blocks,addManyCb);
    };
    var addManyCb= function(err){
        t.is(!err,true,"Added many blocks without error");
        blockService.getBlocks(keys,getManyCb);
    };
    var getManyCb= function(err,obj){
        t.is(!err,true,"Got many blocks without error");
        t.is(Array.isArray(obj), true,"Is it really an array?");
        t.is(keys.length == obj.length, true,"Is it the amount we expect?");
        for(var i=0; i < keys.length; i++){
            var key= keys[i]
            found= obj.find(function(block){
                return key=== block.key().toString('hex');
            });
            t.is(!!found, true, "Found correct key in the response");
        }
        blockService.deleteBlock(block1.key().toString('hex'), deleteOneCb);
    };
    var deleteOneCb= function(err,exist){
        t.is(!!err, false, "Failed to delete block?");
        datastore.exists(block1.key().toString('hex'),function(err, obj){
            t.is(!!err, true, "Failed to check if block exists");
            console.log(exist);
            t.is(exist, false, "Block was deleted");
            blockService.deleteBlocks(keys, deleteManyCb);
        });
    }
    var deleteManyCb= function(err,obj){
        t.is(!!err, false, "Failed to delete blocks?");
    }

    blockService.addBlock(block1, addOneCb);
    t.end();
});