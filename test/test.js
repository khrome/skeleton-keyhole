//if we're in the browser, make the signature match node.js
if(window && window['__env__']) window.process = {ENV : window['__env__']};

var engines = [
    'leaflet',
    'mapbox',
    'openlayers'
];

var tokens = {
    'leaflet': '',
    'mapbox':process.ENV.MAPBOX_TOKEN,
    'google':process.ENV.GOOGLE_TOKEN,
    'openlayers': ''
}

var makeEL = function(name, attrs){
    var el = document.createElement(name);
    Object.keys(attrs).forEach(function(attrName){
        el.setAttribute(attrName, attrs[attrName]);
    });
    return el;
}

var once = function(el, event, action){
    var meta = function(e){
        action(e);
        el.removeEventListener(event, meta);
    }
    el.addEventListener(event, meta);
}

var makeKeyhole = function(id, options, data){
    var engineType = options.engine || 'leaflet';
    var keyhole = makeEL('skeleton-keyhole', {
        engine: engineType,
        identifier: id,
        token: tokens[engineType],
        zoom:"19",
        center:"[-83.69552671909332,32.88402234265354]"
    });
    var data = makeEL('keyhole-data', {
        name: "data-layer",
        data: JSON.stringify(data)
    });
    var shapes = makeEL('keyhole-shapes', {
        name: "shapes-layer",
        data: "data-layer",
        active: "true",
        'fill-color': "#FF0044",
        'fill-opacity': "0.3",
        property: "measurement",
        'text-color': "#FFFFFF",
        'stroke-color': "#222222",
        filter: JSON.stringify({
            "properties": {"measurement" : {"$eq": 0}}
        })
    });
    var tiles = makeEL('keyhole-tiles', {
        url: "https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png"
    });
    return keyhole;
}

describe('skeleton-keyhole', function(){
    it('tests are executing in a browser', function(){
        should.exist(document);
        should.exist(window);
    });

    it('tests executing in a browser that supports custom elements', function(){
        ('customElements' in window).should.equal(true);
    });

    it('has loaded all the various engines', function(){
        engines.forEach(function(engine){
            should.exist(window[engine+'KeyholeEngine']);
        });
    });

    /*
    it('has loaded all the various engines\'s keys', function(){
        engines.forEach(function(engine){
            should.exist(window[engine+'KeyholeEngine']);
        });
    });
    */

    describe('has defined object ', function(){
        it('skeleton-keyhole', function(){
            should.exist(window.customElements.get('skeleton-keyhole'))
        });
        it('keyhole-data', function(){
            should.exist(window.customElements.get('keyhole-data'))
        });
        it('keyhole-shapes', function(){
            should.exist(window.customElements.get('keyhole-shapes'))
        });
        it('keyhole-tiles', function(){
            should.exist(window.customElements.get('keyhole-tiles'))
        });
    });

    engines.forEach(function(engine){
        describe('runs with engine '+engine, function(){
            describe('can instantiate object ', function(){
                it('skeleton-keyhole', function(){
                    should.exist(document.createElement('skeleton-keyhole'));
                });
                it('keyhole-data', function(){
                    should.exist(document.createElement('keyhole-data'));
                });
                it('keyhole-shapes', function(){
                    should.exist(document.createElement('keyhole-shapes'));
                });
                it('keyhole-tiles', function(){
                    should.exist(document.createElement('keyhole-tiles'));
                });
            });

            it('can build a map that loads', function(done){
                this.timeout(5000);
                var elId = "keyhole-id-"+engine;
                var keyhole = makeKeyhole(elId, {}, testData);
                once(keyhole, 'keyhole-load', function(e){
                    keyhole.remove();
                    done();
                });
                document.body.appendChild(keyhole);
            });

        });
    });
});

var testData = [
    {
        "type":"Feature",
        "properties":{"measurement":1},
        "geometry":{
            "type":"Polygon",
            "coordinates":[[
                [-83.69624018669128,32.88395251691908],
                [-83.69623214006424,32.88374979673315],
                [-83.6954891681671,32.88380385549475],
                [-83.69552403688431,32.884002070671784],
                [-83.69624018669128,32.88395251691908]
            ]]
        }
    },{
        "type":"Feature",
        "properties":{"measurement":0},
        "geometry":{
            "type":"Polygon",
            "coordinates":[[
                [-83.69629114866257,32.88415298420249],
                [-83.69624555110931,32.88397053646872],
                [-83.69552671909332,32.88402234265354],
                [-83.69554817676543,32.884216052467515],
                [-83.69629114866257,32.88415298420249]
            ]]
        }
    },{
        "type":"Feature",
        "properties":{"measurement":1},
        "geometry":{
            "type":"Polygon",
            "coordinates":[[
                [-83.69540601968765,32.884051624396776],
                [-83.69528800249098,32.883405171352834],
                [-83.69485348463058,32.88372727223942],
                [-83.69497418403625,32.88411694517374],
                [-83.69540601968765,32.884051624396776]
            ]]
        }
    },{
        "type":"Feature",
        "properties":{"measurement":0},
        "geometry":{
            "type":"Polygon",
            "coordinates":[[
                [-83.69623482227324,32.88372952468906],
                [-83.69627505540846,32.88353806626608],
                [-83.69544893503188,32.883567348169336],
                [-83.6954864859581,32.88378133101476],
                [-83.69623482227324,32.88372952468906]
            ]]
        }
    }
];
