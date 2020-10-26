#!/usr/bin/env node
var express = require('express');
var fs = require('fs');
var app = express()
var port = 8082

var serveMode = function(name){
    return function(req, res){
        res.setHeader("content-type", "text/html");
        fs.readFile('./test/static/index-'+name+'.html', function(err, data){
            var str = data.toString();
            str = str.replace('[GOOGLE_TOKEN]', process.env.GOOGLE_TOKEN);
            str = str.replace('[MAPBOX_TOKEN]', process.env.MAPBOX_TOKEN);
            res.send(str);
        });
    }
}

app.get('/', serveMode('mapbox'));
app.get('/mapbox', serveMode('mapbox'));
app.get('/leaflet', serveMode('leaflet'));
app.get('/openlayers', serveMode('openlayers'));
app.get('/google', serveMode('google'));

app.get('/keyhole.js', function(req, res){
    res.setHeader("content-type", "text/javascript");
    fs.createReadStream("./keyhole.js").pipe(res);
});

app.use(express.static('.'));

app.listen(port, function(){
  console.log(`Example app listening at http://localhost:${port}`)
})
