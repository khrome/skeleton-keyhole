
var setOptIfAttr = function(name, options, el){
    if(el.getAttribute(name)){
        try{
            options[name] = JSON.parse(el.getAttribute(name))
        }catch(ex){
            options[name] = el.getAttribute(name);
        }
    }
}

class SkeletonKeyhole extends HTMLElement{
    constructor(){
      super();
      var jobs = [];
      this.ready = function(handler){
          if(!jobs) return handler();
          if(typeof handler === 'boolean'){
              jobs.forEach(function(job){
                  job();
              });
              jobs = false;
          }else{
              jobs.push(handler)
          }
      }
    }
    connectedCallback(){
        var el = document.createElement('div');
        var id = 'dkjhdfskjfh'
        el.setAttribute('id', id);
        this.appendChild(el);

        var engineName = this.getAttribute('engine');
        if(!engineName) throw new Error('engine not found: '+engineName);
        var engine;
        try{
            engine = window[engineName+'KeyholeEngine'] || require('./engines/'+engineName);
        }catch(ex){
            throw new Error('engine not found: '+engineName);
        }
        var auth = {};
        var authToken = this.getAttribute('token');
        if(authToken) auth.token = authToken;
        engine.requireDependencies(auth);
        var options = {};
        setOptIfAttr('zoom', options, this);
        setOptIfAttr('center', options, this);
        options.id = id;
        this.engineInstance = engine;
        var map = engine.createMap(options);
        this.mapInstance = map;
        var ob = this;
        map.on('load', function(){
            ob.ready(true);
        });
        this.addEventListener('keyhole-layer-add', function(e){
            ob.ready(function(){
                e.el.connectToMap(map, engine);
            });
        });
        this.addEventListener('keyhole-data-add', function(e){
            ob.ready(function(){
                e.el.connectToMap(map, engine);
            });
        });
        this.addEventListener('keyhole-shapes-add', function(e){
            ob.ready(function(){
                e.el.connectToMap(map, engine);
            });
        });
    }
    disconnectedCallback(){

    }
}
customElements.define('skeleton-keyhole', SkeletonKeyhole);

class KeyholeTileLayer extends HTMLElement{
    constructor(){
      super();
    }
    getKeyhole(){
        var node = this;
        while(!node instanceof SkeletonKeyhole){
            node = node.parentNode;
        }
        return node;
    }
    connectedCallback(){
        var event = new Event('keyhole-layer-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
    }
    connectToMap(map, engine){
        if(!this.instance){
            var url = this.getAttribute('url')
            this.instance = engine.createLayer(map, {
                tiles : url
            }, {});
        }
        engine.addLayer(map, this.instance);
    }
    disconnectedCallback(){

    }
}
customElements.define('keyhole-tiles', KeyholeTileLayer);

class KeyholeDataLayer extends HTMLElement{
    constructor(){
      super();
    }
    connectedCallback(){
        var event = new Event('keyhole-data-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
        this.getAttribute('');
    }
    connectToMap(map, engine){
        var name = this.getAttribute('name');
        if(!this.data){
            var data = this.getAttribute('data');
            if(data){
                try{
                    data = JSON.parse(data);
                }catch(ex){} //must be a string?
            }
            var mask;
            try{ mask = JSON.parse(this.getAttribute('mask')) }catch(ex){}
            this.data = engine.createData(name, data, {
                turf: this.turf,
                mask: mask
            });
        }
        //todo: support data fetch
        engine.addData(map, name, this.data);
    }
    disconnectedCallback(){

    }
}
customElements.define('keyhole-data', KeyholeDataLayer);

var getValue = function(el, name){
    try{ return JSON.parse(el.getAttribute(name)) }catch(ex){}
}

class KeyholeShapesLayer extends HTMLElement{
    constructor(){
      super();
    }
    connectedCallback(){
        var event = new Event('keyhole-shapes-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
    }
    connectToMap(map, engine){
        var name = this.getAttribute('name');
        var filter = {};
        if(name){
            try{
                filter = JSON.parse(this.getAttribute('filter'));
            }catch(ex){}
            var data = this.getAttribute('data');
            var options = {
                data,
                name,
                filter,
                'fill-color': this.getAttribute('fill-color'),
                'fill-opacity': getValue(this, 'fill-opacity'),
                'text': this.getAttribute('text'),
                'property': this.getAttribute('property'),
                'callback': this.getAttribute('callback'),
                'hover': this.getAttribute('hover'),
                'text-color': this.getAttribute('text-color'),
                'text-font': this.getAttribute('text-font'),
                'stroke-color': this.getAttribute('stroke-color'),
                'stroke-width': getValue(this, 'stroke-width'),
                'stroke-opacity': getValue(this, 'stroke-opacity')
            };
            if(data){
                this.layer = engine.createLayer(map, options);
            }
        }
        if(!this.layer) throw new Error('No Layer!!');
        //todo: support data fetch
        engine.addLayer(map, this.layer, options);
    }
    disconnectedCallback(){

    }
}
customElements.define('keyhole-shapes', KeyholeShapesLayer);
