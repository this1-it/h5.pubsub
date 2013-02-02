module.exports = Broker;

/**
 * @name h5.pubsub.Broker
 * @interface
 */
function Broker() {}

Broker.prototype.destroy = function() {};

/**
 * @return {h5.pubsub.Sandbox}
 */
Broker.prototype.sandbox = function() {};

/**
 * @param {string} topic
 * @param {*} [message]
 * @param {object} [meta]
 * @throws {Error} If the specified topic is invalid.
 */
Broker.prototype.publish = function(topic, message, meta) {};

/**
 * @param {string} topic
 * @param {function(string, *, object)} [onMessage]
 * @return {h5.pubsub.Subscription}
 * @throws {Error} If the specified topic is invalid.
 */
Broker.prototype.subscribe = function(topic, onMessage) {};

/**
 * @param {string} topic
 * @return {h5.pubsub.Broker}
 * @throws {Error} If the specified topic is invalid.
 */
Broker.prototype.unsubscribe = function(topic) {};

/**
 * @return {object.<string, number>}
 */
Broker.prototype.count = function() {};

/**
 * @return {object.<string, number>}
 */
Broker.prototype.countAll = function() {};

/**
 * @param {string} event
 * @param {function} callback
 * @return {h5.pubsub.Broker}
 * @throws {Error} If the specified event is unknown.
 */
Broker.prototype.on = function(event, callback) {};

/**
 * @param {string} event
 * @param {function} callback
 * @return {h5.pubsub.Broker}
 * @throws {Error} If the specified event is unknown.
 */
Broker.prototype.off = function(event, callback) {};

/**
 * @param {string} event
 * @param {...*} args
 * @return {h5.pubsub.Broker}
 * @throws {Error} If the specified event is unknown.
 */
Broker.prototype.emit = function(event, args) {};
