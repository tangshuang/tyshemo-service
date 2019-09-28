TYSHEMO SERVICE
===============

This package is based on [TySheMo](https://github.com/tangshuang/tyshemo).
It can help you to serve up a mocker server and a doc server quickly with your types files.

## install

```
npm i tyshemo-service
```

## usage

```js
const Service = require('tyshemo-service')
const server = new Service(options)

server.mock() // serve up a mocker server
// server.doc() // serve up a doc server
```

## options

```
{
  // required
  data: {},

  // optionals
  baseUrl: string, // api base url
  requestWrapper: function, // to wrap request data in an object
  responseWrapper: function, // to wrap response data in an object
  errorWrapper: function, // to wrap error message in an object
  globalErrors: mapping, // mapping for error code and messages
  mockConfig: {}, // mocker config
  parseConfig: {}, // parser config
}
```

**config**

Read more from [here](https://www.tangshuang.net/7101.html#title-9).

**wrapper**

```js
function(responsData) {
  return {
    code: 0,
    data: responseData,
  }
}
```

**errors**

```js
{
  10001: 'database disconnected.',
}
```

**data**

To serve up, the most important information to pick from.

```
[ // group level, to group apis and show tree in doc
  {
    name: 'group name',
    items: [ // api item level
      {
        name: 'api name',
        description: 'api description',
        method: 'get', // lowercase, will be used by express to route
        path: '/path/:id', // concat with baseUrl, will be used by express to serve up mock server, show in doc page
        request: RequestType, // data type container which created by TySheMo
        response: ResponseType,
        error: any, // will be passed into errorWrapper
        errors: mapping, // merge with globalErrors
      },
    ],
  }
]
```

The most important is `request` and `response` options. The Type instances should be imported from which is shared with your project code.

## comments

You can set comments to your doc output. However, comments are not easy to write with your original code. The only way is to set a `__comments` property on the type instance.

```js
ResponseType.__comments = {
  'books[0].name': 'the name of a book',
  'books[0]': 'a book information',
  '__def__[2].def.size': 'a comment for some deep type', // this is not easy to understand
}
```

In fact, you should have to watch the output of doc while commenting.

## serve

When you invoke `server.doc()` or `server.mock()`, you can pass server config into these methods.

```js
server.doc({
  port: 9000,
  title: 'My App API DOC',
  description: '',
})
```

```js
server.mock({
  port: 9000,
})
```
