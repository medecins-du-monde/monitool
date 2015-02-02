"use strict";

var nano = require('nano');

module.exports = nano('http://rgilliotte:33h7hwe9@localhost:5984').use('monitool');
