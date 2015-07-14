/* global OT */
'use strict'

var window = require('global/window')
var EventEmitter = require('events').EventEmitter
var Peer = require('./peer')
var log = require('debug')('potluck')

var VIDEO_OPTIONS = require('./tok').VIDEO_OPTIONS
var getElementId = require('./tok').getElementId

function throwErr (e) {
  throw new Error(e)
}

function OpentokAdapter (options) {
  EventEmitter.call(this)
  options = options || {}
  this.apiKey = options.apiKey || throwErr('Expected options.apiKey')
  this.sessionId = options.sessionId || throwErr('Expected options.sessionId')
  this.token = options.token || throwErr('Expected options.token')

  this.session = null
  this.publisher = null
  this.peers = {}
}

OpentokAdapter.prototype = Object.create(EventEmitter.prototype)
module.exports = OpentokAdapter

OpentokAdapter.prototype.onIncomingPeer = function (stream) {
  this.emit('peer.incoming', stream)
}

OpentokAdapter.prototype.connectPeer = function (stream, containerElement, callback) {
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

OpentokAdapter.prototype.connect = function (publishElement) {
  var self = this
  this.session = window.OT.initSession(this.apiKey, this.sessionId)
  this.session.connect(this.token)
  this.publish(publishElement)

  this.session.on({
    connectionCreated: function (ev) {
      self.emit('connectionCreated', ev)
    },
    connectionDestroyed: function (ev) {
      log('connectionDestroyed', ev)
      var peerId = ev.connection.connectionId
      var peer = self.peers[peerId]
      if (!peer) {
        return
      }
      peer.disconnect()
      self.emit('peer.disconnected', peer)
      delete self.peers[peerId]
    },
    sessionDisconnected: function (ev) {
      log('sessionDisconnected', ev)
      self.emit('disconnected')
    },
    sessionConnected: function (ev) {
      self.session.publish(self.publisher)
      log('sessionConnected', ev)
      self.emit('connected')
    },
    streamCreated: function (ev) {
      log('streamCreated', ev)
      self.onIncomingPeer(ev.stream)
    }
  })
}

OpentokAdapter.prototype.disconnect = function () {
  if (this.publisher) {
    this.publisher.off()
    this.publisher.destroy()
  }
  if (this.session) {
    this.session.disconnect()
  }
}

OpentokAdapter.prototype.publish = function (publishElement) {
  if (!this.session) {
    this.connect()
  }
  var self = this
  // API is split between cordova and browser versions
  if (window.cordova) {
    this.publisher = window.OT.initPublisher(this.apiKey, getElementId(publishElement), VIDEO_OPTIONS)
  } else {
    this.publisher = window.OT.initPublisher(getElementId(publishElement), VIDEO_OPTIONS)
  }

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
