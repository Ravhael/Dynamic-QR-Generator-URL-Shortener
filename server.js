const { createServer } = require('http')
const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res)
    }).listen(port, (err) => {
      if (err) throw err
      console.log(`> Next server listening on port ${port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to start Next server', err)
    process.exit(1)
  })
