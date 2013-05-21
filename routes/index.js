/*jshint loopfunc: true */
var url  = require('url');
require('../control.js');

//  Break out all the seperate parts of the site
require('./site.js');
require('./api.js');

//  Export all the things (that have been pulled in by the require)
exports.site = site;
exports.api = api;

