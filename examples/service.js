const Service = require('../index')
const { RequestType, ResponseType, DeskType } = require('./types')

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
  'hands[0].size': 'comment for hands[0].size',
}

DeskType.__comments = {
  'height': 'the height of desk',
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
  baseUrl: '/api/v2',
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
        {
          name: 'Desk',
          description: 'description for desk\nbreak line for demo',
          method: 'get',
          baseUrl: '/api/v3',
          path: '/desk/:id',
          response: DeskType,
        },
      ],
    },
  ],
})

// service.mock()
// service.doc()
module.exports = service
