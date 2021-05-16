import { serve } from 'esbuild'

const server = await serve({ servedir: 'public' }, {
  entryPoints: ['app/index.js'],
  outdir: 'public/assets',
  bundle: true,
})

console.log(server)

// Call "stop" on the web server when you're done
// server.stop()
