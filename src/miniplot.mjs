import { requestAnimationFrame } from '@environment-safe/elements';
import { Canvas } from '@environment-safe/canvas';
import { Tween } from '@environment-safe/tween';

let defaultTile = null;

class MiniPlot{
    constructor(options={}){
        // coupled to submesh-treadmill's defaults
        this.tileSize = options.tileSize || 16;
        this.layers = [];
        this.debug = false;
        this.center = options.center || [0,0];
        this.centerTile = [
            ( options.center[0] === 0?0:Math.floor(options.center[0] / this.tileSize) ),
            ( options.center[1] === 0?0:Math.floor(options.center[1] / this.tileSize) )
        ];
        //TODO: determine range from viewport and returned tile dimensions
        if(options.id){
            const el = document.getElementById(options.id);
            const width = el.offsetWidth;
            const height = el.offsetHeight;
            this.width = width;
            this.height = height;
            this.canvas = new Canvas({ height, width });
            el.appendChild(this.canvas);
            this.canvas.removeAttribute('hidden');
            this.viewCenter = {
                x: Math.floor(width/2),
                y: Math.floor(height/2)
            };
            if(options.onLoad) options.onLoad();
        }
    }
    
    setCenter(center){
        this.center = center;
        this.centerTile = [
            ( this.center[0] === 0?0:Math.floor(this.center[0] / this.tileSize) ),
            ( this.center[1] === 0?0:Math.floor(this.center[1] / this.tileSize) )
        ];
        (async ()=>{
            if(!defaultTile){
                defaultTile = await Canvas.load('./assets/tile-placeholder.png');
            }
            this.preload();
            await this.redraw();
        })();
    }
    
    animate(position, time=1000, options={}){
        //Tween.linear();
        //if(this.animationId)
        const easingFnName = options.easing || 'linear';
        const startCenter = this.center.slice();
        const newCenter = position.slice();
        let center = null;
        const start = Date.now();
        let elapsed = null;
        const animationHandler = ()=>{
            elapsed = Date.now() - start;
            center = [
                Tween[easingFnName](elapsed, startCenter[0], newCenter[0], time),
                Tween[easingFnName](elapsed, startCenter[1], newCenter[1], time)
            ];
            this.setCenter(center);
            if(elapsed < time) requestAnimationFrame(animationHandler);
        };
        //this.animationId =
        requestAnimationFrame(animationHandler);
    }
    
    async preload(){
        if(!defaultTile){
            defaultTile = await Canvas.load('./assets/tile-placeholder.png');
        }
        const layers = this.layers.reverse();
        for(let lcv=0; lcv < layers.length; lcv++ ){
            await layers[lcv].preload(this.tileSize, this.center[0], this.center[1]);
        }
    }
    
    async redraw(){
        const layers = this.layers.reverse();
        const viewCenter = [
            this.center[0]%this.tileSize,
            this.center[1]%this.tileSize
        ];
        for(let lcv=0; lcv < layers.length; lcv++ ){
            await layers[lcv].draw(
                this.canvas, 
                this.center, 
                this.tileSize,
                viewCenter
            );
        }
    }
    
    addMarker(){
        
    }
    
    addLayer(layer, options){
        this.layers.push(layer);
        (async ()=>{
            await this.preload();
            await this.redraw();
        })();
    }
    
    removeLayer(){
        
    }
}

class MiniPlotLayer{
    constructor(options={}){
        this.options = options;
        this.tiles = {};
    }
    
    attach(map, options={}){
        this.map = map;
    }
    
    async preload(tileSize, x, y, z=19){
        //TODO: refactor with traversal
        const location = this.options.tiles;
        const range = 1;
        const tileX = Math.floor(x/tileSize);
        const tileY = Math.floor(y/tileSize);
        let col = null;
        let row = null;
        let invertedCol = null;
        for(let rowOffset=0-range; rowOffset <= range; rowOffset++){
            row = rowOffset+tileX;
            for(let colOffset=0-range; colOffset <= range; colOffset++){
                col = colOffset+tileY;
                invertedCol = ((tileX+range)-col);
                if(!this.tiles[row+':'+col]){
                    const tileLocation = location
                        .replace('{x}', row)
                        .replace('{y}', col)
                        .replace('{z}', z);
                    try{
                        this.tiles[row+':'+col] = await Canvas.load(tileLocation);
                        if(!this.tiles[row+':'+col]){
                            throw new Error(`no canvas @ ${row}, ${col}`);
                        }
                    }catch(ex){
                        this.tiles[row+':'+col] = defaultTile;
                    }
                }
                if(!this.tiles[row+':'+invertedCol]){
                    const tileLocation = location
                        .replace('{x}', row)
                        .replace('{y}', invertedCol)
                        .replace('{z}', z);
                    try{
                        this.tiles[row+':'+invertedCol] = await Canvas.load(tileLocation);
                        if(!this.tiles[row+':'+invertedCol]){
                            throw new Error(`no canvas @ ${row}, ${col}`);
                        }
                    }catch(ex){
                        this.tiles[row+':'+invertedCol] = defaultTile;
                        console.log(ex);
                    }
                }
                //todo: GC the cache
            }
        }
    }
    
    computeSizesFor(options){
        const graph = {};
        const stage = {};
        const canvas = {};
        const tile = {};
        tile.width = defaultTile.width;
        tile.height = defaultTile.height;
        const scaleFactor = this.map.tileSize / defaultTile.width;
        graph.x = this.map.center[0];
        graph.y = this.map.center[1];
        graph.height = this.map.height/scaleFactor;
        graph.width = this.map.width/scaleFactor;
        canvas.height = this.map.height;
        canvas.width = this.map.width;
        canvas.x = graph.x;
        canvas.y = graph.y;
        graph.tileX = Math.floor(graph.x/this.map.tileSize);
        graph.tileY = Math.floor(graph.y/this.map.tileSize);
        graph.offset = [
            this.map.center[0] - graph.tileX*16,
            this.map.center[1] - graph.tileY*16
        ];
        canvas.offset = [
            graph.offset[0]/scaleFactor,
            (this.map.tileSize-graph.offset[0])/scaleFactor
        ];
        
        return {graph, stage, canvas, tile, scaleFactor};
    }
    
    traverseTiles(options, handler){
        // graph: the scene coords with origin in LL
        // stage: the size of the loaded area
        //canvas: the viz coords with origin in UL
        const {graph, stage, canvas, tile, scaleFactor} = this.computeSizesFor(options);
        let row = null;
        let col = null;
        let range = options.range || 1;
        let invertedCol = null;
        try{
            for(let rowOffset=0-range; rowOffset <= range; rowOffset++){
                row = rowOffset+graph.tileX;
                for(let colOffset=0-range; colOffset <= range; colOffset++){
                    col = colOffset+graph.tileY;
                    invertedCol = ((graph.tileX+range)-col);
                    handler(row, col, invertedCol, rowOffset, colOffset, graph, stage, canvas, tile, scaleFactor);
                }
            }
        }catch(ex){
            console.log('traversal error', ex);
        }
    }
    
    draw(canvas, center, tileSize=16, offset={x:0, y:0}){
        const context = canvas.getContext('2d');
        let xPlot = null;
        let yPlot = null;
        context.fillStyle = '#FFFFFF';
        context.fillRect(
            0, 
            0,
            this.map.width,
            this.map.height
        );
        this.traverseTiles({offset}, (
            row, col, invertedCol, rowOffset, colOffset, graph, stage, canvas, tile, scaleFactor
        )=>{
            xPlot = (this.map.width/2)+((rowOffset)*tile.width)-(canvas.offset[0]);
            yPlot = (this.map.height/2)-((colOffset)*tile.height)-(canvas.offset[1]);
            try{
                //*
                context.drawImage(
                    this.tiles[row+':'+col], 
                    xPlot, 
                    yPlot,
                    tile.width,
                    tile.height
                ); //*/
            }catch(ex){
                console.log(ex);
            }
            if(this.map.debug){
                context.strokeStyle = '#000000';
                context.strokeRect(
                    xPlot, 
                    yPlot,
                    tile.width,
                    tile.height
                );
                context.font = 'bold 12px serif';
                context.fillStyle = '#000000';
                context.fillText(
                    `${row}, ${col}`, 
                    xPlot+10, 
                    yPlot+10
                );
                for(let r=0; r < 16; r++){
                    for(let c=0; c < 16; c++){
                        if(r%2 !== c%2){
                            context.font = 'bold 8px serif';
                            context.fillText(
                                `${row*16+r}, ${col*16+(16-c)}`, 
                                xPlot+(r/scaleFactor), 
                                yPlot+(c/scaleFactor)
                            );
                        }
                    }
                }
            }
        });
        context.beginPath();
        const radius = 10;
        context.arc(
            (this.map.width/2), //-(offset.x), 
            (this.map.height/2), //+(offset.y),
            radius, 
            0, 2 * Math.PI
        );
        context.fillStyle = '#CC0000';
        context.fill();
        context.lineWidth = 5;
        context.strokeStyle = '#003300';
        context.stroke();
        if(this.map.debug){
            context.fillStyle = '#FFFFFF';
            context.fillText(
                `${Math.round(this.map.center[0])}, ${Math.round(this.map.center[1])}`, 
                (this.map.width/2)-10,
                (this.map.height/2),
            );
        }
    }
}


var mb = {
    requireDependencies : function(auth){
        
    },
    setCenter:(map, center)=>{
        map.setCenter(center);
    },
    animate:(map, position, time, options)=>{
        map.animate(position, time, options);
    },
    createMap : function(options={}){
        const map = new MiniPlot(options);
        return map;
    },
    createLayer : function(map, options){
        if(options.tiles){
            options.center = map.centerTile;
            return new MiniPlotLayer(options);
        }
        if(options.data){ //we're displaying shapes
            
        }
    },
    getMapOptions : function(options){
        return options;
    },
    addLayer : function(map, layer, options={}){
        options.center = map.centerTile;
        layer.attach(map);
        map.addLayer(layer, options);
        
    },
    removeLayer : function(map, layer, options){
        
    },
    createData : function(name, dt, options){
        
    },
    focusOnData : function(map, data, scale){
        
    },
    getData : function(map, name, root){
        
    },
    addData : function(map, name, incomingData){
        
    },
    initialize: async (options={})=>{
        //todo: check canvas support
    },
    initialized: false
};

export const engine = mb;
export const KeyholeEngine = mb;
if(window){
    window.miniplotKeyholeEngine = mb;
}