
var getLayer = function(map, id){
    return map.getLayers().getArray().find(function(layer){
        return layer.get('name') == (id.name || id);
    });
}

var clone = function(o){
    return JSON.parse(JSON.stringify(o));
}


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
        if(window.ol) return callback();
        var jsSource = 'https://cdn.jsdelivr.net/gh/openlayers/'+
            'openlayers.github.io@master/en/v6.4.3/build/ol.js';
        var styleSource = 'https://cdn.jsdelivr.net/gh/openlayers/'+
            'openlayers.github.io@master/en/v6.4.3/css/ol.css';
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
        if(!Map) throw new Error('openlayers required');
    },
    createMap : function(options){
        var view = new ol.View({
          center: ol.proj.fromLonLat([0, 0]),
          zoom: 2,
        });
        var map = new ol.Map({
          layers: [
            //new ol.layer.Tile({
              //source: new ol.source.OSM(),
            //})
          ],
          target: options.id,
          view: view
        });
        map.view = view;
        if(options.onLoad){
            map.once('postrender', function(event) {
                options.onLoad();
            });
        }
        return map;
    },
    createLayer : function(map, options){
        var layer;
        if(options.tiles){
            var name = options.name;
            layer =  new ol.layer.Tile({
                source: new ol.source.XYZ({name:name, url:options.tiles,
                    attributions: [options.attribution || 'Served by SkeletonKeyhole'],
                    attributionsCollapsible: false
                })
            })
        }
        if(options.data){ //we're displaying shapes
            var data = map.dataRepository[options.data];
            var map = {
                '$eq' : '=='
            }
            var filter;
            if(options.filter && window.sift){
                var sft = window.sift.default || window.sift;
                filter = sft(options.filter);
            }
            var geo = clone(data);
            var start = geo.features.length
            if(filter){
                geo.features = geo.features.filter(function(item){
                    var result = filter(item);
                    console.log(result, item, options.filter)
                    return result;
                });
                console.log(start+' - '+geo.features.length, geo, data)
            }
            var styleOptions = {};
            if(options['stroke-color']){
                var strokeOptions = {}
                strokeOptions.color = options['stroke-color'];
                if(strokeOptions.width) strokeOptions.width = options['stroke-width'];
                if(strokeOptions.opacity) strokeOptions.opacity = options['stroke-opacity'];
                styleOptions.strike = new ol.style.Stroke(strokeOptions);
            }
            if(options['fill-color']){
                var fillOptions = {}
                fillOptions.color = fillOptions['fill-color'];
                if(fillOptions.width) fillOptions.width = options['fill-width'];
                if(fillOptions.opacity) fillOptions.opacity = options['fill-opacity'];
                styleOptions.fill = new ol.style.Fill(fillOptions);
            }
            var style = new ol.style.Style(styleOptions);
            var geojson = new ol.format.GeoJSON().readFeatures(geo);
            //console.log('GJ', geojson);
            layer = new ol.layer.Vector({
              name: options.name,
              source: new ol.source.Vector({
                features: geojson,
              }),
              style: style,
            });
        }
        return layer;
    },
    addLayer : function(map, layer, options){
        var ob = this;
        if(layer && !getLayer(map, layer)){
            map.addLayer(layer);
        }else{
            console.log('layer not added', (new Error()).stack);
        }
    },
    removeLayer : function(map, layer, options){
        map.removeLayer(layer)
    },
    createData : function(name, dt, options){
        var data
        try{
            data = (typeof dt === 'string')?JSON.parse(dt):dt;
        }catch(ex){
            data = []
        }
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
        var poly = turf.bboxPolygon(bounds);
        //map.fitBounds(reordered);
        var polygon = new ol.geom.Polygon(
            poly.geometry.coordinates
        ).transform('EPSG:4326','EPSG:3857');
        //var point = new ol.geom.Point(polygon);
        map.view.fit(polygon);

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
    if(window) window.openlayersKeyholeEngine = mb;
}catch(ex){}
