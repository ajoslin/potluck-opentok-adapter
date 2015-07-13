'use strict'

var EventEmitter = require('events').EventEmitter
var VIDEO_OPTIONS = require('./tok').VIDEO_OPTIONS
var wr = require('winresize-event')

function Peer (session, stream, containerElement) {
  EventEmitter.call(this)
  this.stream = stream
  this.containerElement = containerElement
  this.session = session
  this.audio = stream.hasAudio
  this.video = stream.hasVideo
  this.listen()
}

Peer.prototype = Object.create(EventEmitter.prototype)
module.exports = Peer

Peer.prototype.listen = function () {
  this.onSignal = function (ev) {
    if (ev.type === 'signal:dimensionsChanged') {
      var dimensions = JSON.parse(ev.data)
      self.onRemoteDimensions(dimensions)
    }
  }
  this.session.on('signal', this.onSignal)

  // These listeners are defined here to keep them 'this-safe'
  var self = this
  this.onResize = function (dimensions) {
    self.emitLocalDimensions(dimensions)
  }
  wr.winResize.on(this.onResize)
  this.onResize()
};

Peer.prototype.emitLocalDimensions = function(dimensions) {
  dimensions || (dimensions = wr.getWinSize())
  this.session.signal({
    type: 'dimensionsChanged',
    to: this.stream.connection,
    data: JSON.stringify(dimensions)
  })
}

Peer.prototype.onRemoteDimensions = function (dimensions) {
  this.dimensions = dimensions
  this.emit('dimensionsChanged', dimensions)
}

Peer.prototype.subscribe = function (callback) {
  var self = this
  this.subscriber = this.session.subscribe(this.stream, this.containerElement, VIDEO_OPTIONS, function (err) {
    callback && callback(err)
    if (err) {
      return
    }
    self.emit('connected')
    self.subscriber.on({
      // TODO add destroyed event
      streamPropertyChanged: function (ev) {
        switch (ev.changedProperty) {
          case 'hasAudio':
            self.audio = ev.newValue
            self.emit('audioChanged', self.audio)
            break
          case 'hasVideo':
            self.video = ev.newValue
            self.emit('videoChanged', self.video)
            break
        }
        self.emit('changed')
      }
    })
  })
}

Peer.prototype.disconnect = function () {
  this.emit('disconnected')
  if (this.subscriber) {
    this.subscriber.off()
  }
  this.removeAllListeners()
  this.session.off('singal', this.onSignal)
  wr.winResize.removeListener(this.onResize)
}
