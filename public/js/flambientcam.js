var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.requestAnimationFrame = requestAnimationFrame;

var v, canvas, gCtx;
var backBuffer = document.createElement('canvas');
var bCtx = backBuffer.getContext('2d');


flambientcam = {

    webcam: null,
    canvas: null,
    gCtx: null,
    backBuffer: null,
    bCtx: null,
    imageData: null,
    tilesAcross: 20,
    tileStore: [],

    init: function() {

        utils.log('here');


        v = document.getElementById('webcam');
        canvas = document.getElementById('webcamcanvas');
        gCtx = canvas.getContext('2d');

        flambientcam.makeTileMap();

        navigator.webkitGetUserMedia({video:true}, flambientcam.callbackStreamIsReady);

        setInterval(function() {
            flambientcam.createMesh();
        }, 60);

    },

    callbackStreamIsReady: function(stream) {

        v.src = URL.createObjectURL(stream);
        v.play();
        window.requestAnimationFrame(flambientcam.makeFrame);

    },

    makeFrame: function() {

        var w = 160;
        var h = 120;

        backBuffer.width = w;
        backBuffer.height = h;

        //  copy the image from the video into the background bugger
        bCtx.translate(w, 0);
        bCtx.scale(-1, 1);
        bCtx.drawImage(v, 0, 0, w, h);

        var imageData = bCtx.getImageData(0, 0, w, h);
        flambientcam.imageData = imageData;


        flambientcam.renderFrame();

//        var pixels = bCtx.getImageData(0, 0, w, h);
//        gCtx.putImageData(pixels, 0, 0);


        window.requestAnimationFrame(flambientcam.makeFrame);
    },

    renderFrame: function() {

        var imageData = flambientcam.imageData;

        //  Ok, now the new way of doing the tile thing around here, first we're going to loop thru the source image
        //  in tile sized chunks, and then when we're looking at each tile loop through the pixels in each one
        //  working out if they are in the top, left, right or bottom (or null) quarter, totting up the values
        //  as we go, then averaging at the end.
        var counter = {};
        var tilePixel = null;
        var sourcePixel = null;
        var qa = ['top', 'left', 'right', 'bottom'];
        flambientcam.tileStore = [];
        var newRow = null;
        var newTile = {};


        //  take big steps through the source image, one tile area at a time
        for (var tileY = 0; tileY < flambientcam.tileObj.down; tileY++) {
            newRow = [];
            for (var tileX = 0; tileX < flambientcam.tileObj.across; tileX++) {

                //  zero all the rgb values
                counter.top = {r: 0, g: 0, b: 0, count: 0};
                counter.left = {r: 0, g: 0, b: 0, count: 0};
                counter.right = {r: 0, g: 0, b: 0, count: 0};
                counter.bottom = {r: 0, g: 0, b: 0, count: 0};

                //  To start we we need to know how many rows of pixels we are down, if the source image was
                //  140 pixels wide, and tileY = 1 (i.e. the 2nd tile row down), we would need 7 rows of 140 pixels
                //  to be our initial offset. The full width of pixels is tiles across * tile width.
                tilePixel = (Math.floor(tileY * flambientcam.tileObj.imgHeight / flambientcam.tileObj.down) * flambientcam.tileObj.imgWidth);

                //  Then we need to move a number of pixels in, based on the tileX positon
                tilePixel += Math.floor(tileX * flambientcam.tileObj.imgWidth / flambientcam.tileObj.across);

                //  Once we know that we have the pixel offset position of the top left pixel of the tile we are
                //  currently on

                //  NOTE, we still need to multiply up by 4 because there are 4 values r, b, g & a per pixel in the
                //  image data.

                //  step through all the pixels
                for (var y = 0; y < flambientcam.tileObj.height; y++) {
                    for (var x = 0; x < flambientcam.tileObj.width; x++) {

                        //  Now we need to move down another y total rolls
                        sourcePixel = tilePixel + (y * flambientcam.tileObj.imgWidth);
                        //  and finally the last few pixels across
                        sourcePixel += x;

                        //  Now multiply the whole lot by 4 to take account of the packing in the image data
                        sourcePixel = sourcePixel * 4;

                        //  now check the top, left, right, bottom position of the x,y pixel in the tilemap
                        //  and update the values into the correct counter thingy!
                        try {
                            if (flambientcam.tileMap[x][y] !== null) {
                              counter[flambientcam.tileMap[x][y]].r += imageData.data[sourcePixel];
                              counter[flambientcam.tileMap[x][y]].g += imageData.data[sourcePixel+1];
                              counter[flambientcam.tileMap[x][y]].b += imageData.data[sourcePixel+2];
                              counter[flambientcam.tileMap[x][y]].count++;
                            }
                        } catch(er) {
                            console.log('Faield at: ' + x + ', ' + y);
                            console.log(flambientcam.tileMap);
                            return;
                        }
                    }
                }

                //  Ok, so now we've been thru all the pixels in the tile work out the average for the top, left, right, bottom quarters
                for (var q in qa) {
                    counter[qa[q]].r = parseInt(counter[qa[q]].r / counter[qa[q]].count, 10);
                    counter[qa[q]].g = parseInt(counter[qa[q]].g / counter[qa[q]].count, 10);
                    counter[qa[q]].b = parseInt(counter[qa[q]].b / counter[qa[q]].count, 10);
                }

                //  ok, now that we have the average values for the top, left, right and bottom. I want to know which pair have the greatest
                //  similarity
                var topleft = (Math.abs(counter.top.r-counter.left.r) + Math.abs(counter.top.g-counter.left.g) + Math.abs(counter.top.b-counter.left.b))/3;
                var topright = (Math.abs(counter.top.r-counter.right.r) + Math.abs(counter.top.g-counter.right.g) + Math.abs(counter.top.b-counter.right.b))/3;
                var bottomleft = (Math.abs(counter.bottom.r-counter.left.r) + Math.abs(counter.bottom.g-counter.left.g) + Math.abs(counter.bottom.b-counter.left.b))/3;
                var bottomright = (Math.abs(counter.bottom.r-counter.right.r) + Math.abs(counter.bottom.g-counter.right.g) + Math.abs(counter.bottom.b-counter.right.b))/3;

                var targetCorners = {
                    top: Math.floor(tileY * flambientcam.tileObj.imgHeight / flambientcam.tileObj.down * 4),
                    bottom: Math.floor((tileY+1) * flambientcam.tileObj.imgHeight / flambientcam.tileObj.down * 4) + 1,
                    left: Math.floor(tileX * flambientcam.tileObj.imgWidth / flambientcam.tileObj.across * 4),
                    right: Math.floor((tileX+1) * flambientcam.tileObj.imgWidth / flambientcam.tileObj.across * 4) + 1
                };

                if ((topleft < topright && topleft < bottomleft && topleft < bottomright) || (bottomright < topleft && bottomright < topright && bottomright < bottomleft)) {
                    var tl = { 'r': parseInt((counter.top.r + counter.left.r)/2, 10), 'g': parseInt((counter.top.g + counter.left.g)/2, 10), 'b': parseInt((counter.top.b + counter.left.b)/2, 10) };
                    var br = { 'r': parseInt((counter.bottom.r + counter.right.r)/2, 10), 'g': parseInt((counter.bottom.g + counter.right.g)/2, 10), 'b': parseInt((counter.bottom.b + counter.right.b)/2, 10) };

                    //  first one diagonal
                    //  NOTE: This probably looks odd, because normally a triangle has 3 points. But if we just
                    //  draw two triangles, the diagonals don't go flush and you have a tiny slither of gap between
                    //  them. So with the first one, we actually join the corners not from the very corner pixel
                    //  but the next pixel down (and across). The the second triangle we draw just with the normal
                    //  three points, with the diagonal *just* overlapping.
                    gCtx.fillStyle="rgb(" + tl.r + "," + tl.g + "," + tl.b + ")";
                    gCtx.beginPath();
                    gCtx.moveTo(targetCorners.left, targetCorners.top);
                    gCtx.lineTo(targetCorners.right, targetCorners.top);
                    gCtx.lineTo(targetCorners.right, targetCorners.top+1);
                    gCtx.lineTo(targetCorners.left+1, targetCorners.bottom);
                    gCtx.lineTo(targetCorners.left, targetCorners.bottom);
                    gCtx.moveTo(targetCorners.left, targetCorners.top);
                    gCtx.closePath();
                    gCtx.fill();

                    gCtx.fillStyle="rgb(" + br.r + "," + br.g + "," + br.b + ")";
                    gCtx.beginPath();
                    gCtx.moveTo(targetCorners.right, targetCorners.top);
                    gCtx.lineTo(targetCorners.right, targetCorners.bottom);
                    gCtx.lineTo(targetCorners.left, targetCorners.bottom);
                    gCtx.moveTo(targetCorners.right, targetCorners.top);
                    gCtx.closePath();
                    gCtx.fill();

                    newTile = {
                        direction: 1,
                        triangles: [{r: tl.r, g: tl.g, b: tl.b}, {r: br.r, g: br.g, b: br.b}]
                    };
                    newRow.push(newTile);

                } else {
                    var tr = { 'r': parseInt((counter.top.r + counter.right.r)/2, 10), 'g': parseInt((counter.top.g + counter.right.g)/2, 10), 'b': parseInt((counter.top.b + counter.right.b)/2, 10) };
                    var bl = { 'r': parseInt((counter.bottom.r + counter.left.r)/2, 10), 'g': parseInt((counter.bottom.g + counter.left.g)/2, 10), 'b': parseInt((counter.bottom.b + counter.left.b)/2, 10) };

                    gCtx.fillStyle="rgb(" + tr.r + "," + tr.g + "," + tr.b + ")";
                    gCtx.beginPath();
                    gCtx.moveTo(targetCorners.left, targetCorners.top+1);
                    gCtx.lineTo(targetCorners.left, targetCorners.top);
                    gCtx.lineTo(targetCorners.right, targetCorners.top);
                    gCtx.lineTo(targetCorners.right, targetCorners.bottom);
                    gCtx.lineTo(targetCorners.right-1, targetCorners.bottom);
                    gCtx.lineTo(targetCorners.left, targetCorners.top+1);
                    gCtx.closePath();
                    gCtx.fill();

                    gCtx.fillStyle="rgb(" + bl.r + "," + bl.g + "," + bl.b + ")";
                    gCtx.beginPath();
                    gCtx.moveTo(targetCorners.left, targetCorners.top);
                    gCtx.lineTo(targetCorners.right, targetCorners.bottom);
                    gCtx.lineTo(targetCorners.left, targetCorners.bottom);
                    gCtx.lineTo(targetCorners.left, targetCorners.top);
                    gCtx.closePath();
                    gCtx.fill();

                    newTile = {
                        direction: 2,
                        triangles: [{r: tr.r, g: tr.g, b: tr.b}, {r: bl.r, g: bl.g, b: bl.b}]
                    };
                    newRow.push(newTile);

                }

            }

            flambientcam.tileStore.push(newRow);

        }

    },

    makeTileMap: function() {

        var w = 160;
        var h = 120;

        var tileObj = {
            across: flambientcam.tilesAcross,
            down: null,
            width: null,
            height: null,
            imgWidth: w,
            imgHeight: h
        };


        //  So, as we want the source tiles to be as square as possible we need to work out how many pixels wide,
        //  and then how many of those we can fit down (rounding up)
        tileObj.width = Math.floor(tileObj.imgWidth/tileObj.across);
        tileObj.down = Math.ceil(tileObj.imgHeight/tileObj.width);
        tileObj.height = Math.floor(tileObj.imgHeight/tileObj.down);

        //  Because maths is hard, and I don't want to have to work out which top, left, right, bottom quarter a pixel
        //  falls in, because it's late and I'm tired, instead I'm just going to draw an image with the 4 quarters
        //  in different colours. Then grab the image data back from the thing we just drew, looping over it and
        //  grabbing the colours back out, and stuffing the results into an array
        //
        //  This all makes perfect sense!!

        $('#tileMap').remove();
        $('#hiddenStuff').append($('<canvas>').attr({'id': 'tileMap'}));
        $('#tileMap').attr({'width': tileObj.width, 'height': tileObj.height});
        $('#tileMap').css({'width': tileObj.width + 'px', 'height': tileObj.height + 'px'});

        var tm=$('#tileMap')[0];
        var tmx=tm.getContext("2d");

        //  Top quarter
        tmx.fillStyle="rgb(0, 0, 255)";
        tmx.beginPath();
        tmx.moveTo(0, 0); tmx.lineTo(tileObj.width, 0); tmx.lineTo(tileObj.width/2, tileObj.height/2); tmx.lineTo(0, 0);
        tmx.closePath();
        tmx.fill();

        //  Right quarter
        tmx.fillStyle="rgb(255, 0, 0)";
        tmx.beginPath();
        tmx.moveTo(tileObj.width, 0); tmx.lineTo(tileObj.width, tileObj.height); tmx.lineTo(tileObj.width/2, tileObj.height/2); tmx.lineTo(tileObj.width, 0);
        tmx.closePath();
        tmx.fill();

        //  left quarter
        tmx.fillStyle="rgb(0, 255, 0)";
        tmx.beginPath();
        tmx.moveTo(0, 0); tmx.lineTo(0, tileObj.height); tmx.lineTo(tileObj.width/2, tileObj.height/2); tmx.lineTo(0, 0);
        tmx.closePath();
        tmx.fill();

        //  Bottom quarter
        tmx.fillStyle="rgb(255, 0, 255)";
        tmx.beginPath();
        tmx.moveTo(0, tileObj.height); tmx.lineTo(tileObj.width, tileObj.height); tmx.lineTo(tileObj.width/2, tileObj.height/2); tmx.lineTo(0, tileObj.height);
        tmx.closePath();
        tmx.fill();

        //  Ok, now we have that draw out let's grab the image data out and then
        //  work out which pixel is top, left, right or bottom
        var mapData = tmx.getImageData(0, 0, tileObj.width, tileObj.height);
        var tileMap = [];

        var pxlObj = {
          r: null,
          g: null,
          b: null,
          a: null
        };

        for (var x = 0; x < tileObj.width; x++) {
          tileMap[x] = [];
          for (var y = 0; y < tileObj.height; y++) {
            pxlObj.r = mapData.data[((y*tileObj.width)+x)*4+0];
            pxlObj.g = mapData.data[((y*tileObj.width)+x)*4+1];
            pxlObj.b = mapData.data[((y*tileObj.width)+x)*4+2];
            pxlObj.a = mapData.data[((y*tileObj.width)+x)*4+3];

            tileMap[x][y] = null;
            if (pxlObj.r < 32 && pxlObj.g < 32 && pxlObj.b > 192) tileMap[x][y] = 'top';
            if (pxlObj.r > 192 && pxlObj.g < 32 && pxlObj.b < 32) tileMap[x][y] = 'right';
            if (pxlObj.r < 32 && pxlObj.g > 192 && pxlObj.b < 32) tileMap[x][y] = 'left';
            if (pxlObj.r > 192 && pxlObj.g < 32 && pxlObj.b > 192) tileMap[x][y] = 'bottom';
          }
        }

        flambientcam.tileObj = tileObj;
        flambientcam.tileMap = tileMap;
    },

    //  This tries to create a mesh over in the control object
    createMesh: function() {

        if (flambientcam.tileStore.length != 15) return;
        if (control.rendering) return;

        var tempRows = $.extend(true, [], flambientcam.tileStore);

        //  Clear all the mesh objects from the scene

        //  make the 4 corner points
        var tl = new THREE.Vector3(-14, 14, 0);
        var tr = new THREE.Vector3(14, 14, 0);
        var bl = new THREE.Vector3(-14, -14, 0);
        var br = new THREE.Vector3(14, -14, 0);

        //  Add the new ones
        var newRow = null;
        var newTile = null;
        var geom = null;
        var color = new THREE.Color( 0xff0000 );
        var newMesh = null;

        this.clearScene();

        for (var y in tempRows) {
            newRow = tempRows[y];
            for (var x in newRow) {
                newTile = newRow[x];

                //  Do the first tri
                geom = new THREE.Geometry();
                if (newTile.direction == 1) {
                    geom.vertices.push( tl );
                    geom.vertices.push( tr );
                    geom.vertices.push( bl );
                } else {
                    geom.vertices.push( tl );
                    geom.vertices.push( tr );
                    geom.vertices.push( br );
                }
                geom.faces.push( new THREE.Face3( 0, 2, 1 ) );
                geom.computeFaceNormals();

                color.setRGB(newTile.triangles[0].r / 255, newTile.triangles[0].g / 255, newTile.triangles[0].b / 255);
                newMesh = new THREE.Mesh( geom, new THREE.MeshBasicMaterial( { color: color, wireframe: true } ) );
                newMesh.position.x = (x-10)*20;
                newMesh.position.y = (((15-y)-7.5)*20) + 300;
                newMesh.position.z = ((newTile.triangles[0].r + newTile.triangles[0].g + newTile.triangles[0].b) / 3 / 255) * -40;
                control.scene.add(newMesh);

                //  Do the second tri
                geom = new THREE.Geometry();
                if (newTile.direction == 1) {
                    geom.vertices.push( tr );
                    geom.vertices.push( br );
                    geom.vertices.push( bl );
                } else {
                    geom.vertices.push( tl );
                    geom.vertices.push( br );
                    geom.vertices.push( bl );
                }
                geom.faces.push( new THREE.Face3( 0, 2, 1 ) );
                geom.computeFaceNormals();

                color.setRGB(newTile.triangles[1].r / 255, newTile.triangles[1].g / 255, newTile.triangles[1].b / 255);
                newMesh = new THREE.Mesh( geom, new THREE.MeshBasicMaterial( { color: color, wireframe: true } ) );
                newMesh.position.x = (x-10)*20;
                newMesh.position.y = (((15-y)-7.5)*20) + 300;
                newMesh.position.z = ((newTile.triangles[1].r + newTile.triangles[1].g + newTile.triangles[1].b) / 3 / 255) * 40;
                control.scene.add(newMesh);

            }
        }

    },

    clearScene: function() {

        var oldObject = null;
        var objNumber = control.scene.__objects.length;
        for (var i = 0; i < objNumber; i++) {
            oldObject = control.scene.__objects[0];
            control.scene.remove(oldObject);
            //control.renderer.deallocateObject(oldObject);
        }

    }

};

utils = {

    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  DO NOWT
        }
    }

};