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

var mb = {
    setup : function(options, callback){
        if(window.L) return callback();
        //todo: inject deps
        var jsSource = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        var styleSource = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        var state = {};
        var scriptEl = document.createElement('script');
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
        return [scriptEl, styleEl];
    },
    requireDependencies : function(auth){
        if(!window.L) throw new Error('leaflet required');
    },
    createMap : function(options){
        var map = L.map(options.id, {maxZoom: options.maxZoom||21});
        map.waitingShapeLayers = {};
        if(options.onLoad) setTimeout(function(){
            options.onLoad();
        }, 100);
        map.setView(
            (options.center || [-74.5, 40]).reverse(),
            options.zoom || 19
        );
        return map;
    },
    createLayer : function(map, options){
        if(options.tiles){
            return L.tileLayer(options.tiles, {
                attribution: options.attribution || 'Served by SkeletonKeyhole',
                maxZoom :21
            });
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
            return layer;
        }
    },
    addLayer : function(map, layer, options){
        var ob = this;
        if(layer){
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
    if(window) window.leafletKeyholeEngine = mb;
}catch(ex){}
