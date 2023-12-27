/*
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
//*/

/**
 * A JSON object
 * @typedef { object } JSON
 */

import { HTMLElement, customElements } from '@environment-safe/elements';

const isLoaded = (loadableElList)=>{
    if(loadableElList.length === 0) return true;
    const result = loadableElList.reduce((agg, el)=>{
        return agg && el.loaded;
    }, true);
    return result;
};
 
export class SkeletonKeyhole extends HTMLElement{
    constructor(){
        super();
        var engineName = this.getAttribute('engine');
        if(!engineName) throw new Error('engine not found: '+engineName);
        try{
            this.engine = 
                window[engineName+'KeyholeEngine'] || 
                import('./engines/'+engineName);
        }catch(ex){
            throw new Error('engine not found: '+engineName);
        }
        this.domAttached = new Promise((resolve, reject)=>{
            this._attachDOM = resolve;
            this._failDOM = reject;
        });
        this.mapAttached = new Promise((resolve, reject)=>{
            this._attachMap = resolve;
            this._failMap = reject;
        });
        const complete = {};
        let loaded = false;
        const allLoaded = ()=>{
            const tiles = this.allTiles();
            const data = this.allData();
            const shapes = this.allShapes();
            const tilesLoaded = complete.layer && isLoaded(tiles);
            const dataLoaded = complete.data && isLoaded(data);
            const shapesLoaded = complete.shapes && isLoaded(shapes);
            return tilesLoaded && 
                shapesLoaded && 
                dataLoaded;
        };
        ['data', 'layer', 'shapes'].forEach((key)=>{
            this.addEventListener(`keyhole-dom-${key}-add`, async (e)=>{
                //add a tile layer to the map
                await this.domAttached;
                await this.mapAttached;
                if(!this.map) throw new Error('map attached without assignment');
                e.el.mapAttach(this.map, this.engine);
            });
            const fnName = `all${key[0].toUpperCase()}${key.substring(1)}`;
            const setOnDom = this[fnName]();
            if(setOnDom.length === 0){
                complete[key] = true;
            }
            this.addEventListener(`keyhole-${key}-load`, async (e)=>{
                const all = allLoaded();
                if((!loaded) && all){
                    loaded = true;
                    var event = new Event('load', {bubbles: true});
                    event.el = this;
                    this.dispatchEvent(event);
                }
            });
            this.addEventListener(`keyhole-map-${key}-add`, async (e)=>{
                await this.mapAttached;
                if(!complete[key]){
                    const fnName = `all${key[0].toUpperCase()}${key.substring(1)}`;
                    const loaded = isLoaded(this[fnName]());
                    if(loaded){
                        complete[key] = true;
                        var event = new Event(`keyhole-${key}-load`, {bubbles: true});
                        event.el = this;
                        this.dispatchEvent(event);
                    }
                }
            });
        });
    }
    getData(name){
        return this.engine.getData(this.map, name, this);
    }
    getLayer(name){
        return this.engine.getLayer(name, this);
    }
    allShapes(){
        return [...this.querySelectorAll('keyhole-shapes')];
    }
    allData(){
        return [...this.querySelectorAll('keyhole-data')];
    }
    allTiles(){
        return [...this.querySelectorAll('keyhole-tiles')];
    }
    allLayers(){
        return this.allTiles();
    }
    allLayer(){
        return this.allLayers();
    }
    getMapOptions(incomingOptions){
        return this.engine.getMapOptions(incomingOptions, this);
    }
    connectedCallback(){
        //CREATE CONTAINER
        var el = document.createElement('div');
        var id = this.getAttribute('identifier') || 'randent-'+Math.floor(Math.random()*1000000);
        el.setAttribute('id', id);
        el.setAttribute('class', 'keyhole-container');
        this.appendChild(el);
        
        (async ()=>{ //make the rest of the process async, signaled by map attachment
            //make sure we've initialized the lib
            if(!this.engine.initialized){
                await this.engine.initialize({inject:true});
            }
            //initialize the map
            const zoom = this.getAttribute('zoom') || null;
            const center = this.getAttribute('center')?
                JSON.parse(this.getAttribute('center')):
                null;
            const options = this.getMapOptions({
                id,
                auth: { token: this.getAttribute('token') },
                zoom,
                center
            }, this);
            options.onLoad = ()=>{
                this._attachMap();
            };
            this.map = await this.engine.createMap(options);
            //this._attachMap();
        })();
        
        //notify the element we're attached
        this._attachDOM();
        return [];
    }
    disconnectedCallback(){
    
    }
}
customElements.define('skeleton-keyhole', SkeletonKeyhole);