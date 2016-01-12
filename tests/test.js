var test = require('tape');
var Block = require('../block');
var Buffer= require('buffer/').Buffer;
var bufeq = require('buffer-equal');

test('Test block mutabiltiy', function(t){
    block1= new Block("You can't change me,  Baby I was born this way!"); //proof you can program  and be completely retarded
    key = block1.Key();
    data= block1.Data();
    key= new Buffer('Definately not the same key');
    data = new Buffer('Definately not the same data');
    t.is(bufeq(key, block1.Key()), false);
    t.is(bufeq(data, block1.Data()), false);
    t.end();
});