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
import { SkeletonKeyhole } from './keyhole.mjs';

const getValue = (el, name)=>{
    //eslint-disable-next-line no-empty
    try{ return JSON.parse( el.getAttribute(name) ); }catch(ex){}
};

export class KeyholeShapesLayer extends HTMLElement{
    constructor(){
        super();
    }
    getKeyhole(){
        var node = this.parentNode;
        while(!(node instanceof SkeletonKeyhole)){ node = node.parentNode; }
        return node;
    }
    connectedCallback(){
        var event = new Event('keyhole-dom-shapes-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
    }
    attributeChangedCallback(name, outgoing, incoming){
        var ob = this;
        var keyhole = this.getKeyhole();
        if((!keyhole) && !this.layer){
            keyhole.getElementsByName('keyhole-data');
        }
        if((!keyhole) || !(this.layer) ){//we aren't linked into the DOM yet
            //const data = this.getElementsByName('')
            setTimeout(function(){
                ob.attributeChangedCallback(name, outgoing, incoming);
            }, 100);
            return;
        }
    }
    static get observedAttributes() { return [ 'data', 'active']; }
    
    mapAttach(map, engine){
        var name = this.getAttribute('name');
        var filter = {};
        var keyhole = this.getKeyhole();
        if(name){
            try{
                filter = JSON.parse(this.getAttribute('filter'));
                //eslint-disable-next-line no-empty
            }catch(ex){}
            var dataName = this.getAttribute('data');
            var data = keyhole.getData(dataName);
            var options = {
                data,
                name,
                filter,
                standardCursorBehavior: true,
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
                'min-zoom': getValue(this, 'min-zoom'),
                'max-zoom': getValue(this, 'max-zoom'),
                'duration': getValue(this, 'duration'),
                'stroke-opacity': getValue(this, 'stroke-opacity')
            };
            if(data){
                this.layer = engine.createLayer(map, options);
            }
        }
        if(!this.layer) throw new Error('No Layer!!');
        //todo: support data fetch
        engine.addLayer(map, this.layer, options);
        this.loaded = true;
        var event = new Event('keyhole-map-shapes-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
    }
    disconnectedCallback(){

    }
}
customElements.define('keyhole-shapes', KeyholeShapesLayer);