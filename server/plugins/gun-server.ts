const Gun = require('gun')
const express = require('express')
const app = express()

app.use(Gun.serve)

const server = app.listen(8765, () => {
  console.log('✅ GunDB peer running at http://localhost:8765/gun')
})

Gun({ web: server })
