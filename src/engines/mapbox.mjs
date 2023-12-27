import sift from 'sift';

var polyMask = function(features, turf){
    var featureCollection = features.reduce(function(featureCollection, feature){
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

const mb = {
    getData:(map, name)=>{
        //in mapbox we reference a registered dataset
        return name; 
    },
    addData:(map, name, data)=>{
        map.addSource(name, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: data
            }
        });
    },
    addLayer:(map, layer, options)=>{
        if(Array.isArray(layer)){
            layer.forEach(function(sublayer){
                try{
                    mb.addLayer(map, sublayer, options);
                }catch(ex){
                    console.log('ERROR', ex, options);
                }
            })
        }else{
            if(layer.type === 'fill'){
                if(options.standardCursorBehavior){
                    // Change the cursor to a pointer when the mouse is over the places layer.
                    map.on('mouseenter', layer.id, function () {
                        map.getCanvas().style.cursor = 'pointer';
                    });
        
                    // Change it back to a pointer when it leaves.
                    map.on('mouseleave', layer.id, function () {
                        map.getCanvas().style.cursor = '';
                    });
                }
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
                                },
                                e
                            )
                        }
                    });
                }
                if(options.hover){
                    var hoverInstance;
                    map.on('mouseenter', layer.id, function(e){
                        if(window[options.hover]){
                            window[options.hover](
                                e.features[0],
                                function(coordinates, description){
                                    //set
                                    hoverInstance = new mapboxgl.Popup()
                                        .setLngLat(coordinates)
                                        .setHTML(description)
                                        .addTo(map);
                                },
                                e
                            )
                        }
                    });
                    map.on('mouseleave', layer.id, function(e){
                        if(hoverInstance){
                            //handle hoverInstance
                            hoverInstance.remove();
                            hoverInstance = undefined;
                        }
                    });
                }
            }
            if(layer){
                if(!map.getLayer(layer.id)) map.addLayer(layer);
            }else{
                console.log('layer not added');
            }
        }
    },
    getLayer:(map, name)=>{
        
    },
    createLayer:(map, options)=>{
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
            if(options.filter){
                filter = ['all'];
                const propKeys = Object
                    .keys(options.filter || {})
                    .filter((key)=> key.startsWith('properties.'));
                
                if(options.filter.properties){
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
                for(let lcv=0; lcv < propKeys.length; lcv++){
                    const name = propKeys[lcv];
                    const subname = propKeys[lcv].substring(11);
                    const operation = Object.keys(
                        options.filter[name]
                    )[0];
                    if(!map[operation]) throw new Error('Unknown Operation: '+operation);
                    filter.push([
                        map[operation],
                        subname,
                        options.filter[name][operation]
                    ]);
                    delete options.filter[name]
                }
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
            return layers;
        }
    },
    getMapOptions:(options, el)=>{
        options.auth = { token: el.getAttribute('token') };
        
        return options;
    },
    createMap: async (options)=>{
        if(!window.mapboxgl) throw new Error('mapbox required');
        if(!options.auth) throw new Error('mapbox requires authentication options');
        window.mapboxgl.accessToken = options.auth.token;
        
        Math.floor(Math.random()*1000000).toString()
        
        var map = new window.mapboxgl.Map({
            container: options.id,
            style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
            center: options.center || [-74.5, 40], // starting position [lng, lat]
            zoom: options.zoom || 9 // starting zoom
        });
        //map.waitingShapeLayers = {};
        if(options.onLoad) map.on('load', function(){
            options.onLoad();
        });
        
        return map;
    },
    initialize: async (options={})=>{
        if(window.mapboxgl) return callback();
        //todo: check if deps already exist
        var jsSource = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
        var styleSource = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        var state = {};
        var scriptEl = document.createElement('script');
        var callback;
        var error;
        var result = new Promise((resolve, reject)=>{
            callback = resolve;
            error = reject;
        });
        var check = function(){
            if(state.script && state.css) callback()
        }
        scriptEl.src = jsSource;
        scriptEl.onload = function(script){
            state.script = true;
            check();
        };
        var styleEl = document.createElement('link');
        styleEl.href = styleSource;
        styleEl.rel = 'stylesheet';
        styleEl.onload = function(script){
            state.css = true;
            check();
        };
        if(options.inject){
            var el = options.inject === true?document.head:options.inject;
            el.appendChild(scriptEl);
            el.appendChild(styleEl);
        }
        const finalResult = await result;
        if(!window.mapboxgl) throw new Error('could not initialize mapboxgl');
        return [scriptEl, styleEl];
    },
    initialized: false
}

export const engine = mb;
export const KeyholeEngine = mb;
if(window){
    window.leafletKeyholeEngine = mb;
}