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

export class KeyholeTileLayer extends HTMLElement{
    constructor(){
        super();
    }
    getKeyhole(){
        var node = this.parentNode;
        while(!(node instanceof SkeletonKeyhole)){ node = node.parentNode; }
        return node;
    }
    connectedCallback(){
        var event = new Event('keyhole-dom-layer-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
    }
    mapAttach(map, engine){
        if(!this.instance){
            var url = this.getAttribute('url');
            this.instance = engine.createLayer(map, {
                tiles : url
            }, {});
        }
        engine.addLayer(map, this.instance);
        var event = new Event('keyhole-map-layer-add', {bubbles: true});
        event.el = this;
        this.dispatchEvent(event);
    }
    disconnectedCallback(){

    }
}
customElements.define('keyhole-tiles', KeyholeTileLayer);