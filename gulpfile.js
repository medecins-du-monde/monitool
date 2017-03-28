"use strict";

var async         = require('async'),
	del           = require('del'),
	fs            = require('fs'),
	gulp          = require('gulp'),
	templateCache = require('gulp-angular-templatecache'),
	bower         = require('gulp-bower'),
	concat        = require('gulp-concat'),
	cleanCSS      = require('gulp-clean-css'),
	ngAnnotate    = require('gulp-ng-annotate'),
	rename        = require('gulp-rename'),
	replace       = require('gulp-replace'),
	uglify        = require('gulp-uglify'),
	es            = require('event-stream'),
	request       = require('request'),
	Queue         = require('streamqueue'),
	config        = require('./server/config');

var files = {
	css: [
		'client/bower_components/font-awesome/css/font-awesome.min.css',
		'client/bower_components/bootstrap-css-only/css/bootstrap.min.css',
		'client/bower_components/angular-ui-select/dist/select.min.css',
		'client/bower_components/c3/c3.min.css',
		'client/bower_components/handsontable/dist/handsontable.full.css',
	],
	js: [
		"client/bower_components/pdfmake/build/pdfmake.min.js",
		"client/bower_components/pdfmake/build/vfs_fonts.js",
		"client/bower_components/blob/Blob.js",
		"client/bower_components/canvas-to-Blob.js/canvas-toBlob.js",
		"client/bower_components/file-saver/FileSaver.min.js",
		"client/bower_components/angular/angular.min.js",
		"client/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
		"client/bower_components/angular-ui-router/release/angular-ui-router.min.js",
		"client/bower_components/angular-ui-select/dist/select.min.js",
		"client/bower_components/angular-cookies/angular-cookies.min.js",
		"client/bower_components/angular-resource/angular-resource.min.js",
		"client/bower_components/angular-translate/angular-translate.min.js",
		"client/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js",
		"client/bower_components/angular-translate-storage-local/angular-translate-storage-local.min.js",
		"client/bower_components/d3/d3.min.js",
		"client/bower_components/c3/c3.min.js",
		"client/bower_components/handsontable/dist/handsontable.full.min.js",
		"client/bower_components/Sortable/Sortable.min.js",
		"client/bower_components/Sortable/ng-sortable.js"
	]
};

//////////////////////////////////////////////////////////
// Build
//////////////////////////////////////////////////////////

gulp.task('default', ['build']);
gulp.task('build', ['build-js', 'build-css', 'copy-static']);

gulp.task('clean', function(cb) {
	del(['wwwroot/**/*'], cb);
});

gulp.task('copy-static', ['bower'], function() {
	gulp.src('client/index-prod.html').pipe(rename('index.html')).pipe(gulp.dest('wwwroot'));
	gulp.src('client/favicon.ico').pipe(gulp.dest('wwwroot'));
	gulp.src('client/bower_components/font-awesome/fonts/*').pipe(gulp.dest('wwwroot'));
	gulp.src('client/img/*').pipe(gulp.dest('wwwroot/img'));
});

gulp.task('build-js', ['bower'], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue()

	// min.js are unchanged
	queue.queue(
		gulp.src(files.js)
			.pipe(replace('glyphicon', 'fa'))
	);

	// js are annotated, uglified
	queue.queue(
		gulp.src(['client/js/**/*.js', 'client/i18n/**/*.js', '!client/js/**/*_test.js'])
			.pipe(ngAnnotate())
			.pipe(uglify())
	);

	// merge all templates into one angular module.
	queue.queue(
		gulp.src('client/partials/**/*.html')
			.pipe(replace(/<!--[\s\S]*?-->/g, ''))	// Remove HTML comments
			.pipe(replace(/[  \t\n\r]+/g, ' '))		// Merge spaces
			.pipe(templateCache({module: 'monitool.app', root: 'partials'}))
	);

	// concat it all.
	return queue.done()
				.pipe(concat('monitool2.js'))
				.pipe(gulp.dest('wwwroot'));
});

gulp.task('build-css', ['bower'], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue(gulp.src(files.css));
	queue.queue(gulp.src('client/css/**/*.css').pipe(cleanCSS()));

	return queue.done()
				.pipe(concat('monitool2.css'))
				.pipe(replace(/\.\.\/fonts\//g, ''))
				.pipe(gulp.dest('wwwroot'));
});

gulp.task('bower', function() {
	return bower({cwd: './client'});
});

gulp.task('design-docs', function(callback) {
	var urlPrefix = config.couchdb.url + '/' + config.couchdb.bucket;
	var ddocs = {
		monitool: require('./designdocs/monitool')
	};

	var numDocs = 3;
	Object.keys(ddocs).forEach(function(ddoc) {
		var url = urlPrefix + '/_design/' + ddoc;

		request({method: 'GET', url: url}, function(error, response, doc) {
			var newDdoc = ddocs[ddoc];
			newDdoc._rev = JSON.parse(doc)._rev;

			request({method: 'PUT', url: url, json: newDdoc}, function(error, response, doc) {
				console.log(JSON.stringify(doc));
				numDocs--;
				if (numDocs == 0)
					callback();
			});
		});
	});
});

gulp.task('size', function() {
	var sizes = files.js.map(function(path) {
		return [fs.statSync(path).size, path];
	});

	sizes.sort((a, b) => b[0] - a[0]);

	sizes.forEach(function(arr) {
		console.log(Math.round(arr[0] / 1024) + "kB\t" + arr[1]);
	});
});