"use strict";

var async         = require('async'),
	del           = require('del'),
	gulp          = require('gulp'),
	templateCache = require('gulp-angular-templatecache'),
	bower         = require('gulp-bower'),
	concat        = require('gulp-concat'),
	minifyCSS     = require('gulp-minify-css'),
	ngAnnotate    = require('gulp-ng-annotate'),
	rename        = require('gulp-rename'),
	replace       = require('gulp-replace'),
	uglify        = require('gulp-uglify'),
	es            = require('event-stream'),
	request       = require('request'),
	Queue         = require('streamqueue'),
	config        = require('./config');

var files = {
	css: [
		'client/dev/bower_components/fontawesome/css/font-awesome.min.css',
		'client/dev/bower_components/bootstrap-css-only/css/bootstrap.min.css',
		'client/dev/bower_components/angular-ui-select/dist/select.min.css',
		'client/dev/bower_components/c3/c3.min.css',
		// 'client/dev/bower_components/textAngular/src/textAngular.css',

		'client/dev/bower_components/handsontable/dist/handsontable.full.css',
	],
	js: [
		'client/dev/bower_components/moment/min/moment.min.js',
		'client/dev/bower_components/FileSaver.js/FileSaver.min.js',
		'client/dev/bower_components/angular/angular.min.js',
		'client/dev/bower_components/angular-ui-router/release/angular-ui-router.min.js',
		'client/dev/bower_components/angular-moment/angular-moment.min.js',
		'client/dev/bower_components/angular-translate/angular-translate.min.js',
		// 'client/dev/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
		// 'client/dev/js/ui-bootstrap-tpls-0.13.0-SNAPSHOT.min.js',
		// 'client/dev/js/ui-bootstrap-override.min.js',
		'client/dev/bower_components/angular-bootstrap-show-errors/src/showErrors.min.js',
		'client/dev/bower_components/angular-ui-select/dist/select.min.js',
		'client/dev/bower_components/angular-cookies/angular-cookies.min.js',
		'client/dev/bower_components/angular-resource/angular-resource.min.js',
		'client/dev/bower_components/angular-translate/angular-translate.min.js',
		'client/dev/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js',
		'client/dev/bower_components/angular-translate-storage-local/angular-translate-storage-local.min.js',
		'client/dev/bower_components/d3/d3.min.js',
		'client/dev/bower_components/c3/c3.min.js',
		// 'client/dev/bower_components/textAngular/dist/textAngular-rangy.min.js',
		'client/dev/bower_components/textAngular/dist/textAngular-sanitize.min.js',
		// 'client/dev/bower_components/textAngular/dist/textAngular.min.js',
		'client/dev/bower_components/handsontable/dist/handsontable.full.min.js',

		'client/dev/bower_components/Blob.js/Blob.js',
		'client/dev/bower_components/canvas-toBlob.js/canvas-toBlob.js',
	]
};

//////////////////////////////////////////////////////////
// Build
//////////////////////////////////////////////////////////

gulp.task('default', ['build', 'design-docs']);
gulp.task('build', ['build-js', 'build-css', 'copy-static']);

gulp.task('clean', function(cb) {
	del(['client/build/**/*'], cb);
});

gulp.task('copy-static', function() {
	gulp.src('client/dev/index-prod.html').pipe(rename('index.html')).pipe(gulp.dest('client/build'));
	gulp.src('client/dev/bower_components/fontawesome/fonts/*').pipe(gulp.dest('client/build'));
	gulp.src('client/dev/bower_components/bootstrap/fonts/*').pipe(gulp.dest('client/build'));
	gulp.src('client/dev/img/*').pipe(gulp.dest('client/build/img'));

});

gulp.task('build-js', ['bower'], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue()

	// min.js are unchanged
	queue.queue(gulp.src(files.js));

	// js are annotated, uglified
	queue.queue(
		gulp.src(['client/dev/js/**/*.js', 'client/dev/i18n/**/*.js', '!client/dev/js/**/*_test.js'])
			.pipe(ngAnnotate())
			.pipe(uglify())
	);

	// merge all templates into one angular module.
	queue.queue(
		gulp.src('client/dev/partials/**/*.html')
			.pipe(replace(/<!--[\s\S]*?-->/g, ''))	// Remove HTML comments
			.pipe(replace(/[  \t\n\r]+/g, ' '))		// Merge spaces
			.pipe(templateCache({module: 'monitool.app', root: 'partials'}))
	);

	// concat it all.
	return queue.done()
				.pipe(concat('monitool2.js'))
				.pipe(gulp.dest('client/build'));
});

gulp.task('build-css', ['bower'], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue(gulp.src(files.css));
	queue.queue(gulp.src('client/dev/css/**/*.css').pipe(minifyCSS()));

	return queue.done()
				.pipe(concat('monitool2.css'))
				.pipe(replace(/\.\.\/fonts\//g, ''))
				.pipe(gulp.dest('client/build'));
});

gulp.task('bower', function() {
	return bower({cwd: './client/dev'});
});

gulp.task('design-docs', function(callback) {
	var urlPrefix = config.couchdb.url + '/' + config.couchdb.bucket;
	var ddocs = {
		reporting: require('./server/designdocs/app_reporting'),
		shortlists: require('./server/designdocs/app_shortlists'),
		server: require('./server/designdocs/server'),
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

