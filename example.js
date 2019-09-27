const { Dict } = require('tyshemo')
const Service = require('./service')

const request = new Dict({
  name: String,
  age: Number,
})
request.__comments = {
  'name': 'comment for name',
  'age': 'comment for age',
}

const response = new Dict({
  name: String,
  age: Number,
  body: {
    head: Boolean,
    foot: Boolean,
  },
  hands: [
    {
      name: String,
      size: Number,
    },
  ],
})
response.__comments = {
  'body.head': 'comment for body.head',
  'hands': 'comment for hands',
  'hands[0]': 'comment for hands[0]',
  'hands[0].size': 'comment for hands[0].size'
}

const service = new Service({
  responseWrapper: (data) => {
    return {
      code: 0,
      data,
    }
  },
  errorWrapper: (error) => {
    return {
      code: 10000,
      error: msg,
      ...error,
    }
  },
  globalErrors: {
    10000: 'Database broken',
    10005: 'network error',
  },
  data: [
    {
      name: 'Default Group',
      items: [
        {
          name: 'Person',
          method: 'post',
          path: '/person/:id',
          request,
          response,
        },
      ],
    },
  ],
})

service.docup()
