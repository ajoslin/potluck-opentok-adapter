'use strict'

var opentok = require('opentok')
var EventEmitter = require('events').EventEmitter

var _apiKey = '45258342'
var _sessionId = '1_MX40NTI1ODM0Mn5-MTQzNjMxOTU5OTc2OX4yc2h1a3g2VEFsWCtkcmp4N2Zidnh1ZTR-fg'
var _token = 'T1==cGFydG5lcl9pZD00NTI1ODM0MiZzaWc9NWJkZmIxMzFjYTdmYTA2MzRjNDlhMDU0YWJiZmE1MmNkNDU1YjI5MTpzZXNzaW9uX2lkPTFfTVg0ME5USTFPRE0wTW41LU1UUXpOak14T1RVNU9UYzJPWDR5YzJoMWEzZzJWRUZzV0N0a2NtcDROMlppZG5oMVpUUi1mZyZjcmVhdGVfdGltZT0xNDM2MzE5NjAwJm5vbmNlPTAuOTgxNzUxOTQ1NTY4MjQ4NiZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNDM2NDA2MDAw'

var OPENTOK_VIDEO_OPTIONS = {
  insertMode: 'append',
  width: '100%',
  height: '100%'
}

function throwErr (e) {
  throw new Error(e)
}

module.exports = function (options) {
  options = options || {}
  var apiKey = options.apiKey || _apiKey || throwErr('Expected options.apiKey')
  var sessionId = options.sessionId || _sessionId || throwErr('Expected options.sessionId')
  var token = options.token || _token || throwErr('Expected options.token')
  var publishElement = options.publishElement || throwErr('Expected options.publishElement as an element')

  var events = new EventEmitter()
  var session
  var publisher
  var peers = {}

  session = opentok.initSession(apiKey, sessionId, function (err) {
    if (err) {
      return events.emit('connectionError', err)
    }
    session.connect(token)
    session.on({
      streamCreated: function (ev) {
        events.emit('streamConnected', ev.stream)
      },
      streamDestroyed: function (ev) {
        var peerId = ev.stream.connection.connectionId
        var peer = peers[peerId]
        if (!peer) {
          return
        }
        peer.events.emit('disconnected')
        peer.events.removeAllListeners()
        events.emit('peer.disconnected', peer)
        delete peers[peerId]
      },
      sessionDisconnected: function (ev) {
        events.emit('disconnected')
      },
      sessionConnected: function (ev) {
        events.emit('connected')
      }
    })
  })

  return {
    events: events,

    publishVideo: function (callback) {
      publisher = opentok.initPublisher(publishElement, OPENTOK_VIDEO_OPTIONS, function (err) {
        callback(err)
        if (!err) {
          // TODO add capabilities here
          events.emit('published')
        }
      })
      publisher.on({
        accessDialogOpened: function (ev) {
          events.emit('access.opened')
        },
        accessAllowed: function (ev) {
          events.emit('access.allowed')
        },
        accessDenied: function (ev) {
          events.emit('access.denied')
        },
        accessDialogClosed: function (ev) {
          events.emit('access.closed')
        }
      })
    },

    destroy: function () {
      if (publisher) {
        publisher.off()
        publisher.destroy()
      }
      session.disconnect()
    },

    connectPeer: function (tokboxStream, containerElement) {
      var peer = createPeer(session, tokboxStream, containerElement)
      peers[tokboxStream.connection.connectionId] = peer
      events.emit('peer.connected', peer)

      return peer
    }
  }

}

function createPeer (session, stream, container) {
  var events = new EventEmitter()
  var tokSubscriber = session.subscribe(stream, container, OPENTOK_VIDEO_OPTIONS)

  var peer = {
    events: events,
    dimensions: stream.videoDimensions,
    audio: stream.hasAudio,
    video: stream.hasVideo
  }

  tokSubscriber.on({
    streamPropertyChanged: function (ev) {
      switch (ev.changedProperty) {
        case 'hasAudio':
          peer.audio = ev.newValue
          events.emit('audio', ev.newValue, ev.oldValue)
          break
        case 'hasVideo':
          peer.video = ev.newValue
          events.emit('video', ev.newValue, ev.oldValue)
          break
        case 'videoDimensions':
          peer.dimensions = ev.newValue
          events.emit('dimensions', ev.newValue, ev.oldValue)
          break
      }
    }
  })

  return peer
}
