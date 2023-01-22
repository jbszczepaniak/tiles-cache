const express = require('express')
const request = require('request')
const path = require('path')
const fs = require('fs')

const app = express()
const tileCache = {}
const fsCachePath = path.join(__dirname, 'tiles')

function loadTilesFromDisk() {
    if (!fs.existsSync(fsCachePath)) {
        fs.mkdirSync(fsCachePath)
        console.log('Tiles folder created')
        return
    }
    fs.readdirSync(fsCachePath).forEach(fileName => {
        const tilePath = path.join(fsCachePath, fileName)
        tileCache[fileName] = tilePath
    })
    console.log(`Loaded ${Object.keys(tileCache).length} tiles from the disk`)
}
loadTilesFromDisk()

app.get('/tiles/:z/:x/:y.png', (req, res) => {
    const { z, x, y } = req.params

    const tileKey = `${z}-${x}-${y}.png`;
    if (tileCache[tileKey]) {
        res.set('Content-Type', 'image/png')
        return res.sendFile(tileCache[tileKey])
    }

    // put something fancier here if you can afford it.
    const tilesProviderUrl = `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

    request.get(tilesProviderUrl, { encoding: null }, (err, response, body) => {
        if (err) {
            return res.status(500).send('Error getting tile from the provider')
        }
        const tilePath = path.join(__dirname, 'tiles', `${z}-${x}-${y}.png`)
        fs.writeFileSync(tilePath, new Uint8Array(body))
        tileCache[`${z}-${x}-${y}.png`] = tilePath
        res.set('Content-Type', 'image/png')
        res.sendFile(tilePath)

    })
})

app.listen(3002, () => {
    console.log('Proxy cache server listening on port 3002')
})
