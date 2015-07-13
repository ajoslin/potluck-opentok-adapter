'use strict'

var tokbox = require('tokbox')
var EventEmitter = require('events').EventEmitter
var Peer = require('./peer')

var VIDEO_OPTIONS = require('./tok').VIDEO_OPTIONS

function throwErr (e) {
  throw new Error(e)
}

function TokboxAdapter (options) {
  EventEmitter.call(this)
  options = options || {}
  this.apiKey = options.apiKey || throwErr('Expected options.apiKey')
  this.sessionId = options.sessionId || throwErr('Expected options.sessionId')
  this.token = options.token || throwErr('Expected options.token')

  this.session = null
  this.publisher = null
  this.peers = {}
}

TokboxAdapter.prototype = Object.create(EventEmitter.prototype)
module.exports = TokboxAdapter

TokboxAdapter.prototype.onIncomingPeer = function (stream) {
  this.emit('peer.incoming', stream)
}

TokboxAdapter.prototype.connectPeer = function (stream, containerElement, callback) {
  if (!this.session) {
    this.connect()
  }
  var peer = new Peer(this.session, stream, containerElement)
  this.peers[stream.connection.connectionId] = peer

  var self = this
  peer.subscribe(function (err) {
    callback && callback(err)
    if (!err) {
      self.emit('peer.connected', peer)
    }
  })

  return peer
}

TokboxAdapter.prototype.connect = function (callback) {
  var self = this
  this.session = tokbox.initSession(this.apiKey, this.sessionId)
  this.session.connect(this.token, callback)

  this.session.on({
    streamDestroyed: function (ev) {
      var peerId = ev.stream.connection.connectionId
      var peer = self.peers[peerId]
      if (!peer) {
        return
      }
      peer.disconnect()
      self.emit('peer.disconnected', peer)
      delete self.peers[peerId]
    },
    sessionDisconnected: function (ev) {
      self.emit('disconnected')
    },
    sessionConnected: function (ev) {
      self.emit('connected')
    },
    streamCreated: function (ev) {
      self.onIncomingPeer(ev.stream)
    }
  })
}

TokboxAdapter.prototype.disconnect = function () {
  if (this.publisher) {
    this.publisher.off()
    this.publisher.destroy()
  }
  if (this.session) {
    this.session.disconnect()
  }
}

TokboxAdapter.prototype.publish = function (publishElement, callback) {
  if (!this.session) {
    this.connect()
  }
  var self = this
  this.publisher = tokbox.initPublisher(publishElement, VIDEO_OPTIONS, function (err) {
    callback && callback(err)
    if (!err) {
      // TODO add capabilities here
      self.session.publish(self.publisher)
    }
  })

  this.publisher.on({
    accessDialogOpened: function (ev) {
      self.emit('access.opened')
    },
    accessAllowed: function (ev) {
      self.emit('access.allowed')
    },
    accessDenied: function (ev) {
      self.emit('access.denied')
    },
    accessDialogClosed: function (ev) {
      self.emit('access.closed')
    }
  })
}
