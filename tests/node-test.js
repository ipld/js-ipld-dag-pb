var test = require('tape');
var Link = require('../node').Link;
var Node = require('../node').Node;

test('Link Creation and Assignment', function(t){
    buf= new Buffer("OMGWTFTHISISWRONG");
    link = new Link("Joss Whedon", 20, buf);
    t.is(link.Name(), "Joss Whedon");
    t.is(link.Size(), 20);
    t.is(link.Hash().equals(buf), true);
    t.end();
});
test('Node Creation and Assignment', function(t){
    var buf= new Buffer("Buffy the Vampire Slayer");
    var node= new Node();
    node.Data(buf);
    t.is(node.Data().length > 0, true);
    t.is(Buffer.isBuffer(node.Data()), true);
    t.is(node.Size() > 0, true);
    var premarshal = node.Data();
    var postunmarshal= node.UnMarshal(node.Encoded()).Data();
    t.is(premarshal.equals(postunmarshal), true);
    t.end();
});
/*
test('Node Linking', function(t){
    buf= new Buffer("Buffy the Vampire Slayer");
    node= new Node();
    node.Data(buf);
    t.is(node.Data().length > 0, true);
    t.is(Buffer.isBuffer(node.Data()), true);
    t.end();
});
    */