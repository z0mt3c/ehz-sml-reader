# ehz-sml-reader
EHZ SML parser/reader to be used with IR opto heads (tested with ehz ISKRA MT681)

## Usage

```
new Reader({ port: '/dev/ttyUSB0' })
  .on('data', (msg) => console.log('0:', msg)) // e.g. msg = { total: 123.1234, t1: 123.1234, t2: 0 }
  .on('error', (msg) => console.log('0:', msg))
```

## Default options

```
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
```