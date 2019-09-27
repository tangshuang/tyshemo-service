const { Dict, ifexist, String8, Int } = require('tyshemo')

const RequestType = new Dict({
  name: String8,
  age: Int,
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

module.exports = {
  RequestType,
  ResponseType,
}
