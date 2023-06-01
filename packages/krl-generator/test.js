const _ = require('lodash')
const fs = require('fs')
const generator = require('./')
const parser = require('krl-parser')
const path = require('path')
const test = require('ava')

const filesDir = path.resolve(__dirname, '../../test-rulesets')

test('generator', async function (t) {
  const files = await fs.promises.readdir(filesDir)

  for (const file of files) {
    if (!/\.krl$/.test(file)) {
      continue
    }
    let src = await fs.promises.readFile(path.resolve(filesDir, file), 'utf8')
    src = src.replace(/\r\n?/g, '\n')
    const expected = _.filter(src.split('\n'), function (line) {
      return line.trim().indexOf('//') !== 0
    }).join('\n').trim()

    const out = generator(parser(src, { filename: file }))

    t.is(expected, out, file)
  }
})
