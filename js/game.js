var Game = {};

Game.preload = function(){
    Game.scene = this; 
    this.load.image('tileset', 'assets/gridtiles.png');
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    this.load.image('phaserguy', 'assets/phaserguy.png');
};

Game.create = function(){

    this.input.on('pointerup',Game.handleClick);

    Game.camera = this.cameras.main;
    Game.camera.setBounds(0, 0, 20*32, 20*32);

    var phaserGuy = this.add.image(32,32,'phaserguy');
    phaserGuy.setDepth(1);
    phaserGuy.setOrigin(0,0.5);
    Game.camera.startFollow(phaserGuy);
    Game.player = phaserGuy;

    Game.map = Game.scene.make.tilemap({ key: 'map'});
    var tiles = Game.map.addTilesetImage('tiles', 'tileset');
    Game.map.createStaticLayer(0, tiles, 0,0);

    Game.marker = this.add.graphics();
    Game.marker.lineStyle(3, 0xffffff, 1);
    Game.marker.strokeRect(0, 0, Game.map.tileWidth, Game.map.tileHeight);

    //////  Pathfinding stuff /////
    Game.finder = new EasyStar.js();

    // 2D array //
    var grid = [];
    for(var y = 0; y < Game.map.height; y++){
        var col = [];
        for(var x = 0; x < Game.map.width; x++){
            col.push(Game.getTileID(x,y));
        }
        grid.push(col);
    }
    Game.finder.setGrid(grid);

    var tileset = Game.map.tilesets[0];
    var properties = tileset.tileProperties;
    var acceptableTiles = [];

    for(var i = tileset.firstgid-1; i < tiles.total; i++){
        if(!properties.hasOwnProperty(i)) {
            acceptableTiles.push(i+1);
            continue;
        }
        if(!properties[i].collide) acceptableTiles.push(i+1);
        if(properties[i].cost) Game.finder.setTileCost(i+1, properties[i].cost); // If there is a cost attached to the tile, let's register it
    }
    Game.finder.setAcceptableTiles(acceptableTiles);
};

Game.update = function(){
    var worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);

    var pointerTileX = Game.map.worldToTileX(worldPoint.x);
    var pointerTileY = Game.map.worldToTileY(worldPoint.y);
    Game.marker.x = Game.map.tileToWorldX(pointerTileX);
    Game.marker.y = Game.map.tileToWorldY(pointerTileY);
    Game.marker.setVisible(!Game.checkCollision(pointerTileX,pointerTileY));
};

Game.checkCollision = function(x,y){
    var tile = Game.map.getTileAt(x, y);
    return tile.properties.collide == true;
};

Game.getTileID = function(x,y){
    var tile = Game.map.getTileAt(x, y);
    return tile.index;
};

Game.handleClick = function(pointer){
    var x = Game.camera.scrollX + pointer.x;
    var y = Game.camera.scrollY + pointer.y;
    var toX = Math.floor(x/32);
    var toY = Math.floor(y/32);
    var fromX = Math.floor(Game.player.x/32);
    var fromY = Math.floor(Game.player.y/32);
    console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')');

    Game.finder.findPath(fromX, fromY, toX, toY, function( path ) {
        if (path === null) {
            console.warn("Path was not found.");
        } else {
            console.log(path);
            Game.moveCharacter(path);
        }
    });
    Game.finder.calculate(); 
};

Game.moveCharacter = function(path){
    var tweens = [];
    for(var i = 0; i < path.length-1; i++){
        var ex = path[i+1].x;
        var ey = path[i+1].y;
        tweens.push({
            targets: Game.player,
            x: {value: ex*Game.map.tileWidth, duration: 200},
            y: {value: ey*Game.map.tileHeight, duration: 200}
        });
    }

    Game.scene.tweens.timeline({
        tweens: tweens
    });
};