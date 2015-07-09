'use strict'

var EventEmitter = require('events').EventEmitter
var VIDEO_OPTIONS = require('./tok').VIDEO_OPTIONS

function Peer (tokSession, tokStream, containerElement) {
  EventEmitter.call(this)
  this.stream = tokStream
  this.containerElement = containerElement
  this.session = tokSession
  this.dimensions = tokStream.videoDimensions
  this.audio = tokStream.hasAudio
  this.video = tokStream.hasVideo
}

Peer.prototype = Object.create(EventEmitter.prototype)
module.exports = Peer

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
      tokStreamPropertyChanged: function (ev) {
        switch (ev.changedProperty) {
          case 'hasAudio':
            self.audio = ev.newValue
            self.emit('audio', ev.newValue, ev.oldValue)
            break
          case 'hasVideo':
            self.video = ev.newValue
            self.emit('video', ev.newValue, ev.oldValue)
            break
          case 'videoDimensions':
            self.dimensions = ev.newValue
            self.emit('dimensions', ev.newValue, ev.oldValue)
            break
        }
        self.emit('changed')
      }
    })
  })
}
