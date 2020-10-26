
var engines = [
    'leaflet',
    'mapbox',
    'openlayers'
];

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

            it('can build a working map', function(){
                var keyhole = document.createElement('skeleton-keyhole');
                var data = document.createElement('keyhole-data');
                var shapes = document.createElement('keyhole-shapes');
                var tiles = document.createElement('keyhole-tiles');
            });

        });
    });
});
