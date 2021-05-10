import { spawn } from 'child_process'
import { once } from 'events'
import { readFile, writeFile, readdir, mkdir, stat, rm } from 'fs/promises'
import { basename, dirname } from 'path'

// npm i -g @squoosh/cli
// apt install libjpeg-progs # (install jpegtran for rotate)
// apt install build-essential # (install convert (imagemagick) for colors adjustement)

const resizeParams = {
  enabled: true,
  width: 1250,
  height: 1250,
  method: "lanczos3",
  fitMethod: "contain",
  premultiply: true,
  linearRGB: true,
}

const compressParams = {
  quality: 75,
  baseline: false,
  arithmetic: false,
  progressive: true,
  optimize_coding: true,
  smoothing: 0,
  color_space: 3,
  quant_table: 3,
  trellis_multipass: false,
  trellis_opt_zero: false,
  trellis_opt_table: false,
  trellis_loops: 1,
  auto_subsample: true,
  chroma_subsample: 2,
  separate_chroma_quality: false,
  chroma_quality: 75,
}

const spawner = cmd => async (args, options) => {
  const child = spawn(cmd, args, { stdio: 'ignore', ...options })
  const [code] = await once(child, 'close')
  if (!code) return
  console.log(cmd, ...args)
  throw Error(`${cmd}: fail (${code})`)
}

const convert = spawner('convert')
const squoosh = spawner('squoosh-cli')
const jpegtran = spawner('jpegtran')

const rotate = (filepath, deg) => jpegtran([
  '-rotate', deg,
  '-outfile', filepath,
  filepath,
])

const enhance = (filepath) => convert([
  '-modulate', '90,125',
  '-enhance',
  // '-equalize',
  // '-contrast-stretch', '1.0x5%',
  '-contrast',
  filepath,
  filepath,
])

const compress = (filepath, size) => squoosh([
  `-d${size}`,
  `--resize=${JSON.stringify({
    ...resizeParams,
    width: Number(size),
    height: Number(size),
  })}`,
  `--mozjpeg=${JSON.stringify(compressParams)}`,
  basename(filepath),
], { cwd: dirname(filepath) })

const root = process.env.COUETTE_DIR || '/tmp/couette'

const serveRequest = async (request) => {
  const url = new URL(`http://e${request.url}`)
  const params = Object.fromEntries(url.searchParams)
  console.log(request.method, url.pathname, params)

  switch (`${request.method}:${url.pathname}`) {

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
          const photos = content.filter(file => /\.(jpg|png)$/i.test(file))
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
      return new Response('CREATED\n', { status: 201 })
    }

    case 'POST:/info': {
      const body = await readBodyJSON(request)
      const sheet = body.sheet?.toLowerCase()
      await writeFile(`${root}/${sheet}/info.txt`, body.info, 'utf8')
      return new Response('CREATED\n', { status: 201 })
    }

    case 'GET:/photo': {
      const { size } = params
      if (!size)
        return new Response('Missing size', { status: 400 })

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
        await compress(source, size)
        return new Response(await readFile(target))
      }
    }

    case 'PATCH:/photo': {
      const { deg } = params
      if (!deg)
        return new Response('Missing deg', { status: 400 })

      const sheet = params.sheet?.toLowerCase()
      const filename = params.filename?.toLowerCase()
      // delete previously generated sizes
      // list all dirs
      const content = await readdir(`${root}/${sheet}`, { withFileTypes: true })
      const subdirs = content.filter(f => f.isDirectory())
      const deleteWork = subdirs
        .map(({ name }) => rm(`${root}/${sheet}/${name}/${filename}`, { force: true }))

      await rotate(`${root}/${sheet}/${filename}`, deg)
      await Promise.all(deleteWork)

      return new Response('ROTATED', { status: 201 })
    }

    case 'POST:/photo': {
      const { filename, sheet } = params
      if (!filename)
        return new Response('Missing filename', { status: 400 })
      const body = await readBody(request)
      const realname = `${sheet}/${filename}`
      await writeFile(`${root}/${realname.toLowerCase()}`, body)
      await enhance(`${root}/${realname.toLowerCase()}`)
      return new Response('CREATED', { status: 201 })
    }

    case 'DELETE:/photo': {
      const { filename, sheet } = params
      if (!filename)
        return new Response('Missing filename', { status: 400 })

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
    this.init = {status:200, ...init}
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

const server = await serve((req, res) => {
  serveRequest(req)
    .catch(err => {
      console.log(err)
      return new Response(err.stack, { status: 500 })
    })
    .then(
      ({body, init}) => {
        res.statusCode = init.status
        res.end(body)
      }
    )
})

server.listen(2096)
