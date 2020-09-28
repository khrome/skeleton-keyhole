
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
    }
    connectedCallback(){
        var el = document.createElement('div');
        el.setAttribute('id', 'dkjhdfskjfh')
        this.appendChild(el);

        var engineName = this.getAttribute('engine');
        if(!engineName) throw new Error('engine not found: '+engineName);
        var engine;
        try{
            engine = window[engineName+'KeyholeEngine'] || require('./engines/'+engineName);
        }catch(ex){
            throw new Error('engine not found: '+engineName);
        }
        engine.requireDependencies();
        var options = {};
        setOptIfAttr('zoom', options, this);
        setOptIfAttr('center', options, this);

    }
    disconnectedCallback(){

    }
}
customElements.define('skeleton-keyhole', SkeletonKeyhole);

class KeyholeTileLayer extends HTMLElement{
    constructor(){
      super();
    }
    connectedCallback(){
        this.getAttribute('');
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
        this.getAttribute('');
    }
    disconnectedCallback(){

    }
}
customElements.define('keyhole-data', KeyholeDataLayer);
