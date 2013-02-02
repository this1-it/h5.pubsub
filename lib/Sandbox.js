var Subscription = require('./Subscription');

module.exports = Sandbox;

/**
 * @name h5.pubsub.Sandbox
 * @constructor
 * @implements {h5.pubsub.Broker}
 * @param {h5.pubsub.Broker} broker
 */
function Sandbox(broker)
{
  /**
   * @private
   * @type {h5.pubsub.Broker}
   */
  this.broker = broker;

  /**
   * @private
   * @type {object.<string, h5.pubsub.Subscription>}
   */
  this.subscriptions = {};

  /**
   * @private
   * @type {Array|null}
   */
  this.listeners = null;

  /**
   * @private
   * @type {function(h5.pubsub.Subscription)}
   */
  this.removeSubscription = this.removeSubscription.bind(this);
}

Sandbox.prototype.destroy = function()
{
  var subscriptions = this.subscriptions;

  for (var id in subscriptions)
  {
    if (subscriptions.hasOwnProperty(id))
    {
      subscriptions[id].cancel();
    }
  }

  var listeners = this.listeners;

  if (listeners !== null)
  {
    for (var i = 0, l = listeners.length; i < l; i += 2)
    {
      this.broker.off(listeners[i], listeners[i + 1]);
    }

    this.listeners = null;
  }

  this.subscriptions = null;
  this.broker = null;
};

/**
 * @return {h5.pubsub.Sandbox}
 */
Sandbox.prototype.sandbox = function()
{
  return new Sandbox(this);
};

/**
 * @param {string} topic
 * @param {*} [message]
 * @param {object} [meta]
 * @return {h5.pubsub.Sandbox}
 */
Sandbox.prototype.publish = function(topic, message, meta)
{
  this.broker.publish(topic, message, meta);

  return this;
};

/**
 * @param {string} topic
 * @param {function(string, *, object)} [onMessage]
 * @return {h5.pubsub.Subscription}
 */
Sandbox.prototype.subscribe = function(topic, onMessage)
{
  var subscription = this.broker.subscribe(topic, onMessage);

  subscription.on('cancel', this.removeSubscription);

  this.subscriptions[subscription.getId()] = subscription;

  return subscription;
};

/**
 * @param {string} topic
 * @return {h5.pubsub.Sandbox}
 */
Sandbox.prototype.unsubscribe = function(topic)
{
  var ids = [];
  var subscriptions = this.subscriptions;

  for (var id in subscriptions)
  {
    if (subscriptions.hasOwnProperty(id)
      && subscriptions[id].getTopic() === topic)
    {
      ids.push(id);
    }
  }

  for (var i = 0, l = ids.length; i < l; ++i)
  {
    subscriptions[ids[i]].cancel();
  }

  return this;
};

/**
 * @return {object.<string, number>}
 */
Sandbox.prototype.count = function()
{
  var result = {};
  var subscriptions = this.subscriptions;

  for (var id in subscriptions)
  {
    if (!subscriptions.hasOwnProperty(id))
    {
      continue;
    }

    var topic = subscriptions[id].getTopic();

    if (topic in result)
    {
      ++result[topic];
    }
    else
    {
      result[topic] = 1;
    }
  }

  return result;
};

/**
 * @return {object.<string, number>}
 */
Sandbox.prototype.countAll = function()
{
  return this.broker.countAll();
};

/**
 * @param {string} event
 * @param {function} callback
 * @return {h5.pubsub.Sandbox}
 * @throws {Error} If the specified event is unknown.
 */
Sandbox.prototype.on = function(event, callback)
{
  if (this.listeners === null)
  {
    this.listeners = [event, callback];
  }
  else
  {
    this.listeners.push(event, callback);
  }

  this.broker.on(event, callback);

  return this;
};

/**
 * @param {string} event
 * @param {function} callback
 * @return {h5.pubsub.Sandbox}
 * @throws {Error} If the specified event is unknown.
 */
Sandbox.prototype.off = function(event, callback)
{
  var listeners = this.listeners;

  if (listeners === null)
  {
    return this;
  }

  var pos = -1;

  for (var i = 0, l = listeners.length; i < l; i += 2)
  {
    if (listeners[i] === event && listeners[i + 1] === callback)
    {
      pos = i;

      break;
    }
  }

  if (pos !== -1)
  {
    listeners.splice(pos, 2);
  }

  return this;
};

/**
 * @param {string} event
 * @param {...*} args
 * @return {h5.pubsub.Sandbox}
 * @throws {Error} If the specified event is unknown.
 */
Sandbox.prototype.emit = function(event, args)
{
  this.broker.apply(this.broker, arguments);

  return this;
};

/**
 * @private
 * @param {h5.pubsub.Subscription} subscription
 */
Sandbox.prototype.removeSubscription = function(subscription)
{
  delete this.subscriptions[subscription.getId()];
};
