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
    baseWidth: 20,
    baseHeight: 15,
    counter: 0,
    s: null,

    init: function() {

        utils.log('here');
        this.s = new SimplexNoise();

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

        var cubeSize = 20;
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

            var vertexShader = document.getElementById( 'vertexShader' ).textContent;
            var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
            var attributesQuads = { center: { type: 'v4', boundTo: 'faceVertices', value: [] } };
            var valuesQuads = attributesQuads.center.value;
            setupAttributes( cube, valuesQuads );
            var materialQuads = new THREE.ShaderMaterial( { uniforms: {}, attributes: attributesQuads, vertexShader: vertexShader, fragmentShader: fragmentShader } );        

            for (var y = 0; y < this.baseHeight; y++) {
                for (var x = 0; x < this.baseWidth; x++) {
                    r = cubes.imageData.data[(y*this.baseWidth+x)*4]/255;
                    g = cubes.imageData.data[(y*this.baseWidth+x)*4+1]/255;
                    b = cubes.imageData.data[(y*this.baseWidth+x)*4+2]/255;
                    color.setRGB(r, g, b);
                    //newCube = new THREE.Mesh( cube, materialQuads );
                    newCube = new THREE.Mesh( cube, new THREE.MeshLambertMaterial( { color: color, ambient: color, side: THREE.DoubleSide } ) );
                    newCube.position.x = ((x-(this.baseWidth/2)+1)*cubeSize)-(cubeSize/2);
                    newCube.position.y = (((this.baseHeight-y)-(this.baseHeight/2))*cubeSize)-(cubeSize/2) + 300;
                    newCube.position.z = ((r+g+b)/3)*50;
                    //newCube.rotation.setX(((Math.random() * 30)-15) * Math.PI/180);
                    //newCube.rotation.setY(((Math.random() * 30)-15) * Math.PI/180);
                    //newCube.rotation.setZ(((Math.random() * 30)-15) * Math.PI/180);
                    
                    /*
                    newCube.rotation.setX(cubes.s.noise(y+cubes.counter/100,x+cubes.counter/200) * 180 * Math.PI/180);
                    newCube.rotation.setY(cubes.s.noise(x+cubes.counter/100,y+cubes.counter/200) * 180 * Math.PI/180);
                    */

                    newCube.scale = {x: newScale, y: newScale, z: newScale};
                    control.scene.add(newCube);
                }
            }

            var light = new THREE.DirectionalLight( 0x999999 );
            light.position.set( 0, 0, 600 );
            control.scene.add( light );
            var light2 = new THREE.DirectionalLight( 0x666666 );
            light2.position.set( 200, 150, 200 );
            control.scene.add( light2 );
            var ambientLight = new THREE.AmbientLight(0x666666);
            control.scene.add(ambientLight);            

        } else {
            for (var y = 0; y < this.baseHeight; y++) {
                for (var x = 0; x < this.baseWidth; x++) {
                    r = cubes.imageData.data[(y*this.baseWidth+x)*4]/255;
                    g = cubes.imageData.data[(y*this.baseWidth+x)*4+1]/255;
                    b = cubes.imageData.data[(y*this.baseWidth+x)*4+2]/255;
                    newCube = control.scene.__objects[(y*this.baseWidth)+x];
                    color.setRGB(r, g, b);
                    newCube.material.color.r = r;
                    newCube.material.color.g = g;
                    newCube.material.color.b = b;
                    newCube.position.z = ((r+g+b)/3)*50;
                    
                    /*
                    newCube.rotation.setX(cubes.s.noise(y+cubes.counter/100,x+cubes.counter/200) * 180 * Math.PI/180);
                    newCube.rotation.setY(cubes.s.noise(x+cubes.counter/100,y+cubes.counter/200) * 180 * Math.PI/180);
                    */
                    newScale = ((1-((r+g+b)/3))*1.5)+0.8;
                    newCube.scale = {x: newScale, y: newScale, z: newScale};
                }
            }
        }

        cubes.counter++;
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

function setupAttributes( geometry, values ) {

    for( var f = 0; f < geometry.faces.length; f ++ ) {
        var face = geometry.faces[ f ];
        if ( face instanceof THREE.Face3 ) {
            values[ f ] = [ new THREE.Vector4( 1, 0, 0, 0 ), new THREE.Vector4( 0, 1, 0, 0 ), new THREE.Vector4( 0, 0, 1, 0 ) ];
        } else {
            values[ f ] = [ new THREE.Vector4( 1, 0, 0, 1 ), new THREE.Vector4( 1, 1, 0, 1 ), new THREE.Vector4( 0, 1, 0, 1 ), new THREE.Vector4( 0, 0, 0, 1 ) ];
        }
    }
}


// Ported from Stefan Gustavson's java implementation
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com
 
/**
 * You can pass in a random number generator object if you like.
 * It is assumed to have a random() method.
 */
var SimplexNoise = function(r) {
    if (r == undefined) r = Math;
  this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
                                 [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
                                 [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]; 
  this.p = [];
  for (var i=0; i<256; i++) {
      this.p[i] = Math.floor(r.random()*256);
  }
  // To remove the need for index wrapping, double the permutation table length 
  this.perm = []; 
  for(var i=0; i<512; i++) {
        this.perm[i]=this.p[i & 255];
    } 
 
  // A lookup table to traverse the simplex around a given point in 4D. 
  // Details can be found where this table is used, in the 4D noise method. 
  this.simplex = [ 
    [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0], 
    [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0], 
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
    [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0], 
    [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0], 
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
    [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0], 
    [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]; 
};
 
SimplexNoise.prototype.dot = function(g, x, y) { 
    return g[0]*x + g[1]*y;
};
 
SimplexNoise.prototype.noise = function(xin, yin) { 
  var n0, n1, n2; // Noise contributions from the three corners 
  // Skew the input space to determine which simplex cell we're in 
  var F2 = 0.5*(Math.sqrt(3.0)-1.0); 
  var s = (xin+yin)*F2; // Hairy factor for 2D 
  var i = Math.floor(xin+s); 
  var j = Math.floor(yin+s); 
  var G2 = (3.0-Math.sqrt(3.0))/6.0; 
  var t = (i+j)*G2; 
  var X0 = i-t; // Unskew the cell origin back to (x,y) space 
  var Y0 = j-t; 
  var x0 = xin-X0; // The x,y distances from the cell origin 
  var y0 = yin-Y0; 
  // For the 2D case, the simplex shape is an equilateral triangle. 
  // Determine which simplex we are in. 
  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords 
  if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1) 
  else {i1=0; j1=1;}      // upper triangle, YX order: (0,0)->(0,1)->(1,1) 
  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and 
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where 
  // c = (3-sqrt(3))/6 
  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords 
  var y1 = y0 - j1 + G2; 
  var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords 
  var y2 = y0 - 1.0 + 2.0 * G2; 
  // Work out the hashed gradient indices of the three simplex corners 
  var ii = i & 255; 
  var jj = j & 255; 
  var gi0 = this.perm[ii+this.perm[jj]] % 12; 
  var gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12; 
  var gi2 = this.perm[ii+1+this.perm[jj+1]] % 12; 
  // Calculate the contribution from the three corners 
  var t0 = 0.5 - x0*x0-y0*y0; 
  if(t0<0) n0 = 0.0; 
  else { 
    t0 *= t0; 
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);  // (x,y) of grad3 used for 2D gradient 
  } 
  var t1 = 0.5 - x1*x1-y1*y1; 
  if(t1<0) n1 = 0.0; 
  else { 
    t1 *= t1; 
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); 
  }
  var t2 = 0.5 - x2*x2-y2*y2; 
  if(t2<0) n2 = 0.0; 
  else { 
    t2 *= t2; 
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); 
  } 
  // Add contributions from each corner to get the final noise value. 
  // The result is scaled to return values in the interval [-1,1]. 
  return 70.0 * (n0 + n1 + n2); 
};
 
// 3D simplex noise 
SimplexNoise.prototype.noise3d = function(xin, yin, zin) { 
  var n0, n1, n2, n3; // Noise contributions from the four corners 
  // Skew the input space to determine which simplex cell we're in 
  var F3 = 1.0/3.0; 
  var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D 
  var i = Math.floor(xin+s); 
  var j = Math.floor(yin+s); 
  var k = Math.floor(zin+s); 
  var G3 = 1.0/6.0; // Very nice and simple unskew factor, too 
  var t = (i+j+k)*G3; 
  var X0 = i-t; // Unskew the cell origin back to (x,y,z) space 
  var Y0 = j-t; 
  var Z0 = k-t; 
  var x0 = xin-X0; // The x,y,z distances from the cell origin 
  var y0 = yin-Y0; 
  var z0 = zin-Z0; 
  // For the 3D case, the simplex shape is a slightly irregular tetrahedron. 
  // Determine which simplex we are in. 
  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords 
  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords 
  if(x0>=y0) { 
    if(y0>=z0) 
      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order 
      else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order 
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order 
    } 
  else { // x0<y0 
    if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order 
    else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order 
    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order 
  } 
  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z), 
  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and 
  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where 
  // c = 1/6.
  var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords 
  var y1 = y0 - j1 + G3; 
  var z1 = z0 - k1 + G3; 
  var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords 
  var y2 = y0 - j2 + 2.0*G3; 
  var z2 = z0 - k2 + 2.0*G3; 
  var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords 
  var y3 = y0 - 1.0 + 3.0*G3; 
  var z3 = z0 - 1.0 + 3.0*G3; 
  // Work out the hashed gradient indices of the four simplex corners 
  var ii = i & 255; 
  var jj = j & 255; 
  var kk = k & 255; 
  var gi0 = this.perm[ii+this.perm[jj+this.perm[kk]]] % 12; 
  var gi1 = this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12; 
  var gi2 = this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12; 
  var gi3 = this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12; 
  // Calculate the contribution from the four corners 
  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0; 
  if(t0<0) n0 = 0.0; 
  else { 
    t0 *= t0; 
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0); 
  }
  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1; 
  if(t1<0) n1 = 0.0; 
  else { 
    t1 *= t1; 
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1); 
  } 
  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2; 
  if(t2<0) n2 = 0.0; 
  else { 
    t2 *= t2; 
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2); 
  } 
  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3; 
  if(t3<0) n3 = 0.0; 
  else { 
    t3 *= t3; 
    n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3); 
  } 
  // Add contributions from each corner to get the final noise value. 
  // The result is scaled to stay just inside [-1,1] 
  return 32.0*(n0 + n1 + n2 + n3); 
};