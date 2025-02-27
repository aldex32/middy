import BusBoy from 'busboy'
import { createError } from '@middy/util'

const mimePattern = /^multipart\/form-data(;.*)?$/
const fieldnamePattern = /(.+)\[(.*)]$/

const defaults = {
  // busboy options as per documentation: https://www.npmjs.com/package/busboy#busboy-methods
  busboy: {}
}

const httpMultipartBodyParserMiddleware = (opts = {}) => {
  const options = { ...defaults, ...opts }

  const httpMultipartBodyParserMiddlewareBefore = async (request) => {
    const { headers } = request.event

    const contentType = headers['Content-Type'] ?? headers['content-type']

    if (!mimePattern.test(contentType)) return

    return parseMultipartData(request.event, options.busboy)
      .then((multipartData) => {
        request.event.body = multipartData
      })
      .catch((cause) => {
        // UnprocessableEntity
        // throw createError(422, 'Invalid or malformed multipart/form-data was provided', { cause })
        const error = createError(422, 'Invalid or malformed multipart/form-data was provided')
        error.cause = cause
        throw error
      })
  }

  return {
    before: httpMultipartBodyParserMiddlewareBefore
  }
}

const parseMultipartData = (event, options) => {
  const multipartData = {}
  // header must be lowercase (content-type)
  const busboy = BusBoy({ ...options, headers: { 'content-type': event.headers['Content-Type'] ?? event.headers['content-type'] } })

  return new Promise((resolve, reject) => {
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const attachment = {
        filename,
        mimetype,
        encoding
      }

      const chunks = []

      file.on('data', (data) => {
        chunks.push(data)
      })
      file.on('end', () => {
        attachment.truncated = file.truncated
        attachment.content = Buffer.concat(chunks)
        if (!multipartData[fieldname]) {
          multipartData[fieldname] = attachment
        } else {
          const current = multipartData[fieldname]
          multipartData[fieldname] = [attachment].concat(current)
        }
      })
    })
      .on('field', (fieldname, value) => {
        const matches = fieldname.match(fieldnamePattern)
        if (!matches) {
          multipartData[fieldname] = value
        } else {
          if (!multipartData[matches[1]]) {
            multipartData[matches[1]] = []
          }
          multipartData[matches[1]].push(value)
        }
      })
      .on('close', () => resolve(multipartData))
      .on('error', (e) => reject(e))

    busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
    busboy.end()
  })
}
export default httpMultipartBodyParserMiddleware
