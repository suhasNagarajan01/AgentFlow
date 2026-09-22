import { spawn } from 'node:child_process'

const port = process.env.PORT || '8443'

const child = process.platform === 'win32'
  ? spawn('cmd.exe', ['/c', `npx vite --host 0.0.0.0 --port ${port}`], { stdio: 'inherit' })
  : spawn('npx', ['vite', '--host', '0.0.0.0', '--port', port], { stdio: 'inherit' })

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
