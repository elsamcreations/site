import { serve } from 'esbuild'

const server = await serve({ servedir: 'template' }, {
  entryPoints: ['app/index.js'],
  outdir: 'template/assets',
  bundle: true,
})

console.log(server)

// Call "stop" on the web server when you're done
// server.stop()
