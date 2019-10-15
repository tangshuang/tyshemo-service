const { RequestType, ResponseType } = require('../app/types')

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

module.exports = {
  name: 'Person',
  method: 'post',
  path: '/person/:id',
  request: RequestType,
  response: ResponseType,
  test: [
    {
      frequency: 60000,
      name: '123',
      params: { id: 123 },
      request: { age: '10' },
    },
    {
      name: '111',
      params: { id: 111 },
    },
  ],
}
