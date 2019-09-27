const Service = require('../index')
const { RequestType, ResponseType } = require('./types')

RequestType.__comments = {
  'name': 'comment for name',
  'age': [
    'comment for age',
    'the second line comment',
  ],
}

ResponseType.__comments = {
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
      error,
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
          method: 'get',
          path: '/person/:id',
          request: RequestType,
          response: ResponseType,
        },
      ],
    },
  ],
})

// service.mock()
service.doc()
