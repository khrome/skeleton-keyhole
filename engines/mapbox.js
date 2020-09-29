var polyMask = function(features, turf){
    var featureCollection = features.reduce(function(featureCollection, feature){
        //var geojsonType = turf.getType(feature);
        console.log('>>', features)
        switch(feature.geometry.type){
            case 'Polygon':
                featureCollection.push(turf.polygon(feature.geometry.coordinates));
                break;
            case 'MultiPolygon':
                featureCollection.push(turf.multiPolygon(feature.geometry.coordinates));
                break;
            default: break;
        }
        return featureCollection;
    }, []);
    var union = turf.featureCollection(featureCollection);
    console.log('!!!', JSON.stringify(union))
    var mask = turf.combine(union).features[0];
    var bboxPoly = turf.bboxPolygon([-180, -90, 180, 90]);
    var res;
    if(Array.isArray(mask)){
        mask.forEach(function(feature){
            res = turf.difference(res || bboxPoly, feature);
        });
    }else{
        res = turf.difference(bboxPoly, mask);
    }
    return res;
};

var mb = {
    requireDependencies : function(auth){
        if(!window.mapboxgl) throw new Error('mapbox required');
        window.mapboxgl.accessToken = auth.token;
    },
    createMap : function(options){
        var map = new mapboxgl.Map({
            container: options.id,
            style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
            center: options.center || [-74.5, 40], // starting position [lng, lat]
            zoom: options.zoom || 9 // starting zoom
        });
        map.waitingShapeLayers = {};

        return map;
    },
    createLayer : function(map, options){
        if(options.tiles){
            return {
                "id": 'tiles-layer',
                "type": "raster",
                "source": {
                    type : "raster",
                    tileSize : (options.size || 256),
                    "raster-fade-duration" : (options.transitionDuration || 500),
                    tiles : [
                    	options.tiles
                    ]
                }
            }
        }
        if(options.data){ //we're displaying shapes
            var map = {
                '$eq' : '=='
            }
            var filter;
            if(options.filter && options.filter.properties){
                filter = ['all'];
                Object.keys(options.filter.properties).forEach(function(propertyName){
                    var operation = Object.keys(
                        options.filter.properties[propertyName]
                    )[0];
                    if(!map[operation]) throw new Error('Unknown Operation: '+operation);
                    filter.push([
                        map[operation],
                        propertyName,
                        options.filter.properties[propertyName][operation]
                    ]);
                });
                delete options.filter.properties;
            }
            var layers = [];
            if(options['fill-color']){
                var layer = {
                    'id': options.name+'-fill',
                    'type': 'fill',
                    'source': options.data,
                    'layout': {},
                    'paint': {
                        'fill-color': (options['fill-color'] || '#333333'),
                        'fill-opacity': (options['fill-opacity'] || .8)
                    }
                }
                if(filter) layer.filter = filter;
                if(options['min-zoom']) layer.minzoom = options['min-zoom'];
                if(options['max-zoom']) layer.maxzoom = options['max-zoom'];
                layers.push(layer);
            }
            if(options['stroke-color']){
                var strokeLayer = {
                    'id': options.name+'-line',
                    'type': 'line',
                    'source': options.data,
                    'layout': {},
                    'paint': {
                        'line-color': (options['stroke-color'] || '#000000'),
                        'line-opacity': (options['stroke-opacity'] || 1),
                        'line-width': (options['stroke-width'] || 4)
                    }
                }
                if(filter) strokeLayer.filter = filter;
                if(options['min-zoom']) strokeLayer.minzoom = options['min-zoom'];
                if(options['max-zoom']) strokeLayer.maxzoom = options['max-zoom'];
                layers.push(strokeLayer);
            }
            if(options['text'] || options['property']){
                var textLayer = {
                    'id': options.name+'-text',
                    'type': 'symbol',
                    'source': options.data,
                    'layout': {
                        'text-field': (
                            options['property'] && options['property']+' : {'+options['property']+'}'
                        ) || options['text'],
                        //'text-size': (options['text-size'] || 1),
                        "text-font": [(options['text-font'] || 'Arial Unicode MS Regular')],
                    },
                    minzoom:14,
                    'paint': {
                        'text-color': (options['text-color'] || 'rgb(0,0,0)'),
                    }
                };
                if(filter) textLayer.filter = filter;
                if(options['min-zoom']) textLayer.minzoom = options['min-zoom'];
                if(options['max-zoom']) textLayer.maxzoom = options['max-zoom'];
                layers.push(textLayer);
            }
            //console.log(layers)
            return layers;
        }
    },
    addLayer : function(map, layer, options){
        var ob = this;
        if(Array.isArray(layer)){
            layer.forEach(function(sublayer){
                ob.addLayer(map, sublayer, options);
            })
        }else{
            if(layer.type === 'fill'){
                if(options.callback){
                    map.on('click', layer.id, function(e){
                        if(window[options.callback]){
                            window[options.callback](
                                e.features[0],
                                function(coordinates, description){
                                    new mapboxgl.Popup()
                                    .setLngLat(coordinates)
                                    .setHTML(description)
                                    .addTo(map);
                                }
                            )
                        }
                    });

                    // Change the cursor to a pointer when the mouse is over the places layer.
                    map.on('mouseenter', layer.id, function () {
                        map.getCanvas().style.cursor = 'pointer';
                    });

                    // Change it back to a pointer when it leaves.
                    map.on('mouseleave', layer.id, function () {
                        map.getCanvas().style.cursor = '';
                    });
                }
            }
            if(layer){
                map.addLayer(layer);
            }else{
                console.log('layer not added');
            }
        }
    },
    removeLayer : function(map, layer){

    },
    createData : function(name, dt, options){
        var data = (typeof dt === 'string')?JSON.parse(dt):dt;
        // data is either an array of features or a FeatureCollection
        // return is always a FeatureCollection
        //if(options.mask)
        var collection = Array.isArray(data)?{
            "type": "FeatureCollection",
            "features": data
        }:data;
        return {type:'geojson', data:collection};
    },
    addData : function(map, name, data){
        if( name.indexOf('-inverted') !== -1){
            var copy = JSON.parse(JSON.stringify(data));
            if(copy.data.features){
                if(Array.isArray(copy.data.features)){
                    copy.data.features = polyMask(copy.data.features, window.turf);
                }else{
                    copy.data.features = polyMask([copy.data.features], window.turf);
                }
            }else{
                console.log('???', copy, data)
                copy.data = {
                    type:'FeatureCollection',
                    features: polyMask([copy.data], window.turf)
                };
                if(!Array.isArray(copy.data.features)){
                    copy.data.features = [copy.data.features];
                }
            }
            map.addSource(name, copy);
            console.log('inverted', JSON.stringify(copy.data));
        }else{
            map.addSource(name, data);
        }
    }
}
try{
    module.exports = mb;
}catch(ex){}
try{
    if(window) window.mapboxKeyholeEngine = mb;
}catch(ex){}
