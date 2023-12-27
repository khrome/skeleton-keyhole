skeleton-keyhole
================
A SlippyMap WebComponent using GeoJSON, because I don't like to choose. Supports Mapbox, Leaflet, OpenLayers(soon), Google(soon) and D3(someday).

Usage
-----

first you have to include the module and an engine:

```javascript
import 'skeleton-keyhole/mapbox';
import 'skeleton-keyhole';
// OR: import 'skeleton-keyhole/leaflet';
``` 


Then, in your markup you can define tile, shape and data layers... the following example creates 2 shape layers powered by a single data layer and an inverted shape that create a punchout for the area.


```html
<!-- token is require for mapbox -->
<skeleton-keyhole
    engine="leaflet"
    identifier="something"
    token="no-token"
    zoom="19"
    center="[-83.69552671909332,32.88402234265354]"
    center-on="mask"
>
    <keyhole-tiles
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    ></keyhole-tiles>
    <keyhole-data
        name="plots"
        data='[{"type":"Feature","properties":{"measurement":1},"geometry":{"type":"Polygon","coordinates":[[[-83.69624018669128,32.88395251691908],[-83.69623214006424,32.88374979673315],[-83.6954891681671,32.88380385549475],[-83.69552403688431,32.884002070671784],[-83.69624018669128,32.88395251691908]]]}},{"type":"Feature","properties":{"measurement":0},"geometry":{"type":"Polygon","coordinates":[[[-83.69629114866257,32.88415298420249],[-83.69624555110931,32.88397053646872],[-83.69552671909332,32.88402234265354],[-83.69554817676543,32.884216052467515],[-83.69629114866257,32.88415298420249]]]}},{"type":"Feature","properties":{"measurement":1},"geometry":{"type":"Polygon","coordinates":[[[-83.69540601968765,32.884051624396776],[-83.69528800249098,32.883405171352834],[-83.69485348463058,32.88372727223942],[-83.69497418403625,32.88411694517374],[-83.69540601968765,32.884051624396776]]]}},{"type":"Feature","properties":{"measurement":0},"geometry":{"type":"Polygon","coordinates":[[[-83.69623482227324,32.88372952468906],[-83.69627505540846,32.88353806626608],[-83.69544893503188,32.883567348169336],[-83.6954864859581,32.88378133101476],[-83.69623482227324,32.88372952468906]]]}}]'
    ></keyhole-data>
    <keyhole-shapes
        name="test-1"
        data="plots"
        active="true"
        fill-color="#FF0044"
        fill-opacity="0.3"
        callback="alertDump"
        property="measurement"
        text-color="#FFFFFF"
        stroke-color="#222222"
        filter='{"properties.measurement" : {"$eq": 0}}'
    ></keyhole-shapes>
    <keyhole-shapes
        name="test-2"
        data="plots"
        fill-color="#4400FF"
        fill-opacity="0.3"
        stroke-color="#222222"
        filter='{"properties.measurement" : {"$eq": 1}}'
    ></keyhole-shapes>
    <keyhole-data
        name="mask"
        data='[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-83.69646281003952,32.884227314652975],[-83.6963501572609,32.883558338353986],[-83.69461476802826,32.8835425711749],[-83.69482666254044,32.88446607264801],[-83.69646281003952,32.884227314652975]]]}}]'
        invert="true"
    ></keyhole-data>
    <keyhole-shapes
        name="mask-1"
        data="mask-inverted"
        fill-color="#00CC00"
        fill-opacity="0.3"
        stroke-color="#222222"
    ></keyhole-shapes>
</skeleton-keyhole>
```

Testing
-------

Run the es module tests to test the root modules
```bash
npm run import-test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless in chrome:
```bash
npm run headless-browser-test
```

to run the same test inside docker:
```bash
npm run container-test
```

Run the commonjs tests against the `/dist` commonjs source (generated with the `build-commonjs` target).
```bash
npm run require-test
```

Development
-----------
All work is done in the .mjs files and will be transpiled on commit to commonjs and tested.

If the above tests pass, then attempt a commit which will generate .d.ts files alongside the `src` files and commonjs classes in `dist`

