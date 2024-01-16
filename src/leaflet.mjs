import sift from 'sift';

var mb = {
    requireDependencies : function(auth){
        if(!window.L) throw new Error('leaflet required');
    },
    setCenter:(map, center)=>{
        const point = { lat:center[1], lng:center[0] };
        map.setView(point, map.getZoom(), { animation: true }); 
    },
    createMap : function(options={}){
        var map = window.L.map(options.id, {
            maxZoom: options.maxZoom||21,
            minZoom: options.minZoom
        });
        map.waitingShapeLayers = {};
        if(options.onLoad) setTimeout(function(){
            options.onLoad();
        }, 100);
        map.setView(
            (options.center || [-74.5, 40]).reverse(),
            options.zoom || 19
        );
        window.mapi = map;
        return map;
    },
    createLayer : function(map, options){
        if(options.tiles){
            return window.L.tileLayer(options.tiles, {
                attribution: options.attribution || 'Served by SkeletonKeyhole',
                maxZoom :21
            });
        }
        if(options.data){ //we're displaying shapes
            var data = typeof options.data === 'string'?
                map.dataRepository[options.data]:
                options.data;
            var filter;
            if(options.filter){
                var test = sift(options.filter);
                filter = function(feature){
                    const result = test(feature);
                    return result;
                };
                const copy = JSON.parse(JSON.stringify(data));
                copy.features = copy.features.filter(filter);
                data = copy;
            }
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
            /*if(options['text'] || options['property']){
            }*/
            var layer = window.L.geoJSON(data, {
                style: function (feature) {
                    return style;
                }
            });
            return layer;
        }
    },
    getMapOptions : function(options){
        return options;
    },
    addLayer : function(map, layer, options){
        if(layer){
            layer.addTo(map);
        }else{
            console.log('layer not added');
        }
    },
    removeLayer : function(map, layer, options){
        map.removeLayer(layer);
    },
    createData : function(name, dt, options){
        var data = (typeof dt === 'string')?JSON.parse(dt):dt;
        // data is either an array of features or a FeatureCollection
        // return is always a FeatureCollection
        //if(options.mask)
        var collection = Array.isArray(data)?{
            type: 'FeatureCollection',
            features: data
        }:data;
        return collection;
    },
    focusOnData : function(map, data, scale){
        var bounds = window.turf.bbox(data);
        var scaled = scale(bounds, 1.0);
        var reordered = [ //leaflet does 2 corners in flipped order
            scaled.slice(0, 2).reverse(),
            scaled.slice(2, 4).reverse()
        ];
        map.fitBounds(reordered);
    },
    getData : function(map, name, root){
        const repository = map.dataRepository;
        return repository[name];
    },
    addData : function(map, name, incomingData){
        const data = Array.isArray(incomingData)?{
            type: 'FeatureCollection',
            features: incomingData
        }:incomingData;
        if(!map.dataRepository) map.dataRepository = {};
        map.dataRepository[name] = data;
    },
    initialize: async (options={})=>{
        if(window.L) return [];
        //todo: check if deps already exist
        var jsSource = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        var styleSource = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        var state = {};
        var scriptEl = document.createElement('script');
        var callback;
        // eslint-disable-next-line no-unused-vars
        var error;
        var result = new Promise((resolve, reject)=>{
            callback = resolve;
            error = reject;
        });
        var check = function(){
            if(state.script && state.css) callback();
        };
        scriptEl.src = jsSource;
        scriptEl.onload = function(script){
            state.script = true;
            initLeaflet(window.L);
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
        await result;
        if(!window.L) throw new Error('could not initialize leaflet');
        return [scriptEl, styleEl];
    },
    initialized: false
};

export const engine = mb;
export const KeyholeEngine = mb;
if(window){
    window.leafletKeyholeEngine = mb;
}

const initLeaflet = (L)=>{
    if(!L) throw new Error('could not find attached leaflet');
    L.CRS.myCRS = L.extend({
        
    }, L.CRS.Simple, {
        infinite: false
    });
    L.Control.MousePosition = L.Control.extend({
        options: {
            position: 'bottomleft',
            separator: ' : ',
            emptyString: 'Unavailable',
            lngFirst: false,
            numDigits: 5,
            lngFormatter: undefined,
            latFormatter: undefined,
            prefix: ''
        },
    
        onAdd: function (map) {
            this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
            L.DomEvent.disableClickPropagation(this._container);
            map.on('mousemove', this._onMouseMove, this);
            this._container.innerHTML=this.options.emptyString;
            return this._container;
        },
    
        onRemove: function (map) {
            map.off('mousemove', this._onMouseMove);
        },
    
        _onMouseMove: function (e) {
            var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
            var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
            var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
            var prefixAndValue = this.options.prefix + ' ' + value;
            this._container.innerHTML = prefixAndValue;
        }
    
    });
    
    L.Map.mergeOptions({
        positionControl: false
    });
    
    L.Map.addInitHook(function () {
        if (this.options.positionControl) {
            this.positionControl = new L.Control.MousePosition();
            this.addControl(this.positionControl);
        }
    });
    
    L.control.mousePosition = function (options) {
        return new L.Control.MousePosition(options);
    };
};