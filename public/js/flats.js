var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.requestAnimationFrame = requestAnimationFrame;

var v, canvas, gCtx;
var backBuffer = document.createElement('canvas');
var bCtx = backBuffer.getContext('2d');


cubes = {

    webcam: null,
    canvas: null,
    gCtx: null,
    backBuffer: null,
    bCtx: null,
    imageData: null,
    tilesAcross: 20,
    tileStore: [],
    hasImage: false,
    baseWidth: 40,
    baseHeight: 30,

    init: function() {

        utils.log('here');


        v = document.getElementById('webcam');
        canvas = document.getElementById('webcamcanvas');
        gCtx = canvas.getContext('2d');

        //cubes.makeTileMap();

        navigator.webkitGetUserMedia({video:true}, cubes.callbackStreamIsReady);

        setInterval(function() {
            cubes.createMesh();
        }, 60);
    },

    callbackStreamIsReady: function(stream) {

        v.src = URL.createObjectURL(stream);
        v.play();
        window.requestAnimationFrame(cubes.makeFrame);

    },

    makeFrame: function() {

        var w = cubes.baseWidth;
        var h = cubes.baseHeight;

        backBuffer.width = w;
        backBuffer.height = h;

        //  copy the image from the video into the background bugger
        bCtx.translate(w, 0);
        bCtx.scale(-1, 1);
        bCtx.drawImage(v, 0, 0, w, h);

        var imageData = bCtx.getImageData(0, 0, w, h);
        cubes.imageData = imageData;


        //flambientcam.renderFrame();

        var pixels = bCtx.getImageData(0, 0, w, h);
        gCtx.putImageData(pixels, 0, 0);

        cubes.hasImage = true;

        window.requestAnimationFrame(cubes.makeFrame);
    },


    //  This tries to create a mesh over in the control object
    createMesh: function() {

        if (!cubes.hasImage) return;
        if (control.rendering) return;

        var cubeSize = 5;
        var newMesh = null;
        var color = new THREE.Color( 0xff0000 );
        var cube = new THREE.CubeGeometry( cubeSize, cubeSize, cubeSize );

        var tl = new THREE.Vector3(-cubeSize,  cubeSize, 0);
        var tr = new THREE.Vector3( cubeSize,  cubeSize, 0);
        var bl = new THREE.Vector3(-cubeSize, -cubeSize, 0);
        var br = new THREE.Vector3( cubeSize, -cubeSize, 0);

        var newScale = 1;
        var r = null;
        var g = null;
        var b = null;

        if (control.scene.__objects.length === 0) {
            for (var y = 0; y < this.baseHeight; y++) {
                for (var x = 0; x < this.baseWidth; x++) {
                    r = cubes.imageData.data[(y*this.baseWidth+x)*4]/255;
                    g = cubes.imageData.data[(y*this.baseWidth+x)*4+1]/255;
                    b = cubes.imageData.data[(y*this.baseWidth+x)*4+2]/255;
                    color.setRGB(r, g, b);
                    geom = new THREE.Geometry();
                    geom.vertices.push( tl );
                    geom.vertices.push( tr );
                    geom.vertices.push( br );
                    geom.vertices.push( bl );
                    geom.faces.push( new THREE.Face4( 0, 3, 2, 1 ) );
                    geom.computeFaceNormals();
                    newMesh = new THREE.Mesh( geom, new THREE.MeshBasicMaterial( { color: color, wireframe: true } ) );
                    newMesh.position.x = ((x-(this.baseWidth/2)+1)*cubeSize*2)-(cubeSize);
                    newMesh.position.y = (((this.baseHeight-y)-(this.baseHeight/2))*cubeSize*2)-(cubeSize) + 300;
                    newMesh.position.z = ((r+g+b)/3)*10;
                    //newCube.rotation.setX(Math.random() * 360 * Math.PI/180);
                    //newCube.rotation.setY(Math.random() * 360 * Math.PI/180);
                    //newCube.rotation.setZ(Math.random() * 360 * Math.PI/180);
                    newScale = ((1-((r+g+b)/3))*2.0)+1.0;
                    newMesh.scale = {x: newScale, y: newScale, z: newScale};
                    control.scene.add(newMesh);
                }
            }
        } else {
            for (var y = 0; y < this.baseHeight; y++) {
                for (var x = 0; x < this.baseWidth; x++) {
                    r = cubes.imageData.data[(y*this.baseWidth+x)*4]/255;
                    g = cubes.imageData.data[(y*this.baseWidth+x)*4+1]/255;
                    b = cubes.imageData.data[(y*this.baseWidth+x)*4+2]/255;
                    newMesh = control.scene.__objects[(y*this.baseWidth)+x];
                    color.setRGB(r, g, b);
                    newMesh.material.color.r = r;
                    newMesh.material.color.g = g;
                    newMesh.material.color.b = b;
                    newMesh.position.z = ((r+g+b)/3)*10;
                    //newCube.rotation.setX(Math.random() * 360 * Math.PI/180);
                    //newCube.rotation.setY(Math.random() * 360 * Math.PI/180);
                    //newCube.rotation.setZ(Math.random() * 360 * Math.PI/180);
                    newScale = ((1-((r+g+b)/3))*2.0)+1.0;
                    newMesh.scale = {x: newScale, y: newScale, z: newScale};
                }
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