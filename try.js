const Reader = require('./index.js')

new Reader({ port: '/dev/ttyUSB0' }).on('data', (msg) => console.log('0:', msg))
// new Reader({ port: '/dev/ttyUSB1' }).on('data', (msg) => console.log('1:', msg))
