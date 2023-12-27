"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyholeDataLayer = void 0;
var _elements = require("@environment-safe/elements");
var _keyhole = require("./keyhole.cjs");
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

var polyMask = function (features, turf) {
  var featureCollection = features.reduce(function (featureCollection, feature) {
    switch (feature.geometry.type) {
      case 'Polygon':
        featureCollection.push(turf.polygon(feature.geometry.coordinates));
        break;
      case 'MultiPolygon':
        featureCollection.push(turf.multiPolygon(feature.geometry.coordinates));
        break;
      default:
        break;
    }
    return featureCollection;
  }, []);
  var union = turf.featureCollection(featureCollection);
  var mask = turf.combine(union).features[0];
  var bboxPoly = turf.bboxPolygon([-180, -90, 180, 90]);
  var res;
  if (Array.isArray(mask)) {
    mask.forEach(function (feature) {
      res = turf.difference(res || bboxPoly, feature);
    });
  } else {
    res = turf.difference(bboxPoly, mask);
  }
  return res;
};
class KeyholeDataLayer extends _elements.HTMLElement {
  constructor() {
    super();
  }
  getKeyhole() {
    var node = this.parentNode;
    while (!(node instanceof _keyhole.SkeletonKeyhole)) {
      node = node.parentNode;
    }
    return node;
  }
  getData() {
    let data = JSON.parse(this.getAttribute('data') || '[]');
    /*if(Array.isArray(data)){
        //if it's an array, we assume it's a set of features
        data = {
            "type": "FeatureCollection",
            "features": data
        }
    }*/
    return data;
  }
  getWrappedData() {
    //ensure that a list is wrapped as a collection
    let data = this.getData();
    if (Array.isArray(data)) {
      //if it's an array, we assume it's a set of features
      data = {
        type: 'FeatureCollection',
        features: data
      };
    }
    return data;
  }
  connectedCallback() {
    var event = new Event('keyhole-dom-data-add', {
      bubbles: true
    });
    event.el = this;
    this.dispatchEvent(event);
  }
  mapAttach(map, engine) {
    const name = this.getAttribute('name');
    const data = this.getData();
    engine.addData(map, name, data);
    const invert = this.getAttribute('invert');
    if (invert && invert[0] && invert[0] !== 'f') {
      const mask = polyMask(Array.isArray(data) ? data : [data], window.turf);
      engine.addData(map, name + '-inverted', [mask]);
    }
    this.loaded = true;
    var event = new Event('keyhole-map-data-add', {
      bubbles: true
    });
    event.el = this;
    event.detail = {
      name,
      data
    };
    this.dispatchEvent(event);
  }
  static get observedAttributes() {
    return ['data'];
  }
  disconnectedCallback() {}
}
exports.KeyholeDataLayer = KeyholeDataLayer;
_elements.customElements.define('keyhole-data', KeyholeDataLayer);