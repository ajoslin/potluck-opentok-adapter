var apiKey = process.env.OPENTOK_API_KEY
var apiSecret = process.env.OPENTOK_API_SECRET

if (!apiKey) {
  throw new Error('process.env.OPENTOK_API_KEY required')
}
if (!apiSecret) {
  throw new Error('process.env.OPENTOK_API_SECRET required')
}

var express = require('express')
var Opentok = require('opentok')

var app = express()
var opentok = new Opentok(apiKey, apiSecret)

app.get('/', function (req, res) {
  opentok.createSession({
    mediaMode: 'routed'
  }, function (err, result) {
    if (err) {
      return res.sendStatus(500)
    }
    var sessionId = result.sessionId
    var token = opentok.generateToken(sessionId)
    res.json({
      apiKey: apiKey,
      sessionId: sessionId,
      token: token
    })
  })

})

var port = process.env.ZUUL_PORT || 3333
app.listen(port)
console.log('Listening on port', port)
