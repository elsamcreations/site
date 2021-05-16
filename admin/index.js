import { spawn } from 'child_process'
import { once } from 'events'
import { readFile, writeFile, readdir, mkdir, stat, rm } from 'fs/promises'
import { basename, dirname } from 'path'
import sharp from 'sharp'

sharp.cache(false)

// ENV
const root = process.env.COUETTE_DIR || './couette'
const PWD = process.env.PWD || 'admin'

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

const couetteCache = {}
const serveRequest = async (request) => {
  const url = new URL(`http://e${request.url}`)
  const params = Object.fromEntries(url.searchParams)
  const slashPos = url.pathname.indexOf('/', 1)
  const pwd = url.pathname.slice(1, slashPos)
  if (request.method !== 'GET' && pwd !== PWD) {
    return new Response(null, { status: 403 })
  }

  console.log(request.method, url.pathname, params)
  switch (`${request.method}:${url.pathname.slice(slashPos)}`) {
    case 'GET:/':
      return new Response(await readFile(`./admin/index.html`))

    case 'GET:/couette': {
      const couettesList = await readdir(root, { withFileTypes: true })
        .catch(err => {
          if (err.code !== 'ENOENT') throw err
          return []
        })

      const couettesInfo = couettesList
        .filter(ent => ent.isDirectory())
        .map(async ({ name }) => {
          const sheetDir = `${root}/${name}`
          const { birthtimeMs: createdAt } = await stat(sheetDir)
          const content = await readdir(sheetDir)
          const images = content.filter(file => /\.jpg$/i.test(file))
          const stats = await Promise.all(images.map(async path => [
            path,
            (await stat(`${sheetDir}/${path}`)).mtimeMs,
          ]))
          const photos = stats.sort((a, b) => b[1] - a[1]).map(s => s[0])
          const info = content.includes('info.txt')
            ? await readFile(`${sheetDir}/info.txt`, 'utf8')
            : ''
          
          return { name, info, photos, createdAt }
        })

      return new Response(JSON.stringify(await Promise.all(couettesInfo)))
    }

    case 'POST:/couette': {
      const { sheet } = await readBodyJSON(request)
      await mkdir(`${root}/${sheet.toLowerCase()}`, { recursive: true })
      return new Response(null, { status: 201 })
    }

    case 'POST:/info': {
      const body = await readBodyJSON(request)
      const sheet = body.sheet?.toLowerCase()
      await writeFile(`${root}/${sheet}/info.txt`, body.info, 'utf8')
      return new Response(null, { status: 201 })
    }

    case 'GET:/photo': {
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
        return new Response(
          `${url.pathname}?${url.searchParams} Not found`,
          { status: 404 },
        )
      }

      try {
        return new Response(await readFile(target))
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
        await (couetteCache[target] ||
          (couetteCache[target] = compress(source, size, target)))
        return new Response(await readFile(target))
      }
    }

    case 'PATCH:/photo': {
      const { deg } = params
      if (!deg) return new Response('Missing deg', { status: 400 })

      const sheet = params.sheet?.toLowerCase()
      const filename = params.filename?.toLowerCase()
      // delete previously generated sizes
      // list all dirs
      const content = await readdir(`${root}/${sheet}`, { withFileTypes: true })
      const subdirs = content.filter(f => f.isDirectory())
      const subrotate = subdirs
        .map(({ name }) => rotate(`${root}/${sheet}/${name}/${filename}`, deg))

      await rotate(`${root}/${sheet}/${filename}`, deg)
      await Promise.all(subrotate)

      return new Response(null, { status: 201 })
    }

    case 'POST:/photo': {
      const { filename, sheet } = params
      if (!filename) return new Response('Missing filename', { status: 400 })
      const body = await readBody(request)
      const realname = `${sheet}/${filename}`
      await writeFile(`${root}/${realname.toLowerCase()}`, body)
      return new Response(null, { status: 201 })
    }

    case 'DELETE:/photo': {
      const { filename, sheet } = params
      if (!filename) return new Response('Missing filename', { status: 400 })

      const sheetDir = `${root}/${sheet.toLowerCase()}`
      const content = await readdir(sheetDir, { withFileTypes: true })
      const subdirs = content.filter(f => f.isDirectory())
      const deleteWork = subdirs
        .map(({ name }) => rm(`${sheetDir}/${name}/${filename.toLowerCase()}`, { force: true }))
      
      await rm(`${sheetDir}/${filename.toLowerCase()}`, { force: true })
      await Promise.all(deleteWork)

      return new Response(null, { status: 204 })
    }

    default:
      return new Response(`${url.pathname} Not found`, { status: 404 })
  }
}

class Response {
  constructor(body, init) {
    this.body = body
    this.init = { status: 200, ...init }
  }
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function readBodyJSON(req) {
  const buf = await readBody(req)
  return JSON.parse(buf.toString('utf8'))
}

const serve = async fn => {
  const cert = await readFile('/etc/oct.ovh.crt').catch(err => err)
  if (cert instanceof Error) {
    if (cert.code !== 'ENOENT') throw cert
    const { createServer } = await import('http')
    return createServer(fn)
  }

  const { createServer } = await import('https')
  return createServer({ cert, key: await readFile('/etc/oct.ovh.key') }, fn)
}

const server = await serve(async (req, res) => {
  const { body, init } = await serveRequest(req).catch(err => {
    console.log(err)
    return new Response(err.stack, { status: 500 })
  })
  res.statusCode = init.status
  res.end(body)
})

server.listen(2096)
