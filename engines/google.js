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

window.googleLibLoad = function(){
    var actions = waiting;
    wating = false;
    setTimeout(function(){
        actions.forEach(function(action){
            action();
        });
    }, 0);
}

var waiting = [];

var ready = function(fn){
    if(waiting){
        waiting.push(fn);
    }else{
        setTimeout(function(){
            fn();
        }, 0)
    }
}


var mb = {
    setup : function(options, callback){
        var script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key='+
            options.token+'&callback=googleLibLoad';
        script.defer = true;
        ready(function(){
            callback();
        });
        document.head.appendChild(script);
        console.log('SETUP', script)
    },
    requireDependencies : function(auth){
        if(!(window.google && window.google.maps)) throw new Error('google maps required');
    },
    createMap : function(options){
        var center = (options.center || [-74.5, 40]);
        var map = new google.maps.Map(document.getElementById(options.id), {
            center: { lat: center[0], lng: center[1] },
            zoom: options.zoom || 19,
        });
        map.waitingShapeLayers = {};
        console.log('loading');
        if(options.onLoad) ready(function(){
            console.log('loaded')
            options.onLoad();
        });
        return map;
    },
    createLayer : function(map, options){
        if(options.tiles){
            console.log('tried to create a gmaps tile layer, lol')
            return null;
        }
        if(options.data){ //we're displaying shapes
            var data = map.dataRepository[options.data];
            var map = {
                '$eq' : '=='
            }
            var filter;
            if(options.filter && window.sift){
                var test = window.sift(filter);
                filter = function(feature){
                    return test(feature);
                }
            }
            var layers = [];
            var style = {};
            if(options['fill-color']){
                style.fill = true;
                style.fillColor = (options['fill-color'] || '#333333');
                style.fillOpacity = (options['fill-opacity'] || .8);
            }
            if(options['stroke-color']){
                style.stroke = true;
                style.color = (options['stroke-color'] || '#000000');
                style.weight = (options['stroke-width'] || 4);
                style.opacity = (options['stroke-opacity'] || 1);
            }
            if(options['text'] || options['property']){
            }
            var layer = L.geoJSON(data, {
                style: function (feature) {
                    return style;
                }
            });
            console.log(layer);
            return layer;
        }
    },
    addLayer : function(map, layer, options){
        var ob = this;
        if(layer){
            console.log(layer, map)
            layer.addTo(map);
        }else{
            console.log('layer not added');
        }
    },
    removeLayer : function(map, layer, options){
        map.remove(layer)
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
        return collection;
    },
    focusOnData : function(map, data, scale){
        var bounds = turf.bbox(data);
        var scaled = scale(bounds, 1.0);
        var reordered = [ //leaflet does 2 corners in flipped order
            scaled.slice(0, 2).reverse(),
            scaled.slice(2, 4).reverse()
        ];
        map.fitBounds(reordered);
    },
    addData : function(map, name, data){
        if( name.indexOf('-inverted') !== -1){
            var copy = JSON.parse(JSON.stringify(data));
            if(copy.features){
                if(Array.isArray(copy.features)){
                    copy.features = polyMask(copy.features, window.turf);
                }else{
                    copy.features = polyMask([copy.features], window.turf);
                }
            }else{
                copy = {
                    type:'FeatureCollection',
                    features: polyMask([copy], window.turf)
                };
            }
            if(!Array.isArray(copy.features)){
                copy.features = [copy.features];
            }
            if(!map.dataRepository) map.dataRepository = {};
            map.dataRepository[name] = copy;
        }else{
            if(!map.dataRepository) map.dataRepository = {};
            map.dataRepository[name] = data;
        }
    }
}
try{
    module.exports = mb;
}catch(ex){}
try{
    if(window) window.googleKeyholeEngine = mb;
}catch(ex){}
