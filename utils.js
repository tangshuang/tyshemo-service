
const { parse, assign, isArray } = require('ts-fns')

function stringify(data, comments) {
  const stringify = (obj, parent = '', space = 0) => {
    if (isArray(obj)) {
      const items = obj.map((item, i) => {
        const spaceLen = space + 4
        const spaceStr = ' '.repeat(spaceLen)
        const myPath = path + '[' + i + ']'
        const myComment = parse(comments, path)
        if (item && typeof item === 'object') {
          return spaceStr + stringify(item, myPath, spaceLen) + ','
        }
        else {
          return spaceStr + item + ','
        }
      })

      const comment = parse(comments, path)

      let text = ' '.repeat(space) + '[' + (comment ? ' // ' + comment : '')
      text += items.json('\n')
      text += ' '.repeat(space) + ']'
      return text
    }
  }
}

module.exports = {
  stringify,
}
