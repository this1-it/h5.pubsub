var Subscriptions = require('./Subscriptions');
var Subscription = require('./Subscription');

module.exports = Sandbox;

/**
 * @name h5.pubsub.Sandbox
 * @constructor
 * @param {h5.pubsub.MessageBroker} messageBroker
 */
function Sandbox(messageBroker)
{
  /**
   * @private
   * @type {h5.pubsub.MessageBroker}
   */
  this.messageBroker = messageBroker;

  /**
   * @private
   * @type {object.<string, h5.pubsub.Subscription>}
   */
  this.subscriptions = {};

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

  this.subscriptions = null;
  this.messageBroker = null;
};

/**
 * @param {string} topic
 * @param {*=} message
 * @param {object=} meta
 * @return {h5.pubsub.Sandbox}
 */
Sandbox.prototype.publish = function(topic, message, meta)
{
  this.messageBroker.publish(topic, message, meta);

  return this;
};

/**
 * @param {string} topic
 * @param {function(string, *, object)=} onMessage
 * @return {h5.pubsub.Subscription}
 */
Sandbox.prototype.subscribe = function(topic, onMessage)
{
  var subscription = this.messageBroker.subscribe(topic, onMessage);

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
 * @private
 * @param {h5.pubsub.Subscription} subscription
 */
Sandbox.prototype.removeSubscription = function(subscription)
{
  delete this.subscriptions[subscription.getId()];
};
