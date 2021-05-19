TYSHEMO SERVICE
===============

This package is based on [TySheMo](https://github.com/tangshuang/tyshemo).
It can help you to serve up a doc server, a mock server and a testing server quickly with your types files.

## Install

```
npm i tyshemo-service
```

## Usage

```js
const Service = require('tyshemo-service')
const server = new Service(options, configs)

server.mock() // serve up a mocker server
// server.doc() // serve up a doc server
```

## Options

```
{
  // required
  data: [],

  // optionals
  base: string, // api base url
  error: {
    code: 'error_code',
    error: 'error_message',
  },
  errorMapping: mapping, // mapping for error code and messages
}
```

**errorMapping**

```js
{
  10001: 'database disconnected.',
}
```

**data**

To serve up, the most important information to pick from.

```
data: [ // group level, to group apis and show tree in doc
  {
    name: 'group name',
    items: [ // api item level
      {
        name: 'api name',
        description: 'api description',
        method: 'get', // lowercase, will be used by express to route
        path: '/path/:id', // concat with basePath, will be used by express to serve up mock server, show in doc page

        request: {}, // json
        response: {}, // json

        // override global options
        base: '',
        error: {}

        // unit test
        test: [
          {
            frequency: 1000,
            // unit name
            name: '111',
            // replace params in `path`
            params: {
              id: '123',
            },
            // override request mocking
            request: {},
          }
        ],

        // override response mock data
        mock: {
          // use keyPath to override
          'data.body.some': 123,
        },
      },
    ],
  }
]
```

The most important is `request` and `response` options. The Type instances should be imported from which is shared with your project code.

## Configs

```js
const Service = require('tyshemo-service')
const server = new Service(options, configs)

server.mock(customMockConfig)
server.doc(customDocConfig)
server.test(customTestingConfig)
server.serve()
```

**configs**

```
{
  port: number, // used when invoke server.serve()
  // used when only invoke server.doc()
  doc?: {
    port: number,
    title: string, // used when invoke server.serve()
    description: string, // used when invoke server.serve()
    template: FileAbsPath, // used when invoke server.serve()
    root: string, // the root uri to visit default '/' // used when invoke server.serve()
  },
  // used when only invoke server.mock()
  mock?: {
    port: number,
    transformer: function, // you can modify mock data before it out // used when invoke server.serve()
  },
  // used when only invoke server.test()
  test?: {
    port: number,
    target: 'http://my.api.com', // the target api host to test // used when invoke server.serve()
    title: string, // used when invoke server.serve()
    description: string, // used when invoke server.serve()
    root: string, // defualt '/', '/_test' when serve // used when invoke server.serve()
    template: FileAbsPath, // used when invoke server.serve()
  },
}
```

When you invoke `server.doc()` or `server.mock()`, you can pass server config into these methods.

When you invoke `server.serve()`, the ports of doc, mock, test will not work

**template**

The `docTemplateFile` and `testTemplateFile` give your the ability to modify want you see in browser. You should look into [doc.html](./doc.html) and [test.html](./test.html).

The placeholder string `__TITLE__` `__DESCRIPTION__` and `__DATA__` can be used in your template.
