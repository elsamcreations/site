export async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export async function readBodyJSON(req) {
  const buf = await readBody(req)
  return JSON.parse(buf.toString('utf8'))
}

export const fetch = (url, params = {}) => new Promise((resolve, reject) => {
  const { body, method =  body ? 'POST' : 'GET', ...options } = params
  const { host, pathname, search, hash } = new URL(url)
  const path = `${pathname}${search}${hash}`
  const req = https.request(
    { host, path, method, ...options },
    res => {
      if (res.statusCode === 200) return readBodyJSON(res).then(resolve, reject)
      if (res.statusCode < 299) return resolve(null)
      reject(new Error(res.statusMessage))
    }
  )

  req.on('error', reject)
  data && req.write(data)
  req.end()
})
