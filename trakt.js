const https = require('https')
const { parseString } = require('xml2js')
const _ = require("underscore")
const GIFEncoder = require('gifencoder')
const { createCanvas } = require('canvas')

const traktHost = 'trakt.tv'
const tvRssUrl = '/calendars/my/shows.atom?slurm=d42fdbd5e85ab6ee860fdc3c5e361ce4'
const movieRssUrl = '/calendars/my/movies.atom?slurm=d42fdbd5e85ab6ee860fdc3c5e361ce4'

const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
]

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]

function getXml(url, callback) {
    let responseXml = ''
    let options = {
        hostname: traktHost,
        port: 443,
        path: url,
        method: 'GET'
    }

    let req = https.request(options, (res) => {
        res.on('data', (chunk) => {
            responseXml += chunk
        })
        res.on('end', () => {
            if (callback)
                callback(responseXml)
        })
    })

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`)
    })
    
    req.end()

    return responseXml
}

function addTvText(ctx, entry, top) {
    ctx.fillText(`${entry.day} ${entry.hour}:${entry.minute} ${entry.ampm}`, 20, top + 60)
    ctx.fillText(entry.title, 20, top + 120)
}

function addMovieText(ctx, entry, top) {
    ctx.fillText(`${entry.month} ${entry.day} ${entry.year}`, 20, top + 60)
    ctx.fillText(entry.title, 20, top + 120)
}

module.exports.tv = (req, res) => {
    res.type('gif')
    getXml(tvRssUrl, (data) => {
        parseString(data, (err, xmlResult) => {
            if (err) throw err
            let weekResults = []
            let nextWeek = new Date((new Date()).getTime() + 7 * 24 * 60 * 60 * 1000)
            _.each(xmlResult.feed.entry, (entry) => {
                if (new Date(entry.published[0]) <= nextWeek) {
                    entry.date = new Date(entry.published[0])
                    entry.day = weekDays[entry.date.getDay()]
                    entry.hour = entry.date.getHours()
                    entry.minute = entry.date.getMinutes()
                    entry.ampm = (entry.hour > 11) ? 'PM' : 'AM'
                    if (entry.hour > 12)
                        entry.hour -= 12
                    if (entry.minute == 0)
                        entry.minute = '00'
                    weekResults.push(entry)
                }
            })

            let encoder = new GIFEncoder(1200, 1200)
            encoder.createReadStream().pipe(res)
            encoder.start()
            encoder.setRepeat(0)
            encoder.setDelay(3500)

            for (let r = 0;r < weekResults.length;r++) {
                let canvas = createCanvas(1200, 1200)
                let ctx = canvas.getContext('2d')
                
                ctx.fillStyle = '#' + (req.query.bgcolor || 'c2a016')
                ctx.fillRect(0, 0, 1200, 1200)

                ctx.fillStyle = '#' + (req.query.color || 'fefefe')
                ctx.font = '60px Tahoma'
                addTvText(ctx, weekResults[r], 20)
                r++
                if (r < weekResults.length)
                    addTvText(ctx, weekResults[r], 180)
                r++
                if (r < weekResults.length)
                    addTvText(ctx, weekResults[r], 340)
                r++
                if (r < weekResults.length)
                    addTvText(ctx, weekResults[r], 500)
                r++
                if (r < weekResults.length)
                    addTvText(ctx, weekResults[r], 660)
                r++
                if (r < weekResults.length)
                    addTvText(ctx, weekResults[r], 820)
                r++
                if (r < weekResults.length)
                    addTvText(ctx, weekResults[r], 980)
                encoder.addFrame(ctx)
            }
            
            encoder.finish()
        })
    })
}

module.exports.movie = (req, res) => {
    res.type('gif')
    getXml(movieRssUrl, (data) => {
        parseString(data, (err, xmlResult) => {
            if (err) throw err
            _.each(xmlResult.feed.entry, (entry) => {
                entry.date = new Date(entry.published[0])
                entry.month = months[entry.date.getMonth()]
                entry.day = entry.date.getDate()
                entry.year = entry.date.getFullYear()
            })

            let encoder = new GIFEncoder(1200, 800)
            encoder.createReadStream().pipe(res)
            encoder.start()
            encoder.setRepeat(0)
            encoder.setDelay(3500)

            for (let r = 0;r < xmlResult.feed.entry.length && r < 5;r++) {
                let canvas = createCanvas(1200, 800)
                let ctx = canvas.getContext('2d')
                
                ctx.fillStyle = '#' + (req.query.bgcolor || '8f0d23')
                ctx.fillRect(0, 0, 1920, 800)

                ctx.fillStyle = '#' + (req.query.color || 'fefefe')
                ctx.font = '60px Tahoma'
                addMovieText(ctx, xmlResult.feed.entry[r], 20)
                r++
                if (r < xmlResult.feed.entry.length)
                    addMovieText(ctx, xmlResult.feed.entry[r], 180)
                r++
                if (r < xmlResult.feed.entry.length)
                    addMovieText(ctx, xmlResult.feed.entry[r], 340)
                r++
                if (r < xmlResult.feed.entry.length)
                    addMovieText(ctx, xmlResult.feed.entry[r], 500)
                r++
                if (r < xmlResult.feed.entry.length)
                    addMovieText(ctx, xmlResult.feed.entry[r], 660)
                encoder.addFrame(ctx)
            }
            
            encoder.finish()
        })
    })
}
