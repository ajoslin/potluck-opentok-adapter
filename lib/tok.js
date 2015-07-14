var cuid = require('cuid')

module.exports.VIDEO_OPTIONS = {
  // insertMode: 'append',
  width: '100%',
  height: '100%'
}

module.exports.getElementId = function (element) {
  var id = element.getAttribute('id')
  if (!id) {
    id = cuid()
    element.setAttribute('id', id)
  }
  return id
}
