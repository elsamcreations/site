import { serve } from 'esbuild'

const server = await serve({ servedir: 'template' }, {
  entryPoints: ['app/index.js'],
  outdir: 'template/assets',
  bundle: true,
})

console.log(server)

process.env.MAILJET_PASSWORD || process.env.MAILJET_PASSWORD = 'a9aa710695311223f313c3a1012a5d64')
process.env.ADMIN_PORT || (process.env.ADMIN_PORT = 4242)

await import('../admin/index.js')
