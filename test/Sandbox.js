var MessageBroker = require('../lib/MessageBroker');
var Sandbox = require('../lib/Sandbox');
var Subscription = require('../lib/Subscription');

describe("Sandbox", function()
{
  beforeEach(function()
  {
    this.mb = new MessageBroker();
    this.sb = this.mb.sandbox();
  });

  afterEach(function()
  {
    this.sb.destroy();
    this.mb.destroy();

    delete this.mb;
    delete this.sb;
  });

  describe("destroy", function()
  {
    it("should remove only listeners registered by the sandbox", function()
    {
      var sandboxHits = 0;
      var brokerHits = 0;

      this.sb.subscribe('a', function() { ++sandboxHits; });
      this.mb.subscribe('a', function() { ++brokerHits; });
      this.sb.destroy();
      this.mb.publish('a');

      sandboxHits.should.be.equal(0);
      brokerHits.should.be.equal(1);
    });

    it("should cancel only subscriptions made by the sandbox", function()
    {
      var actualCancelled = [];
      var expectedCancelled = [];

      this.mb.on('cancel', function(sub) { actualCancelled.push(sub); });
      this.mb.subscribe('a');
      this.mb.subscribe('broker.a');

      expectedCancelled.push(this.sb.subscribe('a'));
      expectedCancelled.push(this.sb.subscribe('sandbox.a'));

      this.sb.destroy();

      actualCancelled.should.be.eql(expectedCancelled);
    });
  });

  describe("sandbox", function()
  {
    it("should return an instance of Sandbox bound to the creating Sandbox", function()
    {
      var sb = this.sb.sandbox();
      var hits = 0;

      sb.should.an.instanceOf(Sandbox);

      this.sb.publish = function() { ++hits; };

      sb.publish('hello', 'world!');

      hits.should.equal(1);
    });
  });

  describe("publish", function()
  {
    it("should publish to parent broker", function()
    {
      var actualArgs = null;
      var expectedArgs = ['a', 'b', {a: 'b'}];

      this.mb.on('message', function()
      {
        actualArgs = Array.prototype.slice.call(arguments);
      });

      this.sb.publish.apply(this.sb, expectedArgs);

      actualArgs.should.be.eql(expectedArgs);
    });

    it("should return self", function()
    {
      this.sb.publish('a').should.be.equal(this.sb);
    });
  });

  describe("subscribe", function()
  {
    it("should add subscription for the specified topic", function()
    {
      var hits = 0;

      this.mb.on('new topic', function() { ++hits; });

      this.sb.subscribe('a');

      hits.should.be.equal(1);
    });

    it("should return an instance of Subscription with the specified topic", function()
    {
      var sub = this.sb.subscribe('a');

      sub.should.be.an.instanceOf(Subscription);
      sub.getTopic().should.be.equal('a');
    });

    it("should return an instance of Subscription with the specified message listener", function()
    {
      var hits = 0;

      var sub = this.sb.subscribe('a', function() { ++hits; });

      sub.should.be.an.instanceOf(Subscription);

      this.sb.publish('a');

      hits.should.be.equal(1);
    });
  });

  describe("unsubscribe", function()
  {
    it("should cancel subscription for the specified topic", function()
    {
      var hits = 0;

      this.sb.subscribe('a').on('cancel', function() { ++hits; });

      this.sb.unsubscribe('a');

      hits.should.be.equal(1);
    });

    it("should cancel all subscriptions for the specified topic", function()
    {
      var actualTopics = [];

      function hitTopic(_, topic) { actualTopics.push(topic); }

      this.sb.subscribe('a', hitTopic);
      this.sb.subscribe('a', hitTopic);
      this.sb.subscribe('b', hitTopic);

      this.sb.unsubscribe('a');

      this.sb.publish('a');
      this.sb.publish('b');

      actualTopics.should.be.eql(['b']);
    });

    it("should not cancel any subscriptions from the parent broker", function()
    {
      var actual = [];

      this.mb.subscribe('a', function() { actual.push('mb'); });
      this.sb.subscribe('a', function() { actual.push('sb'); });

      this.sb.unsubscribe('a');
      this.sb.publish('a');

      actual.should.be.eql(['mb']);
    });
  });
});
