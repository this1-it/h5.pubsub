/*jshint maxlen:999*/
/*global describe:false,it:false,afterEach:false*/

'use strict';

var LIB_DIR = process.env.LIB_FOR_TESTS_DIR || '../lib';
var should = require('should');
var Subscription = require(LIB_DIR + '/Subscription');

describe("Subscription", function()
{
  function newSub()
  {
    return new Subscription('1', 'a');
  }

  var originalCompileFilter = Subscription.compileFilter;

  function restoreCompileFilter()
  {
    Subscription.compileFilter = originalCompileFilter;
  }

  describe("compileFilter", function()
  {
    it("should throw an Error", function()
    {
      Subscription.compileFilter.bind(null, {}).should.throw();
    });
  });

  describe("getJSON", function()
  {
    it("should return a JSON object with id, topic, filter and limit properties", function()
    {
      var expected = {
        id: '1',
        topic: 'a',
        filter: null,
        limit: 3
      };

      var sub = new Subscription(expected.id, expected.topic);
      sub.setLimit(expected.limit);

      sub.toJSON().should.eql(expected);
    });

    it("should return a source of the filter function", function()
    {
      var filter = function(message)
      {
        return typeof message === 'string';
      };
      var expected = filter.toString();

      var sub = newSub();
      sub.setFilter(filter);

      var actual = sub.toJSON().filter;

      actual.should.equal(expected);
    });
  });

  describe("getId", function()
  {
    it("should return the subscription ID", function()
    {
      var id = 'expectedId';
      var sub = new Subscription(id, 'a');

      sub.getId().should.equal(id);
    });
  });

  describe("getTopic", function()
  {
    it("should return the subscription topic", function()
    {
      var topic = 'expected.topic';
      var sub = new Subscription('1', topic);

      sub.getTopic().should.equal(topic);
    });
  });

  describe("getFilter", function()
  {
    it("should return NULL if the filter was not set", function()
    {
      should.not.exist(newSub().getFilter());
    });

    it("should return the set filter", function()
    {
      var filter = function() { return true; };
      var sub = newSub().setFilter(filter);

      sub.getFilter().should.equal(filter);
    });
  });

  describe("setFilter", function()
  {
    afterEach(function()
    {
      restoreCompileFilter();
    });

    it("should set the filter to the specified function", function()
    {
      var filter = function() { return true; };
      var sub = newSub();

      sub.setFilter(filter);

      sub.getFilter().should.equal(filter);
    });

    it("should compile the specified filter if it is not a function", function()
    {
      var actualFilter = null;
      var expectedFilter = {foo: {$gt: 7}};

      Subscription.compileFilter = function(filter)
      {
        actualFilter = filter;

        return function() { return true; };
      };

      newSub().setFilter(expectedFilter);

      should.exist(actualFilter);
      actualFilter.should.equal(expectedFilter);
    });

    it("should throw an Error if the compileFilter() does not return a function", function()
    {
      Subscription.compileFilter = function() { return 'NOT_A_FUNCTION'; };

      var sub = newSub();

      sub.setFilter.bind(sub, {a: 1}).should.throw();
    });

    it("should return self", function()
    {
      var sub = newSub();

      sub.setFilter(function() {}).should.equal(sub);
    });
  });

  describe("getLimit", function()
  {
    it("should return 0 if the limit was not set", function()
    {
      newSub().getLimit().should.equal(0);
    });

    it("should return the set limit", function()
    {
      newSub().setLimit(3).getLimit().should.equal(3);
    });
  });

  describe("setLimit", function()
  {
    it("should set the subscription limit to the specified value", function()
    {
      var sub = newSub();

      sub.setLimit(10);

      sub.getLimit().should.equal(10);
    });

    it("should throw an Error if the specified limit is less than 1", function()
    {
      var sub = newSub();

      sub.setLimit.bind(sub, 0).should.throw();
      sub.setLimit.bind(sub, -10).should.throw();
    });

    it("should return self", function()
    {
      var sub = newSub();

      sub.setLimit(1).should.equal(sub);
    });
  });

  describe("getMessageCount", function()
  {
    it("should return 0 if no messages were sent", function()
    {
      newSub().getMessageCount().should.equal(0);
    });

    it("should return the number of sent messages", function()
    {
      var sub = newSub();

      sub.send('a', null, {});
      sub.send('b', null, {});
      sub.send('c', null, {});

      sub.getMessageCount().should.equal(3);
    });
  });

  describe("on", function()
  {
    it("should register the specified message listener function", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('message', function() { ++calls; });
      sub.send('a', null, {});

      calls.should.equal(1);
    });

    it("should register the specified cancel listener function", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('cancel', function() { ++calls; });
      sub.cancel();

      calls.should.equal(1);
    });

    it("should register the specified multiple listener functions", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('cancel', function() { ++calls; });
      sub.on('cancel', function() { ++calls; });
      sub.cancel();

      calls.should.equal(2);
    });

    it("should throw an Error if the specified event name is invalid", function()
    {
      var sub = newSub();

      function test()
      {
        sub.on('unknown event', function() {});
      }

      test.should.throw();
    });

    it("should do nothing if the subscription was cancelled", function()
    {
      var sub = newSub();

      sub.cancel();

      sub.on('unknown event', function() {});
    });
  });

  describe("off", function()
  {
    it("should remove the specified message listener function", function()
    {
      var calls = 0;
      var sub = newSub();

      function cb() { ++calls; }

      sub.on('message', cb);
      sub.off('message', cb);
      sub.send('a', null, {});

      calls.should.equal(0);
    });

    it("should remove only the specified listener function", function()
    {
      var calls1 = 0;
      var calls2 = 0;
      var sub = newSub();

      function cb() { ++calls1; }

      sub.on('cancel', function() { ++calls2; });
      sub.on('cancel', cb);
      sub.off('cancel', cb);
      sub.cancel();

      calls1.should.equal(0);
      calls2.should.equal(1);
    });

    it("should throw an Error if the specified event name is invalid", function()
    {
      var sub = newSub();

      function test()
      {
        sub.off('unknown event', function() {});
      }

      test.should.throw();
    });

    it("should do nothing if the subscription was cancelled", function()
    {
      var sub = newSub();

      sub.cancel();

      sub.off('unknown event', function() {});
    });

    it("should do nothing if the specified listener function was not registered", function()
    {
      var sub = newSub();

      sub.off('message', function() {});
    });
  });

  describe("send", function()
  {
    it("should not emit a message event if the subscription was cancelled", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('message', function() { ++calls; });
      sub.cancel();
      sub.send('a', null, {});

      calls.should.equal(0);
    });

    it("should not emit a message event if the filter does not match the message", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.setFilter(function() { return false; });
      sub.on('message', function() { ++calls; });
      sub.send('a', null, {});

      calls.should.equal(0);
    });

    it("should pass message, topic, meta and self to the filter function", function()
    {
      var sub = newSub();
      var expectedArgs = ['message', 'topic', {me: 'ta'}, sub];
      var actualArgs = [];

      sub.setFilter(function() { actualArgs = Array.prototype.slice.call(arguments); });
      sub.send(expectedArgs[1], expectedArgs[0], expectedArgs);
    });

    it("should emit a message event", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('message', function() { ++calls; });
      sub.send('a', null, {});

      calls.should.equal(1);
    });

    it("should invoke all message listeners", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('message', function() { ++calls; });
      sub.on('message', function() { ++calls; });
      sub.on('message', function() { ++calls; });
      sub.send('a', null, {});

      calls.should.equal(3);
    });

    it("should cancel the subscription if the message limit was reached", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('cancel', function() { ++calls; });
      sub.setLimit(1);
      sub.send('a', null, {});

      calls.should.equal(1);
    });
  });

  describe("cancel", function()
  {
    it("should emit a cancel event", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('cancel', function() { ++calls; });
      sub.cancel();

      calls.should.equal(1);
    });

    it("should invoke all cancel listeners", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('cancel', function() { ++calls; });
      sub.on('cancel', function() { ++calls; });
      sub.on('cancel', function() { ++calls; });
      sub.cancel();

      calls.should.equal(3);
    });

    it("should do nothing if the subscription was already cancelled", function()
    {
      var calls = 0;
      var sub = newSub();

      sub.on('cancel', function() { ++calls; });
      sub.cancel();
      sub.cancel();

      calls.should.equal(1);
    });
  });
});
