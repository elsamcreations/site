import { readFileSync, writeFileSync } from 'fs'
import { buildSync } from 'esbuild'

const result = buildSync({
  entryPoints: ['app/index.js'],
  outdir: 'public/assets',
  format: 'esm',
  bundle: true,
  minify: true,
  splitting: true,
})

const giveasheet = readFileSync('template/giveasheet.html', 'utf8')
const replaced = giveasheet.replace(
  /<!-- (.*)\[(.*)\](.*) -->\n(.*\n)/g,
  (_, open, path, close) => `${open}${readFileSync(path, 'utf8')}${close}`,
)

writeFileSync('public/giveasheet.html', replaced, 'utf8')
