var mb = {
    requireDependencies : function(){
        if(!window.mapboxgl) throw new Error('mapbox required')
    },
    createMap : function(options){
        var map = new mapboxgl.Map({
            container: options.id,
            style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
            center: options.center || [-74.5, 40], // starting position [lng, lat]
            zoom: options.zoom || 9 // starting zoom
        });

        return map;
    },
    createLayer : function(){

    },
    createData : function(){

    },
}
try{
    module.exports = mb;
}catch(ex){}
if(window) window.mapboxKeyholeEngine = mb;
