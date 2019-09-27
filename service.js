const { Mocker } = require('tyshemo/dist/mocker')
const { Parser } = require('tyshemo/dist/parser')
const express = require('express')
const { Ty } = require('tyshemo')
const fs = require('fs')
const path = require('path')
const { stringify } = require('./utils')

class Service {
  constructor(options = {}) {
    const { data, mockConfig, parseConfig } = options
    this.data = data
    this.mocker = new Mocker(mockConfig)
    this.parser = new Parser(parseConfig)
    this.options = options
  }

  mockup() {
    const app = express()
    const router = express.Router()

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    const items = []
    this.data.forEach((group) => {
      items.push(...group.items)
    })

    const { responseWrapper, errorWrapper, requestWrapper, mockServerConfig = {}, baseUrl = '/' } = this.options
    const { port = '8088' } = mockServerConfig
    const wrapper = (data) => responseWrapper ? responseWrapper(data) : data

    items.forEach((item) => {
      const { method, path, request, response } = item

      router[method](path, (req, res, next) => {
        // check req data
        if (request) {
          const reqdata = method === 'get' ? req.query : req.body
          const getdata = requestWrapper ? requestWrapper(reqdata) : reqdata
          const error = Ty.catch(getdata).by(request)
          if (error) {
            const msg = errorWrapper ? errorWrapper(error.message) : error.message
            res.status(499)
            res.end(msg)
            return
          }
        }

        // give mock data for response
        const mockdata = this.mocker.mock(response)
        const resdata = wrapper(mockdata)
        res.json(resdata)
      })
    })

    app.use(baseUrl, router)
    app.listen(port)
  }

  docup() {
    const { responseWrapper, errorWrapper, globalErrors = {}, requestWrapper, docServerConfig = {}, baseUrl = '' } = this.options
    const { port = '8088', title = 'TySheMo', description = 'This is an api doc generated by TySheMo.' } = docServerConfig

    const data = this.data.map((group) => {
      const { items } = group
      return {
        ...group,
        items: items.map((item) => {
          const { request, response, error, errors = {} } = item

          const requestDesc = request && this.parser.describe(requestWrapper ? requestWrapper(request) : request)
          const responseDesc = response && this.parser.describe(responseWrapper ? responseWrapper(response) : response)
          const errorDesc = error ? errorWrapper ? errorWrapper(error) : error : null

          const requestComments = request ? request.__comments : null
          const responseComments = response ? response.__comments : null
          const errorsMapping = {
            ...globalErrors,
            ...errors,
          }

          return {
            ...item,
            request: stringify(requestDesc, requestComments),
            response: stringify(responseDesc, responseComments),
            error: stringify(errorDesc),
            errors: errorsMapping,
          }
        }),
      }
    })

    const app = express()

    app.use('*', (req, res) => {
      fs.readFile(path.resolve(__dirname, 'index.html'), (error, buffer) => {
        let text = buffer.toString()
        text = text.replace(/__TITLE__/g, title)
        text = text.replace(/__DESCRIPTION__/g, description)
        const output = {
          baseUrl,
          data,
        }
        const html = text.replace('__DATA__', JSON.stringify(output, null, 4))
        res.type('html')
        res.send(html)
      })
    })
    app.listen(port)
  }
}

module.exports = Service
