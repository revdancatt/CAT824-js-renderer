/*jshint loopfunc: true */
var url  = require('url');
var fs  = require('fs');

file = {

    //  This is going to grab the data we've been passed
    //  over and set up the camera, objects and so on
    check: function(returnJSON, queryObject, response) {

        var file = __dirname + '/../../scenes/' + queryObject.filename + '.png';
        fs.exists(file, function(exists) {
            returnJSON.exists = exists;
            api.closeAndSend(returnJSON, queryObject, response);
        });

    }

};
