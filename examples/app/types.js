const { Dict, ifexist, String8, Int, Numeric } = require('tyshemo-x')

const RequestType = new Dict({
  name: String8,
  age: Numeric,
})

const ResponseType = new Dict({
  name: String8,
  age: ifexist(Int),
  body: {
    head: Boolean,
    foot: Boolean,
  },
  hands: [
    {
      name: String8,
      size: Number,
    },
  ],
})

const DeskType = new Dict({
  size: Number,
  height: Number,
  num: String8,
  books: [
    {
      name: String,
      price: Number,
    },
  ],
})

module.exports = {
  RequestType,
  ResponseType,
  DeskType,
}
