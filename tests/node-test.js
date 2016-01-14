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

test('Node Linking', function(t){
    var buf1= new Buffer("Buffy the Vampire Slayer");
    var buf2= new Buffer("Serenity");
    node1= new Node();
    node2= new Node();
    node1.Data(buf1);
    node2.Data(buf2);
    var sizen1= node1.Size();
    var mh1= node1.MultiHash();
    node1.AddNodeLink("next",node2);
    t.is(node1.Links().length > 0, true);
    t.is(node1.Size() > sizen1, true);
    t.is(node1.MultiHash().equals(mh1), false);

    node1.RemoveNodeLink("names");
    t.is(node1.MultiHash().equals(mh1), true);
    t.end();
});