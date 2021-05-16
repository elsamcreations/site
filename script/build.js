import { readFileSync, writeFileSync } from 'fs'
import { build } from 'esbuild'

const result = await build({
  entryPoints: ['app/index.js'],
  outdir: 'public/assets',
  format: 'esm',
  bundle: true,
  minify: true,
  splitting: true,
})

const index = readFileSync('template/index.html', 'utf8')
const replaced = index.replace(
  /<!-- (.*)\[(.*)\](.*) -->/g,
  (_, open, path, close) => `${open}${readFileSync(path, 'utf8')}${close}`,
)

writeFileSync('public/index.html', replaced, 'utf8')
