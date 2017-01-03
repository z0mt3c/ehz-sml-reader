const EventEmitter = require('events')
const SerialPort = require('serialport')
const Hoek = require('hoek')
const _ = require('lodash')

const defaultOptions = {
  port: '/dev/ttyUSB0',
  portOptions: {
    baudrate: 9600,
    databits: 8,
    stopbits: 1,
    parity: 'none',
    buffersize: 2048,
    parser: SerialPort.parsers.raw
  },
  pattern: {
    message: new RegExp('1b1b1b1b01010101.*1b1b1b1b.{8}'),
    params: {
      total: new RegExp('070100010800.{24}(.{16})0177'),
      t1: new RegExp('070100010801.{24}(.{8})0177'),
      t2: new RegExp('070100010802.{24}(.{8})0177')
    }
  },
  maxChunkSize: 4096,
  autoStart: true
}

class Reader extends EventEmitter {
  constructor (options) {
    super()
    this.options = Hoek.applyToDefaults(defaultOptions, options || {})
    if (this.options.autoStart) this.start()
  }

  start () {
    this._chunk = ''
    this._port = new SerialPort(this.options.port, this.options.portOptions)
    this._port.on('data', this._onData.bind(this))
    this._port.on('error', this._onError.bind(this))
  }

  stop () {
    this._port.stop()
  }

  _onData (data) {
    // Avoid leaks
    if (this._chunk.length > this.options.maxChunkSize) {
      console.warn('Chunk length too large - reset')
      this._chunk = ''
    }

    var chunk = this._chunk += data.toString('hex')

    if (chunk.match(this.options.pattern.message)) {
      var message = {}
      _.each(this.options.pattern.params, function (regex, key) {
        var match = chunk.match(regex)
        if (match) {
          var value = _.last(match)
          value = parseInt(value, 16) / 10000
          message[key] = value
        }
      })

      this._lastMessage = message
      this.emit('data', message)
      this._chunk = ''
    } else {
      // message incomplete
    }
  }

  _onError (error) {
    this.emit('error', error)
  }
}

module.exports = Reader
