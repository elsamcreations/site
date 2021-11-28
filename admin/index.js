import { spawn } from 'child_process'
import { once } from 'events'
import { readFile, writeFile, readdir, mkdir, stat, rm } from 'fs/promises'
import { basename, dirname } from 'path'

import sharp from 'sharp'

import { readBodyJSON, readBody, normalize } from './utils.js'
import { submitOrder, confirmQuote } from './mailjet.js'

sharp.cache(false)

// ENV
const root = process.env.COUETTE_DIR || './couette'
const PWD = process.env.SECRET_PATH || 'admin'
await mkdir(`${root}/orders`, { recursive: true })

const rotate = async (filepath, deg) => {
  const buff = await sharp(filepath).rotate(Number(deg)).toBuffer()
  await writeFile(filepath, buff)
}

const compress = async (filepath, size, target) => {
  await mkdir(dirname(target), { recursive: true })
  await sharp(filepath)
    .resize(Number(size), Number(size))
    .normalize()
    .jpeg({ quality: 75, mozjpeg: true })
    .toFile(target)
}

const HEADERS = (headers) => ({ headers })
const STATIC = HEADERS({
  'Cache-Control': 'public, max-age=86400, stale-while-revalidate=300',
})

const CORS = HEADERS({
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=300',
})

const couetteCache = {}
const serveRequest = async (request) => {
  const url = new URL(`http://e${request.url}`)
  const key = `${request.method}:${url.pathname}`
  const route = handlers[key]
  if (!route) return new Response(`${url.pathname} Not found`, { status: 404 })

  const isAdmin = url.pathname.startsWith('/admin/')
  if (isAdmin && request.headers.authorization !== PWD) {
    return new Response(`${url.pathname} Unauthorized`, { status: 401 })
  }

  const params = Object.fromEntries(url.searchParams)
  console.log(`${request.method}:${url.pathname}`, params)
  return route({ request, params, url })
}

const handlers = {}
handlers['GET:/'] = async () => {
  const body = Object.fromEntries(
    Object.entries(handlers).map(([k, v]) => {
      const [method, path] = k.split(':')
      return [path, { method, code: String(v) }]
    }),
  )
  return new Response(JSON.stringify(body, null, 2), { status: 200, ...CORS })
}

handlers['GET:/admin'] = async () =>
  new Response(await readFile(`./admin/index.html`), STATIC)

handlers['GET:/order'] = async ({ params }) => {
  const { order } = params
  if (!order) return new Response('Missing order', { status: 400 })
  return new Response(await readFile(`${root}/orders/${order}.json`), STATIC)
}

handlers['POST:/order'] = async ({ request }) => {
  const order = await readBodyJSON(request)
  if (!order?.email) return new Response('Missing email', { status: 400 })
  order.id = `${Date.now()}_${normalize(order.email)}`
  await writeFile(`${root}/orders/${order.id}.json`, JSON.stringify(order), 'utf8')
  await submitOrder(order)
  return new Response(null, { status: 204, ...CORS })
}

handlers['GET:/confirm'] = async ({ params }) => {
  const json = await readFile(`${root}/orders/${params.id}.json`, 'utf8')
  await confirmQuote(JSON.parse(json))
  const location = `https://elsamcreations.com/giveasheet?order=${params.id}`
  return new Response(null, { status: 303, headers: { location } })
}

const getAllCouettes = async () => {
  const couettesList = await readdir(root, { withFileTypes: true }).catch(
    (err) => {
      if (err.code !== 'ENOENT') throw err
      return []
    },
  )

  const couettesInfo = couettesList
    .filter((ent) => ent.isDirectory() && ent.name !== 'orders')
    .map(async ({ name }) => {
      const sheetDir = `${root}/${name}`
      const { birthtimeMs: createdAt } = await stat(sheetDir)
      const content = await readdir(sheetDir)
      const images = content.filter((file) => /\.jpg$/i.test(file))
      const stats = await Promise.all(
        images.map(async (path) => [
          path,
          (await stat(`${sheetDir}/${path}`)).mtimeMs,
        ]),
      )
      const photos = stats.sort((a, b) => b[1] - a[1]).map((s) => s[0])
      const info = content.includes('info.txt')
        ? await readFile(`${sheetDir}/info.txt`, 'utf8')
        : ''

      return { name, info, photos, createdAt }
    })

  return Promise.all(couettesInfo)
}

handlers['GET:/couette'] = async () => {
  const body = JSON.stringify(await getAllCouettes())
  return new Response(body, CORS)
}

handlers['GET:/admin/couette'] = async () => {
  const body = JSON.stringify(await getAllCouettes())
  return new Response(body)
}

handlers['POST:/admin/couette'] = async ({ request }) => {
  const { sheet } = await readBodyJSON(request)
  await mkdir(`${root}/${normalize(sheet)}`, { recursive: true })
  return new Response(null, { status: 201 })
}

handlers['POST:/admin/info'] = async ({ request }) => {
  const body = await readBodyJSON(request)
  const sheet = body.sheet?.toLowerCase()
  await writeFile(`${root}/${sheet}/info.txt`, body.info, 'utf8')
  return new Response(null, { status: 201 })
}

handlers['GET:/photo'] = async ({ url, params }) => {
  const { size } = params
  if (!size) return new Response('Missing size', { status: 400 })

  const sheet = params.sheet?.toLowerCase()
  const filename = params.filename?.toLowerCase()
  const source = `${root}/${sheet}/${filename}`
  const target = `${root}/${sheet}/${size}/${filename}`

  try {
    await stat(source)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return new Response(`${url.pathname}?${url.searchParams} Not found`, {
      status: 404,
    })
  }

  try {
    return new Response(await readFile(target), STATIC)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    await (couetteCache[target] ||
      (couetteCache[target] = compress(source, size, target).finally(
        () => (couetteCache[target] = undefined),
      )))
    return new Response(await readFile(target), STATIC)
  }
}

handlers['PATCH:/admin/photo'] = async ({ params }) => {
  const { deg } = params
  if (!deg) return new Response('Missing deg', { status: 400 })

  const sheet = params.sheet?.toLowerCase()
  if (!sheet || sheet === 'order') {
    return new Response('Invalid Sheet', { status: 400 })
  }

  const filename = params.filename?.toLowerCase()
  // delete previously generated sizes
  // list all dirs
  const content = await readdir(`${root}/${sheet}`, { withFileTypes: true })
  const subdirs = content.filter((f) => f.isDirectory())
  const subrotate = subdirs.map(({ name }) =>
    rotate(`${root}/${sheet}/${name}/${filename}`, deg),
  )

  await rotate(`${root}/${sheet}/${filename}`, deg)
  await Promise.all(subrotate)

  return new Response(null, { status: 201 })
}

handlers['POST:/admin/photo'] = async ({ request, params }) => {
  const { filename, sheet } = params
  if (!filename) return new Response('Missing filename', { status: 400 })
  if (!sheet || sheet === 'order') {
    return new Response('Invalid Sheet', { status: 400 })
  }
  const body = await readBody(request)
  const realname = `${sheet}/${filename}`
  await writeFile(`${root}/${realname.toLowerCase()}`, body)
  return new Response(null, { status: 201 })
}

handlers['DELETE:/admin/photo'] = async ({ params }) => {
  const { filename, sheet } = params
  if (!filename) return new Response('Missing filename', { status: 400 })
  if (!sheet || sheet === 'order') {
    return new Response('Invalid Sheet', { status: 400 })
  }
  const sheetDir = `${root}/${sheet.toLowerCase()}`
  const content = await readdir(sheetDir, { withFileTypes: true })
  const subdirs = content.filter((f) => f.isDirectory())
  const deleteWork = subdirs.map(({ name }) =>
    rm(`${sheetDir}/${name}/${filename.toLowerCase()}`, { force: true }),
  )

  await rm(`${sheetDir}/${filename.toLowerCase()}`, { force: true })
  await Promise.all(deleteWork)

  return new Response(null, { status: 204 })
}

class Response {
  constructor(body, init) {
    this.body = body
    this.init = { status: 200, ...init }
  }
}

const serve = async (fn) => {
  const cert = await readFile('/etc/elsamcreations.crt').catch((err) => err)
  if (cert instanceof Error) {
    if (cert.code !== 'ENOENT') throw cert
    const { createServer } = await import('http')
    return createServer(fn)
  }

  const { createServer } = await import('https')
  return createServer(
    { cert, key: await readFile('/etc/elsamcreations.key') },
    fn,
  )
}

const server = await serve(async (req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(204, STATIC)
    res.end(null)
    return
  }
  const { body, init } = await serveRequest(req).catch((err) => {
    console.log(err)
    return new Response(err.stack, { status: 500 })
  })

  res.writeHead(init.status, init.headers)
  res.end(body)
})

server.listen(process.env.ADMIN_PORT || 443)
