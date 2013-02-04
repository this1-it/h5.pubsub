var MessageBroker = require('../lib/MessageBroker');
var Subscription = require('../lib/Subscription');
var Sandbox = require('../lib/Sandbox');

describe("MessageBroker", function()
{
  it("should emit an empty topic event if the last subscription of the specific topic was canceled", function()
  {
    var mb = new MessageBroker();
    var emptyTopicCalls = 0;

    mb.on('empty topic', function() { ++emptyTopicCalls; });

    var sub1 = mb.subscribe('a');
    var sub2 = mb.subscribe('a');

    sub1.cancel();
    sub2.cancel();

    emptyTopicCalls.should.equal(1);
  });

  it("should emit a cancel event if any added subscription was cancelled", function()
  {
    var mb = new MessageBroker();
    var cancelCalls = 0;

    mb.on('cancel', function() { ++cancelCalls; });

    var sub1 = mb.subscribe('a');
    var sub2 = mb.subscribe('a');

    sub1.cancel();

    cancelCalls.should.equal(1);
  });

  it("should pass the cancelled subscription as a first argument to the cancel event", function()
  {
    var mb = new MessageBroker();
    var actualSubscription = {};

    mb.on('cancel', function(subscription)
    {
      actualSubscription = subscription;
    });

    var expectedSubscription = mb.subscribe('a');

    expectedSubscription.cancel();

    actualSubscription.should.equal(expectedSubscription);
  });

  describe("subscribe", function()
  {
    it("should allow adding a subscription without a message callback", function()
    {
      var mb = new MessageBroker();

      function subscribe()
      {
        mb.subscribe('a');
      }

      subscribe.should.not.throw();
    });

    it("should add a subscription to the specified topic", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;
      var cb = function() { ++cbCalls; };

      mb.subscribe('a', cb);
      mb.publish('a');

      cbCalls.should.equal(1);
    });

    it("should add a subscription to the specified level 2 topic", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;
      var cb = function() { ++cbCalls; };

      mb.subscribe('a.b', cb);
      mb.publish('a.b');

      cbCalls.should.equal(1);
    });

    it("should add a subscription to the specified multi-level topic", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;
      var cb = function() { ++cbCalls; };

      mb.subscribe('a.b.c.d.e.f', cb);
      mb.publish('a.b.c.d.e.f');

      cbCalls.should.equal(1);
    });

    it("should return an added subscription", function()
    {
      var mb = new MessageBroker();

      var sub = mb.subscribe('a');

      sub.should.an.instanceOf(Subscription);
    });

    it("should emit a new topic event if it is the first subscription to the topic", function()
    {
      var mb = new MessageBroker();
      var newTopicCalls = 0;

      mb.on('new topic', function() { ++newTopicCalls; });

      mb.subscribe('a');
      mb.subscribe('a');

      newTopicCalls.should.equal(1);
    });

    it("should emit a subscribe event for each new subscription", function()
    {
      var mb = new MessageBroker();
      var subscribeCalls = 0;

      mb.on('subscribe', function() { ++subscribeCalls; });

      mb.subscribe('a');
      mb.subscribe('a');

      subscribeCalls.should.equal(2);
    });

    it("should add subscriptions from within callbacks", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a', function()
      {
        mb.subscribe('b', function() { ++cbCalls; });
      });
      mb.publish('a');
      mb.publish('b');

      cbCalls.should.equal(1);
    });

    it("should assign different IDs to subscriptions of the same topic", function()
    {
      var mb = new MessageBroker();

      var sub1Id = mb.subscribe('a').getId();
      var sub2Id = mb.subscribe('a').getId();

      sub1Id.should.not.equal(sub2Id);
    });

    it("should assign different IDs to subscriptions of different topics", function()
    {
      var mb = new MessageBroker();

      var sub1Id = mb.subscribe('a').getId();
      var sub2Id = mb.subscribe('b').getId();

      sub1Id.should.not.equal(sub2Id);
    });

    it("should allow ANY as the only topic part", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('*', function() { ++cbCalls; });
      mb.publish('a');
      mb.publish('b');
      mb.publish('a.b');

      cbCalls.should.equal(2);
    });

    it("should allow ANY as the first topic part", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('*.b', function() { ++cbCalls; });
      mb.publish('a.b');
      mb.publish('b.b');
      mb.publish('a');
      mb.publish('a.a');

      cbCalls.should.equal(2);
    });

    it("should allow ANY as the last topic part", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a.*', function() { ++cbCalls; });
      mb.publish('a.b');
      mb.publish('a.a');
      mb.publish('a');
      mb.publish('a.b.c');

      cbCalls.should.equal(2);
    });

    it("should allow ANY as the middle topic part", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a.*.c', function() { ++cbCalls; });
      mb.publish('a.1.c');
      mb.publish('a.2.c');
      mb.publish('a');
      mb.publish('a.b');

      cbCalls.should.equal(2);
    });

    it("should allow multiple ANY topic parts", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('*.b.*.c.*', function() { ++cbCalls; });
      mb.publish('1.b.2.c.3');
      mb.publish('2.b.3.c.4');
      mb.publish('a');
      mb.publish('a.b.c.d.e');

      cbCalls.should.equal(2);
    });

    it("should allow ALL as the only topic part", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('**', function() { ++cbCalls; });
      mb.publish('a');
      mb.publish('a.b');
      mb.publish('a.b.c');

      cbCalls.should.equal(3);
    });

    it("should allow ALL as the last topic part", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a.b.**', function() { ++cbCalls; });
      mb.publish('a');
      mb.publish('a.b');
      mb.publish('a.b.c');
      mb.publish('a.b.c.d');

      cbCalls.should.equal(3);
    });

    it("should throw an Error if the specified topic is invalid", function()
    {
      var mb = new MessageBroker();

      (function() { mb.subscribe(''); }).should.throw();
      (function() { mb.subscribe('.'); }).should.throw();
      (function() { mb.subscribe('..'); }).should.throw();
    });
  });

  describe("unsubscribe", function()
  {
    it("should do nothing if there are no subscriptions to the specified topic", function()
    {
      var mb = new MessageBroker();

      mb.unsubscribe('a');
    });

    it("should remove the single subscription matching the specified topic", function()
    {
      var mb = new MessageBroker();
      var expectedSub = {};
      var actualSub = {};

      mb.on('cancel', function(sub) { actualSub = sub; });

      expectedSub = mb.subscribe('a');
      mb.unsubscribe('a');

      actualSub.should.equal(expectedSub);
    });

    it("should remove all subscriptions matching the specified topic", function()
    {
      var mb = new MessageBroker();
      var expectedSubs = [];
      var actualSubs = [];

      mb.on('cancel', function(sub) { actualSubs.push(sub); });

      expectedSubs.push(
        mb.subscribe('a'),
        mb.subscribe('a'),
        mb.subscribe('a')
      );
      mb.unsubscribe('a');

      actualSubs.should.eql(expectedSubs);
    });

    it("should only remove subscriptions matching the specified topic", function()
    {
      var mb = new MessageBroker();
      var expectedSubs = [];
      var actualSubs = [];

      mb.on('cancel', function(sub) { actualSubs.push(sub); });

      expectedSubs.push(mb.subscribe('a'));
      expectedSubs.push(mb.subscribe('a'));
      mb.subscribe('b');
      mb.subscribe('c');
      mb.unsubscribe('a');

      actualSubs.should.eql(expectedSubs);
    });

    it("should remove subscriptions with multi-level topics", function()
    {
      var mb = new MessageBroker();
      var expectedSubs = [];
      var actualSubs = [];

      mb.on('cancel', function(sub) { actualSubs.push(sub); });

      expectedSubs.push(mb.subscribe('a.b'));
      expectedSubs.push(mb.subscribe('a.b'));
      expectedSubs.push(mb.subscribe('a.b.c'));
      mb.subscribe('b.c');
      mb.subscribe('c.d.e');
      mb.unsubscribe('a.b');
      mb.unsubscribe('a.b.c');

      actualSubs.should.eql(expectedSubs);
    });

    it("should return self", function()
    {
      var mb = new MessageBroker();

      mb.unsubscribe('a').should.equal(mb);
    });

    it("should throw an Error if the specified topic is invalid", function()
    {
      var mb = new MessageBroker();

      (function() { mb.unsubscribe(''); }).should.throw();
      (function() { mb.unsubscribe('.'); }).should.throw();
      (function() { mb.unsubscribe('..'); }).should.throw();
    });
  });

  describe("publish", function()
  {
    it("should return self", function()
    {
      var mb = new MessageBroker();

      mb.publish('a').should.equal(mb);
    });

    it("should invoke a callback for a single subscription matching the specified topic", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a', function() { ++cbCalls; });
      mb.publish('a');

      cbCalls.should.equal(1);
    });

    it("should invoke callbacks for multiple subscriptions matching the specified topic", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;
      var cb = function() { ++cbCalls; };

      mb.subscribe('a', cb);
      mb.subscribe('a', cb);
      mb.subscribe('a', cb);
      mb.publish('a');

      cbCalls.should.equal(3);
    });

    it("should pass the specified message to a callback as the first argument", function()
    {
      var mb = new MessageBroker();
      var expectedMessage = {expected: 'message'};
      var actualMessage = {actual: 'message'};

      mb.subscribe('a', function(message)
      {
        actualMessage = message;
      });
      mb.publish('a', expectedMessage);

      actualMessage.should.equal(expectedMessage);
    });

    it("should pass the specified topic to a callback as the second argument", function()
    {
      var mb = new MessageBroker();
      var expectedTopic = 'foo';
      var actualTopic = '';

      mb.subscribe(expectedTopic, function(_, topic)
      {
        actualTopic = topic;
      });
      mb.publish(expectedTopic);

      actualTopic.should.equal(expectedTopic);
    });

    it("should pass a subscription to a callback as the fourth argument", function()
    {
      var mb = new MessageBroker();
      var expectedMeta = {foo: 'bar'};
      var actualMeta = {};

      mb.subscribe('a', function(_, _, meta)
      {
        actualMeta = meta;
      });
      mb.publish('a', null, expectedMeta);

      actualMeta.should.equal(expectedMeta);
    });

    it("should pass a subscription to a callback as the fourth argument", function()
    {
      var mb = new MessageBroker();
      var actualSubscription = {};

      var expectedSubscription = mb.subscribe('a', function(_, _, _, subscription)
      {
        actualSubscription = subscription;
      });
      mb.publish('a');

      actualSubscription.should.equal(expectedSubscription);
    });

    it("should emit a message event with the same arguments", function()
    {
      var mb = new MessageBroker();
      var expectedTopic = 'EXPECTED_TOPIC';
      var expectedMessage = {expected: 'message'};
      var expectedMeta = {expected: 'meta'};
      var actualTopic = 'ACTUAL_TOPIC';
      var actualMessage = {actual: 'message'};
      var actualMeta = {actual: 'meta'};

      mb.on('message', function(topic, message, meta)
      {
        actualTopic = topic;
        actualMessage = message;
        actualMeta = meta;
      });
      mb.publish(expectedTopic, expectedMessage, expectedMeta);

      actualTopic.should.equal(expectedTopic);
      actualMessage.should.equal(expectedMessage);
      actualMeta.should.equal(expectedMeta);
    });

    it("should emit a message event for each published message", function()
    {
      var mb = new MessageBroker();
      var messageCalls = 0;

      mb.on('message', function() { ++messageCalls; });
      mb.publish('a');
      mb.publish('a');
      mb.publish('b');
      mb.publish('c');

      messageCalls.should.equal(4);
    });
    
    it("should invoke a callback matching the subscription's filter", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a')
        .setFilter(function(message)
        {
          return typeof message === 'object'
            && message !== null
            && message.hello === 'world';
        })
        .on('message', function() { ++cbCalls; });

      mb.publish('a', {hello: 'world'});

      cbCalls.should.equal(1);
    });

    it("should not invoke a callback not matching the subscription's filter", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a')
        .setFilter(function(message)
        {
          return typeof message === 'object'
            && message !== null
            && message.hello === 'NOPE';
        })
        .on('message', function() { ++cbCalls; });

      mb.publish('a', {hello: 'world'});

      cbCalls.should.equal(0);
    });

    it("should invoke a callback only the limited amount of times", function()
    {
      var mb = new MessageBroker();
      var cbCalls = 0;

      mb.subscribe('a')
        .setLimit(2)
        .on('message', function() { ++cbCalls; });

      mb.publish('a');
      mb.publish('a');
      mb.publish('a');

      cbCalls.should.equal(2);
    });

    it("should emit a cancel event after a subscription reached its message limit", function()
    {
      var mb = new MessageBroker();
      var cancelCalls = 0;

      mb.on('cancel', function() { ++cancelCalls; });
      mb.subscribe('a').setLimit(1);
      mb.publish('a');

      cancelCalls.should.equal(1);
    });

    it("should emit a cancel event with the cancelled subscription as the first argument after it has reached its message limit", function()
    {
      var mb = new MessageBroker();
      var actualSubscription = {};

      mb.on('cancel', function(subscription)
      {
        actualSubscription = subscription;
      });

      var expectedSubscription = mb.subscribe('a').setLimit(1);

      mb.publish('a');

      actualSubscription.should.equal(expectedSubscription);
    });

    it("should immediately publish from within a callback", function()
    {
      var mb = new MessageBroker();
      var actualCalls = [];
      var expectedCalls = ['before', 'inner', 'after'];

      mb.subscribe('inner', function()
      {
        actualCalls.push('inner');
      });
      mb.subscribe('a', function()
      {
        actualCalls.push('before');
        mb.publish('inner');
        actualCalls.push('after');
      });
      mb.publish('a');

      actualCalls.should.eql(expectedCalls);
    });

    it("should not invoke callback of the only subscription cancelled during sending of a message", function()
    {
      var mb = new MessageBroker();
      var calls = 0;

      var sub1 = mb.subscribe('a', function()
      {
        ++calls;

        sub1.cancel();
      });

      mb.publish('a');
      mb.publish('a');

      calls.should.equal(1);
    });

    it("should invoke callback of the only remaining subscription not cancelled during sending of a message", function()
    {
      var mb = new MessageBroker();
      var actualSubs = [];

      var sub1 = mb.subscribe('a', function(_, _, _, sub)
      {
        actualSubs.push(sub);

        sub1.cancel();
      });
      var sub2 = mb.subscribe('a', function(_, _, _, sub)
      {
        actualSubs.push(sub);
      });

      var expectedSubs = [sub1, sub2, sub2];

      mb.publish('a');
      mb.publish('a');

      actualSubs.should.eql(expectedSubs);
    });

    it("should not invoke callbacks of multiple subscriptions cancelled during sending of a message", function()
    {
      var mb = new MessageBroker();
      var actualSubs = [];

      var sub1 = mb.subscribe('a', function(_, _, _, sub)
      {
        actualSubs.push(sub);

        sub2.cancel();
        sub4.cancel();
      });

      function addSub(_, _, _, sub)
      {
        actualSubs.push(sub);
      }

      var sub2 = mb.subscribe('a', addSub);
      var sub3 = mb.subscribe('a', addSub);
      var sub4 = mb.subscribe('a', addSub);
      var sub5 = mb.subscribe('a', addSub);

      var expectedSubs = [sub1, sub3, sub5];

      mb.publish('a');

      actualSubs.should.eql(expectedSubs);
    });

    it("should throw an Error if the specified topic is invalid", function()
    {
      var mb = new MessageBroker();

      (function() { mb.publish(''); }).should.throw();
      (function() { mb.publish('.'); }).should.throw();
      (function() { mb.publish('..'); }).should.throw();
    });

    it("should set the meta parameter to an empty object if it was not specified", function()
    {
      var mb = new MessageBroker();

      mb.on('message', function(_, _, meta)
      {
        meta.should.eql({});
      });
      mb.subscribe('a', function(_, _, meta)
      {
        meta.should.eql({});
      });
      mb.publish('a');
    });
  });

  describe("count", function()
  {
    function subscribeToTopics(mb, topicToCountMap)
    {
      for (var topic in topicToCountMap)
      {
        var count = topicToCountMap[topic];

        for (var i = 0; i < count; ++i)
        {
          mb.subscribe(topic);
        }
      }
    }

    it("should return an empty object if there are no subscriptions", function()
    {
      var mb = new MessageBroker();

      mb.count().should.eql({});
    });

    it("should return an object with topic as a key and 1 as a value if there is only one subscription", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        'a': 1
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });

    it("should return an object with topic as a key and number of subscriptions to that topic as a value", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        'a': 3
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });

    it("should return an object with topics as keys and number of subscriptions to these topics as values", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        'a': 1,
        'b': 2,
        'c': 1
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });

    it("should support nested subscriptions", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        'a.b': 1,
        'a.b.c': 2,
        'z.x.y': 1
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });

    it("should support subscriptions with ANY topic part", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        '*': 1,
        'a.*.c': 2,
        'z.*.*': 1
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });

    it("should support subscriptions with ALL topic part", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        '**': 1,
        'a.**': 2,
        'z.y.**': 1
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });

    it("should support subscriptions with mixed topic parts", function()
    {
      var mb = new MessageBroker();
      var expectedCount = {
        '**': 1,
        'a': 2,
        'a.**': 2,
        'a.b.c': 3,
        'z.y.**': 1,
        'f.o.*.bar.**': 1
      };

      subscribeToTopics(mb, expectedCount);

      var actualCount = mb.count();

      actualCount.should.eql(expectedCount);
    });
  });

  describe("sandbox", function()
  {
    it("should return an instance of Sandbox bound to the creating MessageBroker", function()
    {
      var mb = new MessageBroker();
      var sb = mb.sandbox();
      var messageCalls = 0;

      sb.should.an.instanceOf(Sandbox);

      mb.on('message', function() { ++messageCalls; });
      sb.publish('hello', 'world!');

      messageCalls.should.equal(1);
    });
  });

  describe("destroy", function()
  {
    it("should cancel all subscriptions", function()
    {
      var mb = new MessageBroker();
      var expectedSubs = [];
      var actualSubs = [];

      mb.on('cancel', function(sub) { actualSubs.push(sub) });

      expectedSubs.push(
        mb.subscribe('a'),
        mb.subscribe('b'),
        mb.subscribe('c')
      );

      mb.destroy();

      actualSubs.should.eql(expectedSubs);
    });

    it("should emit empty topic for each distinct subscribed topic", function()
    {
      var mb = new MessageBroker();
      var expectedTopics = ['a', 'b', 'c'];
      var actualTopics = [];

      mb.on('empty topic', function(topic) { actualTopics.push(topic); });

      mb.subscribe('a');
      mb.subscribe('b');
      mb.subscribe('c');

      mb.destroy();

      expectedTopics.should.eql(actualTopics);
    });
  });

  describe("on", function()
  {
    it("should add the specified callback to the specified event", function()
    {
      var mb = new MessageBroker();
      var expectedEmittedEvents = ['subscribe', 'cancel', 'new topic', 'empty topic', 'message'];
      var actualEmittedEvents = [];

      expectedEmittedEvents.forEach(function(eventName)
      {
        mb.on(eventName, function()
        {
          actualEmittedEvents.push(eventName);
        });

        mb.emit(eventName);
      });

      actualEmittedEvents.should.eql(expectedEmittedEvents);
    });

    it("should allow multiple callbacks to the same event", function()
    {
      var mb = new MessageBroker();
      var calls = 0;

      mb.on('message', function() { ++calls; });
      mb.on('message', function() { ++calls; });
      mb.on('message', function() { ++calls; });

      mb.emit('message');

      calls.should.equal(3);
    });

    it("should throw an Error if the specified event name is invalid", function()
    {
      var mb = new MessageBroker();

      (function()
      {
        mb.on('hopefully an unknown event', function() {});
      }).should.throw();
    });

    it("should return self", function()
    {
      var mb = new MessageBroker();

      mb.on('message', function() {}).should.equal(mb);
    });
  });

  describe("off", function()
  {
    it("should do nothing if no callbacks were added for the specified event", function()
    {
      var mb = new MessageBroker();

      mb.off('message', function() {});
    });

    it("should do nothing if the specified callback does not match the one added for the specified event", function()
    {
      var mb = new MessageBroker();
      var calls = 0;

      mb.on('message', function() { ++calls; });
      mb.off('message', function() {});
      mb.emit('message');

      calls.should.equal(1);
    });

    it("should remove the matching event and callback", function()
    {
      var mb = new MessageBroker();
      var calls = 0;
      var cb = function() { ++calls; };

      mb.on('message', cb);
      mb.off('message', cb);
      mb.emit('message');

      calls.should.equal(0);
    });

    it("should not remove not matching event and callback", function()
    {
      var mb = new MessageBroker();
      var calls1 = 0;
      var calls2 = 0;
      var cb1 = function() { ++calls1; };
      var cb2 = function() { ++calls2; };

      mb.on('message', cb1);
      mb.on('message', cb2);
      mb.off('message', cb1);
      mb.emit('message');

      calls1.should.equal(0);
      calls2.should.equal(1);
    });

    it("should throw an Error if the specified event name is invalid", function()
    {
      var mb = new MessageBroker();

      (function()
      {
        mb.off('hopefully an unknown event', function() {});
      }).should.throw();
    });

    it("should return self", function()
    {
      var mb = new MessageBroker();

      mb.off('message', function() {}).should.equal(mb);
    });
  });

  describe("emit", function()
  {
    it("should do nothing if there are no callbacks added for the specified event", function()
    {
      var mb = new MessageBroker();

      mb.emit('message');
    });

    it("should invoke callbacks added for the specified event", function()
    {
      var mb = new MessageBroker();
      var calls = 0;
      var cb = function() { ++calls; };

      mb.on('message', cb);
      mb.on('message', cb);
      mb.emit('message');

      calls.should.equal(2);
    });

    it("should pass the additional arguments to the callback", function()
    {
      var mb = new MessageBroker();
      var expectedArgs = [];
      var actualArgs = [];

      mb.on('message', function()
      {
        actualArgs = Array.prototype.slice.call(arguments);
      });

      function emitMessageEvent(args)
      {
        expectedArgs = args;

        mb.emit.apply(mb, [].concat('message', args));
      }

      emitMessageEvent([1]);
      actualArgs.should.eql(expectedArgs);

      emitMessageEvent([1, 2]);
      actualArgs.should.eql(expectedArgs);

      emitMessageEvent([1, 2, 3]);
      actualArgs.should.eql(expectedArgs);

      emitMessageEvent([1, 2, 3, 4]);
      actualArgs.should.eql(expectedArgs);

      emitMessageEvent([1, 2, 3, 4, 5]);
      actualArgs.should.eql(expectedArgs);
    });

    it("should pass the additional arguments to all callbacks", function()
    {
      var mb = new MessageBroker();
      var expectedArgs = [];
      var actualArgs = [];

      function pushActualArgs()
      {
        actualArgs.push(Array.prototype.slice.call(arguments));
      }

      mb.on('message', pushActualArgs);
      mb.on('message', pushActualArgs);

      function emitMessageEvent(args)
      {
        expectedArgs.push(args);
        expectedArgs.push(args);

        mb.emit.apply(mb, [].concat('message', args));
      }

      emitMessageEvent([1]);
      emitMessageEvent([1, 2]);
      emitMessageEvent([1, 2, 3]);
      emitMessageEvent([1, 2, 3, 4]);
      emitMessageEvent([1, 2, 3, 4, 5]);

      actualArgs.should.eql(expectedArgs);
    });

    it("should throw an Error if the specified event name is invalid", function()
    {
      var mb = new MessageBroker();

      (function()
      {
        mb.emit('hopefully an unknown event');
      }).should.throw();
    });

    it("should return self", function()
    {
      var mb = new MessageBroker();

      mb.emit('message').should.equal(mb);
    });
  });
});
