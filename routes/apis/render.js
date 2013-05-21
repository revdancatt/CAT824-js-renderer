/*jshint loopfunc: true */
var url  = require('url');
var fs  = require('fs');

render = {

    targetFilename: '',

    //  This is going to grab the data we've been passed
    //  over and set up the camera, objects and so on
    render: function(returnJSON, queryObject, response) {

        var data = "";

        data += this.topBit();
        data += this.image(queryObject.size);
        data += this.camera(queryObject.camera);
        data += this.shaders(queryObject.objects);
        data += this.objects(queryObject.objects);

        this.targetFilename = queryObject.filename;

        // delete the original image file, we don't really care if this
        //  works or not
        fs.unlink(__dirname + '/../../scenes/' + queryObject.filename + '.png', function (err) {

            fs.writeFile(__dirname + '/../../scenes/' + queryObject.filename + '.sc', data, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('>> it worked!'.info);
                }

                var args = ['-Xmx1G',
                                '-jar',
                                '/Applications/sunflow/sunflow.jar',
                                '-nogui',
                                '-o',
                                __dirname + '/../../scenes/' + queryObject.filename + '.png',
                                __dirname + '/../../scenes/' + queryObject.filename + '.sc'
                            ];

                //  if we are supposed to use low quality, then we'll do that here too.
                if (queryObject.quality == 'low') {
                                args = ['-Xmx1G',
                                '-jar',
                                '/Applications/sunflow/sunflow.jar',
                                '-nogui',
                                '-ipr',
                                '-o',
                                __dirname + '/../../scenes/' + queryObject.filename + '.png',
                                __dirname + '/../../scenes/' + queryObject.filename + '.sc'
                            ];
                }

                console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
                console.log(args);
                console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);

                var foo = new render.run_cmd(
                    'java', args,
                    function (me, buffer) { me.stdout += buffer.toString(); },
                    function () {
                        //  clean up scene file
                        //fs.unlink(__dirname + '/../../scenes/' + queryObject.filename + '.sc', function (err) {
                        //    console.log('>> Finished ' + queryObject.filename + '.png'.info);
                        //});
                    }
                );

                api.closeAndSend(returnJSON, queryObject, response);

            });
        });

    },

    topBit: function() {

        var x = 'trace-depths {\n' +
            '  diff 4\n' +
            '  refl 3\n' +
            '  refr 2\n' +
            '}\n' +
            '\n' +
            'gi {\n' +
            '   type ambocc\n' +
            '   bright { "sRGB nonlinear" 1 1 1 }\n' +
            '   dark { "sRGB nonlinear" 0 0 0 }\n' +
            '   samples 64\n' +
            '   maxdist 200.0\n' +
            '}\n' +
            '\n' +
            'background {\n' +
            '   color  { "sRGB nonlinear" 0.7 0.7 0.7 }\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name debug_caustics\n' +
            '  type view-caustics\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name debug_globals\n' +
            '  type view-global\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name debug_gi\n' +
            '  type view-irradiance\n' +
            '}\n' +
            'shader {\n' +
            '  name Grey\n' +
            '  type diffuse\n' +
            '  diff 0.7 0.7 0.7\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name Red\n' +
            '  type diffuse\n' +
            '  diff 0.8 0.0 0.0\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name DarkGrey\n' +
            '  type diffuse\n' +
            '  diff 0.2 0.2 0.2\n' +
            '}\n' +
//            'object {\n' +
//            '   shader Grey\n' +
//            '   type plane\n' +
//            '   p 0 0 0\n' +
//            '   n 0 0 1\n' +
//            '}\n' +
            '\n';
        return x;

    },

    image: function(sizeNode) {

        var i = 'image {\n' +
            '  resolution ' + Math.floor(sizeNode.width) + ' ' + Math.floor(sizeNode.height) + '\n' +
            '  aa 1 2\n' +
            '  filter gaussian\n' +
            '}\n' +
            '\n';
        return i;

    },

    camera: function(cameraNode) {

        var position = this.convertPosition(cameraNode.position);
        var lookat = this.convertPosition(cameraNode.lookat);
        var c = 'camera {\n' +
              '  type pinhole\n' +
              '  eye    ' + position.x + ' ' + position.y + ' ' + position.z + '\n' +
              '  target ' + lookat.x + ' ' + lookat.y + ' ' + lookat.z + '\n' +
              '  up     0 0 1\n' +
              '  fov    59\n' +
              '  aspect ' + parseFloat(cameraNode.aspect) + '\n' +
              '}\n' +
              '\n';
        return c;
    },

    shaders: function(objectArray) {

        var o = '';
        var object = null;

        for (var i in objectArray) {
            object = objectArray[i];

            if ('colour' in object) {
                o += 'shader {\n' +
                '  name Object' + i + '\n' +
                '  type diffuse\n' +
                '  diff ' + object.colour.r + ' ' + object.colour.g + ' ' + object.colour.b + '\n' +
                '}\n' +
                '\n';
            } else {
                o += 'shader {\n' +
                '  name Object' + i + '\n' +
                '  type diffuse\n' +
                '  diff 0.7 0.7 0.7\n' +
                '}\n' +
                '\n';           
            }
        }

        return o;
    },

    objects: function(objectArray) {

        var shader = null;
        var o = '';
        var object = null;

        for (var i in objectArray) {
            object = objectArray[i];

            shader = 'Object' + i;
            o += 'object {\n' +
                '  shader ' + shader + '\n';

            //  If it's a sphere then we can easily do that here.
            if (object.type == 'sphere') {
                object.position = this.convertPosition(object.position);

                o += '  type sphere\n' +
                '  c ' + object.position.x + ' ' + object.position.y + ' ' + object.position.z + '\n' +
                '  r ' + object.radius + '\n';
            }

            if (object.type == 'mesh') {

                o += '  type generic-mesh\n' +
                '\n' +
                '  points ' + object.vertices.length + '\n';

                for (var v in object.vertices) {
                    object.vertices[v] = this.convertPosition(object.vertices[v]);
                    o += '    ' + object.vertices[v].x + ' ' + object.vertices[v].y + ' ' + object.vertices[v].z + '\n';
                }

                o += '\n' +
                '  triangles ' + object.faces.length + '\n';

                for (var f in object.faces) {
                    o += '    ' + object.faces[f][0] + ' ' + object.faces[f][1] + ' ' + object.faces[f][2] + '\n';
                }

                o += '  normals none\n';
                o += '  uvs none\n';

            }

            o += '}\n' +
            '\n';
            //  if it's a matrix then that's a little more hard work
            //  CONVERT ALL VERTEX AND FACES HERE

        }

        return o;

    },

    addSphere: function(position, r) {

        position = this.convertPosition(position);

        var shader = 'Grey';
        var o = 'object {\n' +
            '  shader ' + shader + '\n' +
            '  type sphere\n' +
            '  c ' + position.x + ' ' + position.y + ' ' + position.z + '\n' +
            '  r ' + r + '\n' +
            '}\n';
        return o;

    },

    convertPosition: function(position) {

        var newPosition = {
            x: parseFloat(position.x),
            y: parseFloat(-position.z),
            z: parseFloat(position.y)
        };
        return newPosition;

    },

    run_cmd: function(cmd, args, cb, end) {
        var spawn = require('child_process').spawn;
        var child = spawn(cmd, args);
        var me = this;
        child.stdout.on('data', function(buffer) {
            console.log('>> -------'.rainbow);
            console.log(buffer);
            cb(me, buffer);
        });
        child.stdout.on('end', function() {
            console.log('>> *******'.rainbow);
            console.log('>> end'.rainbow);
            end();
        });
    }

};
