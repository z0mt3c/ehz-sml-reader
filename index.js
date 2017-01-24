const EventEmitter = require('events')
const SerialPort = require('serialport')
const Hoek = require('hoek')

const defaultOptions = {
  port: '/dev/ttyUSB0',
  portOptions: {
    baudrate: 9600,
    databits: 8,
    stopbits: 1,
    parity: 'none',
    buffersize: 2048
  },
  pattern: {
    total: { regex: new RegExp('070100010800.{24}(.{16})0177'), divisor: 10000 },
    t1: { regex: new RegExp('070100010801.{24}(.{8})0177'), divisor: 10000 },
    t2: { regex: new RegExp('070100010802.{24}(.{8})0177'), divisor: 10000 },
    w1: { regex: new RegExp('070100100700.{16}(.{8})0177'), divisor: 1 }
  },
  autoStart: true
}

class Reader extends EventEmitter {
  constructor (options) {
    super()
    this.options = Hoek.applyToDefaults(defaultOptions, options || {})

    if (!this.options.portOptions.parser) {
      this.options.portOptions.parser = SerialPort.parsers.readline('1b1b1b1b01010101', 'hex')
    }

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
    if (data.indexOf('760') !== 0) return
    var message = {}
    var hasKey = false
    Object.keys(this.options.pattern).forEach((key) => {
      const pattern = this.options.pattern[key]
      if (pattern.regex) {
        const match = data.match(pattern.regex)
        if (match) {
          let value = match[match.length - 1]
          value = parseInt(value, 16) / pattern.divisor
          message[key] = value
          hasKey = true
        }
      } else if (pattern.prefix) {
        const match = data.indexOf(pattern.prefix)
        if (match !== -1) {
          let value = data.substr(match + pattern.prefix.length + pattern.skip, pattern.parse)
          value = parseInt(value, 16) / pattern.divisor
          message[key] = value
          hasKey = true
        }
      }
    })

    if (hasKey) {
      this._lastMessage = message
      this.emit('data', message)
    }
  }

  _onError (error) {
    this.emit('error', error)
  }
}

module.exports = Reader
