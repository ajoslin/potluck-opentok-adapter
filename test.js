'use strict'

var test = require('tape')

var got = require('got')
var TokboxAdapter = require('./')

var credentials
test('setup', function (t) {
  t.plan(4)
  t.timeoutAfter(1000)
  got('/', function (_, data, res) {
    credentials = JSON.parse(data)
    t.ok(credentials)
    t.ok(credentials.apiKey)
    t.ok(credentials.sessionId)
    t.ok(credentials.token)
  })
})

test('initialize', { timeout: 500 }, function (t) {
  var publishEl = document.createElement('div')

  var adapter = new TokboxAdapter({
    apiKey: credentials.apiKey,
    sessionId: credentials.sessionId,
    token: credentials.token,
    publishElement: publishEl
  })

  t.ok(adapter.publish, 'has publish')
  t.ok(adapter.destroy, 'has destroy')
  t.ok(adapter.connectPeer, 'has connectpeer')

  // TODO figure out how to test access popup
  adapter.publish()
  adapter.on('access.opened', function () {
    t.end()
  })
})
