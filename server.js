const express = require('express')
const trakt = require('./trakt')

const app = express()



app.get('/trakt/tv', trakt.tv)
app.get('/trakt/movie', trakt.movie)

if (module === require.main) {
    const server = app.listen(process.env.PORT || 8080, () => {
        console.log(`App listening on port ${server.address().port}`)
    })
}

module.exports = app
