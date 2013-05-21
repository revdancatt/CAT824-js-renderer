control = {

    //  Here's all the "global" stuff that we want to have access
    //  to most of the time.

    //  The camera, scene and renderer vars are all to do with THREE.js
    //  this will give us access them (to move around etc.) at any time
    camera: null,
    scene: null,
    renderer: null,

    //  Now we want to keep track of where we want to move the camera
    //  do. We basically have a camera that sits on a "dolly" that
    //  tracks around the target, rather like this...
    /*
          #####
       ###     ###
      #           #
     #             #
     C------t      #
     #             #
      #           #
       ###     ###
          #####
    */
    // As the camera moves round the track it will always point into 
    //  the middle. This is a bit of an odd way to control a camera but
    //  it'll allow us to move 360 degree around an object.

    //  The position is going to record how far around we are, 0-359
    //  and what the radius of the track is. So we can make the track
    //  larger to move the camera away from the target and smaller, etc.
    //
    //  We do two more things, we can adjust the height of the camera and
    //  the height of the target. So we can raise the camera above the target
    //  or the target up above the camera. Somewhat like this...
    /*

    C             t
    |\           /|
    | \         / |
    |  \       /  |
    |   \     /   |
    |    t   C    |
    |    |   |    |
    ######   ######

    */
    //  The position holds all this infomation
    position: {around: 90.0, radius: 600.0, height: 300.0, lookat: 100.0},

    //  There's also a bit going on about adjusting the camera position
    //  rather than just moving it as I press down keys I'm actually
    //  adjusting the "velocity" at which the object is being moved
    //  This isn't important but I quite like it as it gives it a bit
    //  more of a flow feel.
    velocity: {around: 0.0, radius: 0.0, height: 0.0, lookat: 0.0},


    //  I want to keep track of which keys are currently being
    //  held down so I can react to them. I'm tracking the 
    //  cursor keys (up/down/left/right) and the extra keys
    //  to move the camera and target up and down
    keyControls: {
        isUpDown: false,
        isDownDown: false,
        isLeftDown: false,
        isRightDown: false,
        isCameraUpDown: false,
        isCameraDownDown: false,
        isTargetUpDown: false,
        isTargetDownDown: false
    },

    //  I should use some kind of long polling or handy node websockets
    //  stuff. But because I can't be bothered I'm just going to check to
    //  see if the render has finished by polling the backend once every
    //  second. This timer is going to be used for that.
    fileCheckTmr: null,

    //  The size stuff goes here
    baseWidth: 400,
    baseHeight: 225,


    //  This functions sets everything up...
    init: function() {

        //  First of we are going to set the scene
        //  we do this by creating a camera, scene and renderer as part
        //  of THREE.
        //  We are going to be working with the dimensions set in the CSS
        //  for the .threeHolder and the renderer will throw the canvas
        //  it's going to use into the DOM.

        this.camera = new THREE.PerspectiveCamera( 35, this.baseWidth / this.baseHeight, 1, 10000 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.CanvasRenderer();
        this.renderer.setSize( $('.threeHolder').width(), $('.threeHolder').height() );
        $('.threeHolder').append( $(this.renderer.domElement) );

        //  Now we are going to create a handy material, two ball objects that's
        //  are kind of fun to throw around for testing, a cube and a floor object.
        //  We may or may not use these when testing.
        var material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } );
        var solidMaterial = new THREE.MeshBasicMaterial( { color: 0x999999 } );
        var ball = new THREE.SphereGeometry( 100, 8, 8 );
        var floor = new THREE.PlaneGeometry( 2000, 2000, 10, 10 );
        var smallBall = new THREE.SphereGeometry( 50, 6, 6 );
        var cube = new THREE.CubeGeometry( 100, 100, 100 );
        var newScale = null;


        //  The below three lines will add a "floor" to the scene
        //  that we render on the client --- not sure if it
        //  gets passed to the backend, I guess I should check
        /*
        this.scene.add( new THREE.Mesh( floor, material ) );
        this.scene.children[0].name = "floor";
        this.scene.children[0].rotation.setX(-90 * Math.PI/180);
        */

        //  The small loop below will add 20 randomly positioned
        //  Cobra Mk3s from Elite to the scene, so we can
        //  see an example of a mesh being added to THREE and
        //  getting correctly passed back to the backend.
        /*
        for (var i = 1; i < 20; i++) {
            this.scene.add( this.makeCobra(i) );
        }
        */

        //  This loop will add 80 randomly positioned and sized
        //  cubes to the scene. Sunflow doesn't have a "cube" or "box"
        //  primative object, so this is a good test of converting
        //  a THREE primative into a mesh that's usable by Sunflow
        var newCube = null;
        var color = new THREE.Color( 0xff0000 );
        for (var i = 1; i < 280; i++) {
            newScale = Math.random() + 0.25;
            color.setRGB(Math.random(), Math.random(), Math.random());
            newCube = new THREE.Mesh( cube, new THREE.MeshBasicMaterial( { color: color, wireframe: true } ));
            newCube.position.x = Math.floor(Math.random() * 600) - 300;
            newCube.position.y = 50 + Math.floor(Math.random() * 400);
            newCube.position.z = Math.floor(Math.random() * 600) - 300;

            //  Uncomment these three lines if you want the cubes to be
            //  all rotated and stuff!
            newCube.rotation.setX(Math.random() * 360 * Math.PI/180);
            newCube.rotation.setY(Math.random() * 360 * Math.PI/180);
            newCube.rotation.setZ(Math.random() * 360 * Math.PI/180);

            newCube.scale = {x: newScale, y: newScale, z: newScale};
            newCube.name = 'Cube-' + (i + 5);
            this.scene.add(newCube);
        }

        //  The loop below would add 20 variously positioned spheres
        //  to the scene. Both THREE and Sunflow have a primative sphere
        //  so when we come to send this to the backend all we have
        //  to do is send the position and radius which is nice.
        /*
        var newBall = null;
        for (var i = 1; i < 20; i++) {
            newScale = Math.random() + 0.5;
            newBall = new THREE.Mesh( ball, material );
            newBall.position.x = Math.floor(Math.random() * 600) - 300;
            newBall.position.y = 50 + Math.floor(Math.random() * 400);
            newBall.position.z = Math.floor(Math.random() * 600) - 300;
            newBall.scale = {x: newScale, y: newScale, z: newScale};
            newBall.name = 'Ball-' + (i + 5);
            this.scene.add(newBall);
        }
        */



        //  Ok, so we've built the scene, now I'm going to bind all the key control flags
        //  to the keypressed.
        //  NOTE: They don't actually do anything themselves as such, that all happens
        //  in the animation loop. The only thing that really triggers an action
        //  is "r" for render
        $(document).bind('keydown', function(e) {
            if (e.keyCode == 38) control.keyControls.isUpDown = true;           //  cursor up key
            if (e.keyCode == 40) control.keyControls.isDownDown = true;         //  cursor down key
            if (e.keyCode == 39) control.keyControls.isRightDown = true;        //  cursor right key
            if (e.keyCode == 37) control.keyControls.isLeftDown = true;         //  cursor left key
            if (e.keyCode == 81) control.keyControls.isCameraUpDown = true;     //  cursor up key
            if (e.keyCode == 65) control.keyControls.isCameraDownDown = true;   //  cursor down key
            if (e.keyCode == 87) control.keyControls.isTargetUpDown = true;     //  cursor right key
            if (e.keyCode == 83) control.keyControls.isTargetDownDown = true;   //  cursor left key

            //  if we have told it to render do that here
            //  NOTE: We are sending over the scene object even
            //  thought the render function would have access to it
            //  anyway. We are doing this so in theory we can throw 
            //  *any* THREE scene that has been created in a different
            //  way. We could just take the render function and 
            //  stick it onto something else.
            //  
            //  TODO: move the render function out of control and into
            //  a different object, just to prove the point.
            if (e.keyCode == 82) control.render(control.scene, control.camera, control.renderer);

        });

        //  All the same keys, but you know, letting go of them.
        $(document).bind('keyup', function(e) {
            if (e.keyCode == 38) control.keyControls.isUpDown = false;          //  cursor up key
            if (e.keyCode == 40) control.keyControls.isDownDown = false;        //  cursor down key
            if (e.keyCode == 39) control.keyControls.isRightDown = false;       //  cursor right key
            if (e.keyCode == 37) control.keyControls.isLeftDown = false;        //  cursor left key
            if (e.keyCode == 81) control.keyControls.isCameraUpDown = false;    //  cursor up key
            if (e.keyCode == 65) control.keyControls.isCameraDownDown = false;  //  cursor down key
            if (e.keyCode == 87) control.keyControls.isTargetUpDown = false;    //  cursor right key
            if (e.keyCode == 83) control.keyControls.isTargetDownDown = false;  //  cursor left key
        });

        this.animate();

    },


    //  This function deals with all the camera moving stuff and so on,
    //  it's awesome
    animate: function() {


        // note: three.js includes requestAnimationFrame shim
        requestAnimationFrame( control.animate );

        //  Dampening is how quickly the movement slides to a halt
        //  after you take your finger off a key.
        //  maxTurn is the maximum velocity that we can move each
        //  frame.
        //
        //  TODO:
        //  Add a Shift modifier key so we can have precise movements
        //  for fine tuning the view.
        var dampening = 0.9;
        var maxTurn = 2;

        //  dampen the velocities
        //  Do this stops movement from being an on/off thing but a bit more
        //  swooshy and smooth :)
        control.velocity.around = control.velocity.around * dampening;
        control.velocity.radius = control.velocity.radius * dampening;
        control.velocity.height = control.velocity.height * dampening;
        control.velocity.lookat = control.velocity.lookat * dampening;

        //  This controls the value we are going to increase the movement
        //  *around* the middle point, to the left and right
        if (control.keyControls.isLeftDown) {
            control.velocity.around++;
            if (control.velocity.around > maxTurn) control.velocity.around = maxTurn;
        }

        if (control.keyControls.isRightDown) {
            control.velocity.around--;
            if (control.velocity.around < -maxTurn) control.velocity.around = -maxTurn;
        }

        
        //  And now increase and decrease the radius of the track on which the 
        //  camera is going round on. Essentially moves the camera in and out of
        //  the scene.
        if (control.keyControls.isUpDown) {
            control.velocity.radius--;
            if (control.velocity.radius < -maxTurn) control.velocity.radius = -maxTurn;
        }

        if (control.keyControls.isDownDown) {
            control.velocity.radius++;
            if (control.velocity.radius > maxTurn) control.velocity.radius = maxTurn;
        }


        //  Now for the camera height
        if (control.keyControls.isCameraUpDown) {
            control.velocity.height+=2;
            if (control.velocity.height > maxTurn*2) control.velocity.height = maxTurn*2;
        }

        if (control.keyControls.isCameraDownDown) {
            control.velocity.height-=2;
            if (control.velocity.height < -maxTurn*2) control.velocity.height = -maxTurn*2;
        }


        //  Finally the lookat height
        if (control.keyControls.isTargetUpDown) {
            control.velocity.lookat+=2;
            if (control.velocity.lookat > maxTurn*2) control.velocity.lookat = maxTurn*2;
        }

        if (control.keyControls.isTargetDownDown) {
            control.velocity.lookat-=2;
            if (control.velocity.lookat < -maxTurn*2) control.velocity.lookat = -maxTurn*2;
        }

        //  Now that we've got our new velocity, we can adjust the position values.
        control.position.around += control.velocity.around;
        control.position.radius += control.velocity.radius;
        control.position.height += control.velocity.height;
        control.position.lookat += control.velocity.lookat;

        //  Calculate the x,z position of the camera (i.e. convert the angle and radius
        //  to co-ordinates we can use)
        var x = control.position.radius * Math.cos(control.position.around * Math.PI / 180);
        var z = control.position.radius * Math.sin(control.position.around * Math.PI / 180);

        //  Set the position and height of the camera
        control.camera.position.x = x;
        control.camera.position.z = z;
        control.camera.position.y = control.position.height;

        //  Set the target of the camera.
        control.camera.lookAt(new THREE.Vector3( 0, control.position.lookat, 0 ));

        //  render the scene again with the scene and camera
        control.renderer.render( control.scene, control.camera );

    },


    //  Now this is stupid function that adds a Cobra Mk3 from Elite to the scene
    //  (or rather returns a mesh that can be added to the scene)
    //
    //  This is here as an example of how to build a mesh. We try and keep everything
    //  down to Tris, but we can handle Quads if needed. Good rule though; 3 points per
    //  polygon thanks.
    makeCobra: function(id) {

        //  Make a basic mesh
        var material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } );

        //  Set the initial scale modifier
        var scale = 2;

        //  Here are all the vertices used on the ship
        var points = [
                {x:32*scale, y:0*scale, z: 76*scale},
                {x:-32*scale, y:0*scale, z:76*scale},
                {x:0*scale, y: 26*scale, z:24*scale},
                {x:-120*scale, y: -3*scale, z:-8*scale},
                {x:120*scale, y: -3*scale, z:-8*scale},
                {x:-88*scale, y: 16*scale, z:-40*scale},
                {x:88*scale, y: 16*scale, z:-40*scale},
                {x:128*scale, y: -8*scale, z:-40*scale},
                {x:-128*scale, y: -8*scale, z:-40*scale},
                {x:0*scale, y: 26*scale, z:-40*scale},
                {x:-32*scale, y: -24*scale, z:-40*scale},
                {x:32*scale, y: -24*scale, z:-40*scale},
                {x:-0.25*scale, y:0*scale, z:76*scale},
                {x:0*scale, y:0*scale, z:86*scale},
                {x:0.25*scale, y:0*scale, z:76*scale}
            ];

        //  Now all the faces, see easy :)
        var polygons = [
                [0, 1, 2],
                [0, 11, 10],
                [0, 10, 1],
                [0, 2, 6],
                [0, 6, 4],
                [0, 4, 7],
                [0, 7, 11],
                [1, 5, 2],
                [1, 3, 5],
                [1, 10, 8],
                [1, 8, 3],
                [2, 5, 9],
                [2, 9, 6],
                [3, 8, 5],
                [4, 6, 7],
                [12, 13, 14],
                [12, 14, 13],
                [5, 8, 10],
                [5, 10, 9],
                [11, 7, 6],
                [11, 6, 9],
                [9, 10, 11]
            ];

        //  Now we ned a new Geometry object which is what everything's going to
        //  be built on
        var geom = new THREE.Geometry();

        //  Add all the points.
        for (var p in points) {
            geom.vertices.push( new THREE.Vector3(points[p].x, points[p].y, points[p].z));
        }

        //  Make all the faces
        for (var pl in polygons) {

            //  Check to see if we have 3 or 4 points, any more (or less) than that
            //  and frankly you're on your own.
            if (polygons[pl].length == 3) {
                geom.faces.push( new THREE.Face3( polygons[pl][2], polygons[pl][1], polygons[pl][0] ) );
            }

            if (polygons[pl].length == 4) {
                geom.faces.push( new THREE.Face4( polygons[pl][3], polygons[pl][2], polygons[pl][1], polygons[pl][0] ) );
            }

        }

        //  Compute the normals, not that we really need to do this much because Sunflow doesn't
        //  care for the type of illumination we are doing and we're just doing wireframe
        //  here in THREE
        geom.computeFaceNormals();

        //  We're going to make all the ships different sizes, so the new scale mod
        //  will be anything from 0.25-0.50
        var newScale = (Math.random()/4) + 0.25;

        //  Make the mesh, add the geometry then position, rotate and scale it.
        var newMesh = new THREE.Mesh( geom, material );
        newMesh.position.x = Math.floor(Math.random() * 600) - 300;
        newMesh.position.y = 50 + Math.floor(Math.random() * 400);
        newMesh.position.z = Math.floor(Math.random() * 600) - 300;
        newMesh.rotation.setX(Math.random() * 360 * Math.PI/180);
        newMesh.rotation.setY(Math.random() * 360 * Math.PI/180);
        newMesh.rotation.setZ(Math.random() * 360 * Math.PI/180);
        newMesh.scale = {x: newScale, y: newScale, z: newScale};

        //  Give it a name
        newMesh.name = 'Cobra-' + id;

        //  TODO: Give it a colour

        //  ...and, return the mesh.
        return newMesh;

    },

    //  This function goes through the camera position, the target
    //  and all the objects in the scene
    //  It bundles all that up into a JSON object which it POSTS
    //  to the node.js backend, which will use all of that to
    //  write the .sc file needed for Sunflow and kick off the rendering
    //
    //  In theory this would be nice if we could *just* send the
    //  scene and camera over. Which we can, but I'm still accessing
    //  the target which we hold on control.
    //
    //  I'm not sure how to get the target from *just* the camera info
    //  without having to run the calculations backwards from its
    //  rotations... which I *can* just not quite yet, need a coffee
    //  first and I don't drink coffee.
    //
    //  So for the moment, let's just pretend that it's *nearly*
    //  totally free from "knowing" control stuff
    render: function(scene, camera, renderer) {

        //  COSMETIC, update the display to show that we are
        //  rendering
        try {
            $('.outputHolder').empty().text('Rendering...');
        } catch(er) {
            //  do nowt            
        }

        //  First of all we are going to work out a bunch of
        //  parameters to deal with, make the empty param thing
        var params = {};

        //  send over the dimensions, which come from the
        //  renderer. There's probably a better way of asking
        //  the renderer for this information, but for the
        //  moment let's go directly for the throat.
        params.size = {
            width: this.baseWidth,
            height: this.baseHeight
        };

        //  In our interface we have a radio button for the output
        //  size of the final render, 50%, 100%, 200%, 400%
        //  we'll default to 1 and then use the values if we have them
        //  I should move this into the function call of course
        //  but for the moment this will do.
        var sizeMod = 1;
        try {
            sizeMod = parseInt($('input:radio[name=size]:checked').val(), 10) / 100;
        } catch(er) {
            // do nowt
        }
        params.size.width = params.size.width * sizeMod;
        params.size.height = params.size.height * sizeMod;


        //  set it to high quality by default, low if we have access to
        //  the radio button. We should *also* move this into
        //  values passed into the function
        params.quality = 'high';
        try {
            if ($(jQuery('input[name=quality]')[1]).prop('checked')) {
                params.quality = 'low';
            }
        } catch(er) {
            // do nowt
        }


        //  add the camera
        //  TODO, work out the lookat position from the camera, not directly
        //  from the control object
        params.camera = {
            fov: camera.fov,
            position: {x: parseFloat(camera.position.x), y: parseFloat(camera.position.y), z: parseFloat(camera.position.z)},
            lookat: {x: 0, y: control.position.lookat, z: 0},
            aspect: params.size.width / params.size.height
        };

        //  Now throw all the objects in, set up all the vars
        //  we are going to be using, 'cause reasons
        params.objects = [];
        var mesh = null;
        var meshes = scene.getDescendants();
        var object = {};
        var newVertics = null;

        //  go thru all the meshes in the scene
        for (var i in meshes) {

            mesh = meshes[i];
            object = {};

            //  Try and grab the colour from the model
            if ('material' in mesh && 'color' in mesh.material) {
                object.colour = {
                    r: mesh.material.color.r,
                    g: mesh.material.color.g,
                    b: mesh.material.color.b
                };
            }

            //  Find out what type of object it is, so we can handle it
            //  in different ways
            //
            //  There is probably a better way of detecting a SPHERE than this
            //  but for the moment this will do. If there is a "Radius" in 
            //  the geometry the let's *assume* it's a sphere, otherwise
            //  let's *assume* it's a mesh object
            if ('geometry' in mesh && 'radius' in mesh.geometry) {

                //  if it's a sphere then we can jyst do that here
                object.type = 'sphere';
                object.position = {x: parseFloat(mesh.position.x), y: parseFloat(mesh.position.y), z: parseFloat(mesh.position.z)};
                object.radius = parseFloat(mesh.geometry.radius);

            } else if ('geometry' in mesh && 'vertices' in mesh.geometry && 'faces' in mesh.geometry) {

                //  otherwise it's a mesh and we need to pass over the vertices and faces
                object.type = 'mesh';
                object.vertices = [];
                object.faces = [];

                //  Go through all the vertices
                for (var v in mesh.geometry.vertices) {

                    //  convert the vertices from local to world locations (so we don't
                    //  have to pass the rotation, position and scale over to the backend)
                    newVertics =mesh.geometry.vertices[v].clone();
                    newVertics = newVertics.applyMatrix4(mesh.matrixWorld);
                    object.vertices.push({x: newVertics.x, y: newVertics.y, z: newVertics.z});

                }

                //  Now go thru all the faces.
                for (var f in mesh.geometry.faces) {

                    //  If there are 4 vertices used in this face (i.e. it's a QUAD) and we should
                    //  really use the *proper* way to check if it is or not (Face3 vs Face4) just
                    //  as soon as I've gotten round to figuring it out...
                    //  ...anyway, if there are 4 vertices then we can split those into two 3 vertices
                    //  faces by using a,b,c and a,c,d which is the same as a,b,c,d just split.
                    if ('d' in mesh.geometry.faces[f]) {
                        object.faces.push([mesh.geometry.faces[f].a, mesh.geometry.faces[f].b, mesh.geometry.faces[f].c]);
                        object.faces.push([mesh.geometry.faces[f].a, mesh.geometry.faces[f].c, mesh.geometry.faces[f].d]);
                    } else {
                        object.faces.push([mesh.geometry.faces[f].a, mesh.geometry.faces[f].b, mesh.geometry.faces[f].c]);
                    }
                }

            } else {
                // If it wasn't a SPHERE or a MESH, then, huh, who knows, maybe a TORUS :)
            }

            //  Add the object
            params.objects.push(object);

        }

        //  Tell the backend what filename to use
        //  (so in theory we can set up sequential files)
        params.filename = 'test';

        //  send it to the backend
        $.post("/api/cat824.render.render", params)
        .success(
            function(data) {

                //  TODO: This needs a whole bunch of error checking
                //  and also some way to manage a render queue if
                //  we want to start rending a sequence of images
                //
                //  But for the moment let's just fire and forget
                //  and write some different code on the backend
                //  for queueing up renders
                var json = JSON.parse(data);
                if ('status' in json && json.status == 'ok') {
                    //  start checking for a filename
                    clearTimeout(control.fileCheckTmr);
                    control.fileCheckTmr = setTimeout(function() {
                        control.checkForFile(json.params.filename);
                    }, 200);

                }
            }
        )
        .error(
            function() {
                utils.log('Something went wrong');
            }
        );

    },

    //  A very poor way of checking for the file existing on the back end
    //  In an ideal world we'll have the backend serve up the valid image
    //  but for the moment we are asking if it exists.
    checkForFile: function(filename) {

        var params = {
            filename: filename
        };

        $.getJSON("/api/cat824.file.check?callback=?", params)
        .success(
            function(data) {
                if ('exists' in data && data.exists) {

                    //  TODO, change this to the backend serving the images
                    //
                    //  NOTE: this is also hardcoding where the image get's displayed
                    //  in perfect code world we'd have passed over the target
                    //  for the final image.
                    //
                    //  Also, I need to work on the backend a bit because it sees the
                    //  file as existing when it first hits the file system, but it can
                    //  still be being written to disk at that point. It really needs
                    //  to check that the file write is finished. But for the moment we
                    //  just wait 2.5 seconds from being told it exists to trying to load
                    //  it, to give large images a chance to finish being written to disk.
                    //
                    //  Yeah, I know!
                    setTimeout(function() {
                        $('.outputHolder').empty().append(
                            $('<a>').attr('href', '/' + filename + '.png?v=' + Math.random())
                                .attr('target', '_blank').append(
                                    $('<img>').attr('src', '/' + filename + '.png?v=' + Math.random())
                                )
                        );
                    }, 2500);

                } else {
                    clearTimeout(control.fileCheckTmr);
                    control.fileCheckTmr = setTimeout(function() {
                        control.checkForFile(filename);
                    }, 200);
                }
            }
        )
        .error(
            function() {
                //  TODO, handle error condition here
                utils.log('Something went wrong');
            }
        );

    }

};

utils = {

    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  do nowt
        }

    }

};