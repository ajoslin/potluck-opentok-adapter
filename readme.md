# potluck-opentok-adapter

- Coordinates a [potluck](https://github.com/eaze/potluck) video session.

### Compatibility

- potluck-tokbox-adapter is **only** guaranteed to be compatible with the included version of opentok (in `vendor/opentok.js`),
  and [cordova-plugin-opentok@9f863b6](https://github.com/songz/cordova-plugin-opentok/tree/9f863b60a532ed3dd272a32f5ad7694cb3a4e63f).
- In the Cordova build, signals don't work. At all. Keep that in mind.

### Running tests

- `npm install`
- `npm install --global zuul`
- `npm test`
