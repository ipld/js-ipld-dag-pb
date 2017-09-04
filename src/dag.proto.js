/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.PBLink = (function() {

    /**
     * Properties of a PBLink.
     * @exports IPBLink
     * @interface IPBLink
     * @property {Uint8Array} [Hash] PBLink Hash
     * @property {string} [Name] PBLink Name
     * @property {number|Long} [Tsize] PBLink Tsize
     */

    /**
     * Constructs a new PBLink.
     * @exports PBLink
     * @classdesc Represents a PBLink.
     * @constructor
     * @param {IPBLink=} [properties] Properties to set
     */
    function PBLink(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PBLink Hash.
     * @member {Uint8Array}Hash
     * @memberof PBLink
     * @instance
     */
    PBLink.prototype.Hash = $util.newBuffer([]);

    /**
     * PBLink Name.
     * @member {string}Name
     * @memberof PBLink
     * @instance
     */
    PBLink.prototype.Name = "";

    /**
     * PBLink Tsize.
     * @member {number|Long}Tsize
     * @memberof PBLink
     * @instance
     */
    PBLink.prototype.Tsize = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Creates a new PBLink instance using the specified properties.
     * @function create
     * @memberof PBLink
     * @static
     * @param {IPBLink=} [properties] Properties to set
     * @returns {PBLink} PBLink instance
     */
    PBLink.create = function create(properties) {
        return new PBLink(properties);
    };

    /**
     * Encodes the specified PBLink message. Does not implicitly {@link PBLink.verify|verify} messages.
     * @function encode
     * @memberof PBLink
     * @static
     * @param {IPBLink} message PBLink message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PBLink.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.Hash != null && message.hasOwnProperty("Hash"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.Hash);
        if (message.Name != null && message.hasOwnProperty("Name"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.Name);
        if (message.Tsize != null && message.hasOwnProperty("Tsize"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.Tsize);
        return writer;
    };

    /**
     * Encodes the specified PBLink message, length delimited. Does not implicitly {@link PBLink.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PBLink
     * @static
     * @param {IPBLink} message PBLink message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PBLink.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PBLink message from the specified reader or buffer.
     * @function decode
     * @memberof PBLink
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PBLink} PBLink
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PBLink.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.PBLink();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.Hash = reader.bytes();
                break;
            case 2:
                message.Name = reader.string();
                break;
            case 3:
                message.Tsize = reader.uint64();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a PBLink message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PBLink
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PBLink} PBLink
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PBLink.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PBLink message.
     * @function verify
     * @memberof PBLink
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PBLink.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.Hash != null && message.hasOwnProperty("Hash"))
            if (!(message.Hash && typeof message.Hash.length === "number" || $util.isString(message.Hash)))
                return "Hash: buffer expected";
        if (message.Name != null && message.hasOwnProperty("Name"))
            if (!$util.isString(message.Name))
                return "Name: string expected";
        if (message.Tsize != null && message.hasOwnProperty("Tsize"))
            if (!$util.isInteger(message.Tsize) && !(message.Tsize && $util.isInteger(message.Tsize.low) && $util.isInteger(message.Tsize.high)))
                return "Tsize: integer|Long expected";
        return null;
    };

    /**
     * Creates a PBLink message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PBLink
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PBLink} PBLink
     */
    PBLink.fromObject = function fromObject(object) {
        if (object instanceof $root.PBLink)
            return object;
        var message = new $root.PBLink();
        if (object.Hash != null)
            if (typeof object.Hash === "string")
                $util.base64.decode(object.Hash, message.Hash = $util.newBuffer($util.base64.length(object.Hash)), 0);
            else if (object.Hash.length)
                message.Hash = object.Hash;
        if (object.Name != null)
            message.Name = String(object.Name);
        if (object.Tsize != null)
            if ($util.Long)
                (message.Tsize = $util.Long.fromValue(object.Tsize)).unsigned = true;
            else if (typeof object.Tsize === "string")
                message.Tsize = parseInt(object.Tsize, 10);
            else if (typeof object.Tsize === "number")
                message.Tsize = object.Tsize;
            else if (typeof object.Tsize === "object")
                message.Tsize = new $util.LongBits(object.Tsize.low >>> 0, object.Tsize.high >>> 0).toNumber(true);
        return message;
    };

    /**
     * Creates a plain object from a PBLink message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PBLink
     * @static
     * @param {PBLink} message PBLink
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PBLink.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.Hash = options.bytes === String ? "" : [];
            object.Name = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.Tsize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.Tsize = options.longs === String ? "0" : 0;
        }
        if (message.Hash != null && message.hasOwnProperty("Hash"))
            object.Hash = options.bytes === String ? $util.base64.encode(message.Hash, 0, message.Hash.length) : options.bytes === Array ? Array.prototype.slice.call(message.Hash) : message.Hash;
        if (message.Name != null && message.hasOwnProperty("Name"))
            object.Name = message.Name;
        if (message.Tsize != null && message.hasOwnProperty("Tsize"))
            if (typeof message.Tsize === "number")
                object.Tsize = options.longs === String ? String(message.Tsize) : message.Tsize;
            else
                object.Tsize = options.longs === String ? $util.Long.prototype.toString.call(message.Tsize) : options.longs === Number ? new $util.LongBits(message.Tsize.low >>> 0, message.Tsize.high >>> 0).toNumber(true) : message.Tsize;
        return object;
    };

    /**
     * Converts this PBLink to JSON.
     * @function toJSON
     * @memberof PBLink
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PBLink.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return PBLink;
})();

$root.PBNode = (function() {

    /**
     * Properties of a PBNode.
     * @exports IPBNode
     * @interface IPBNode
     * @property {Array.<IPBLink>} [Links] PBNode Links
     * @property {Uint8Array} [Data] PBNode Data
     */

    /**
     * Constructs a new PBNode.
     * @exports PBNode
     * @classdesc Represents a PBNode.
     * @constructor
     * @param {IPBNode=} [properties] Properties to set
     */
    function PBNode(properties) {
        this.Links = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PBNode Links.
     * @member {Array.<IPBLink>}Links
     * @memberof PBNode
     * @instance
     */
    PBNode.prototype.Links = $util.emptyArray;

    /**
     * PBNode Data.
     * @member {Uint8Array}Data
     * @memberof PBNode
     * @instance
     */
    PBNode.prototype.Data = $util.newBuffer([]);

    /**
     * Creates a new PBNode instance using the specified properties.
     * @function create
     * @memberof PBNode
     * @static
     * @param {IPBNode=} [properties] Properties to set
     * @returns {PBNode} PBNode instance
     */
    PBNode.create = function create(properties) {
        return new PBNode(properties);
    };

    /**
     * Encodes the specified PBNode message. Does not implicitly {@link PBNode.verify|verify} messages.
     * @function encode
     * @memberof PBNode
     * @static
     * @param {IPBNode} message PBNode message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PBNode.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.Data != null && message.hasOwnProperty("Data"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.Data);
        if (message.Links != null && message.Links.length)
            for (var i = 0; i < message.Links.length; ++i)
                $root.PBLink.encode(message.Links[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified PBNode message, length delimited. Does not implicitly {@link PBNode.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PBNode
     * @static
     * @param {IPBNode} message PBNode message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PBNode.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PBNode message from the specified reader or buffer.
     * @function decode
     * @memberof PBNode
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PBNode} PBNode
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PBNode.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.PBNode();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 2:
                if (!(message.Links && message.Links.length))
                    message.Links = [];
                message.Links.push($root.PBLink.decode(reader, reader.uint32()));
                break;
            case 1:
                message.Data = reader.bytes();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a PBNode message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PBNode
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PBNode} PBNode
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PBNode.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PBNode message.
     * @function verify
     * @memberof PBNode
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PBNode.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.Links != null && message.hasOwnProperty("Links")) {
            if (!Array.isArray(message.Links))
                return "Links: array expected";
            for (var i = 0; i < message.Links.length; ++i) {
                var error = $root.PBLink.verify(message.Links[i]);
                if (error)
                    return "Links." + error;
            }
        }
        if (message.Data != null && message.hasOwnProperty("Data"))
            if (!(message.Data && typeof message.Data.length === "number" || $util.isString(message.Data)))
                return "Data: buffer expected";
        return null;
    };

    /**
     * Creates a PBNode message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PBNode
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PBNode} PBNode
     */
    PBNode.fromObject = function fromObject(object) {
        if (object instanceof $root.PBNode)
            return object;
        var message = new $root.PBNode();
        if (object.Links) {
            if (!Array.isArray(object.Links))
                throw TypeError(".PBNode.Links: array expected");
            message.Links = [];
            for (var i = 0; i < object.Links.length; ++i) {
                if (typeof object.Links[i] !== "object")
                    throw TypeError(".PBNode.Links: object expected");
                message.Links[i] = $root.PBLink.fromObject(object.Links[i]);
            }
        }
        if (object.Data != null)
            if (typeof object.Data === "string")
                $util.base64.decode(object.Data, message.Data = $util.newBuffer($util.base64.length(object.Data)), 0);
            else if (object.Data.length)
                message.Data = object.Data;
        return message;
    };

    /**
     * Creates a plain object from a PBNode message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PBNode
     * @static
     * @param {PBNode} message PBNode
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PBNode.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.Links = [];
        if (options.defaults)
            object.Data = options.bytes === String ? "" : [];
        if (message.Data != null && message.hasOwnProperty("Data"))
            object.Data = options.bytes === String ? $util.base64.encode(message.Data, 0, message.Data.length) : options.bytes === Array ? Array.prototype.slice.call(message.Data) : message.Data;
        if (message.Links && message.Links.length) {
            object.Links = [];
            for (var j = 0; j < message.Links.length; ++j)
                object.Links[j] = $root.PBLink.toObject(message.Links[j], options);
        }
        return object;
    };

    /**
     * Converts this PBNode to JSON.
     * @function toJSON
     * @memberof PBNode
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PBNode.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return PBNode;
})();

module.exports = $root;
