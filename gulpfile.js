"use strict";

var gulp          = require('gulp'),
	templateCache = require('gulp-angular-templatecache'),
	concat        = require('gulp-concat'),
	minifyCSS     = require('gulp-minify-css'),
	ngAnnotate    = require('gulp-ng-annotate'),
	rename        = require('gulp-rename'),
	replace       = require('gulp-replace'),
	uglify        = require('gulp-uglify'),
	Queue         = require('streamqueue');

var files = {
	css: {
		min: [
			'dev/bower_components/fontawesome/css/font-awesome.min.css',
			'dev/bower_components/bootstrap/dist/css/bootstrap.min.css',
			'dev/bower_components/angular-ui-select/dist/select.min.css',
			'dev/bower_components/c3/c3.min.css'
		],
		common: [
			'dev/css/app.css'
		]
	},
	js: {
		min: [
			'dev/bower_components/moment/min/moment.min.js',
			'dev/bower_components/mathjs/dist/math.min.js',
			'dev/bower_components/javascript-state-machine/state-machine.min.js',
			'dev/bower_components/FileSaver.js/FileSaver.min.js',
			'dev/bower_components/jquery/dist/jquery.min.js',
			'dev/bower_components/bootstrap/dist/js/bootstrap.min.js',
			'dev/bower_components/angular/angular.min.js',
			'dev/bower_components/angular-route/angular-route.min.js',
			'dev/bower_components/angular-moment/angular-moment.min.js',
			'dev/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
			'dev/bower_components/angular-ui-select/dist/select.min.js',
			'dev/bower_components/angular-bootstrap-show-errors/src/showErrors.min.js',
			'dev/bower_components/pouchdb/dist/pouchdb.min.js',
			'dev/bower_components/pouchdb-authentication/dist/pouchdb.authentication.min.js',
			'dev/bower_components/d3/d3.min.js',
			'dev/bower_components/c3/c3.min.js'
		],
		common: [
			'dev/bower_components/Blob.js/Blob.js',
			'dev/bower_components/canvas-toBlob.js/canvas-toBlob.js',
			'dev/bower_components/angular-pouchdb/angular-pouchdb.js',
			'dev/js/image-exporter.js',
			'dev/js/services.js',
			'dev/js/controllers.js',
			'dev/js/app.js',
			'dev/js/directives.js',
		]
	}
};

gulp.task('deploy', ['build'], function() {

});




gulp.task('build', ['build-js', 'build-css', 'copy-static']);

gulp.task('clean', function(callback) {
	rimraf('build', callback);
});

gulp.task('copy-static', function() {
	gulp.src('dev/index-prod.html').pipe(rename('index.html')).pipe(gulp.dest('build'));
	gulp.src('dev/bower_components/fontawesome/fonts/*').pipe(gulp.dest('build/fonts'));
	gulp.src('dev/monitool.appcache').pipe(gulp.dest('build'));
});

gulp.task('build-js', function() {
	var queue = new Queue({ objectMode: true });
	queue.queue(gulp.src(files.js.min));										// min.js are unchanged
	queue.queue(gulp.src(files.js.common).pipe(ngAnnotate()).pipe(uglify()));	// js are annotated, uglified

	// merge all templates into one angular module.
	queue.queue(
		gulp.src('dev/partials/**/*.html')
			.pipe(replace(/<!--[\s\S]*?-->/g, ''))	// Remove HTML comments
			.pipe(replace(/[  \t\n\r]+/g, ' '))		// Merge spaces
			.pipe(replace(/> </g, '><'))			// Remove spaces between tags (but keep others)
			.pipe(templateCache({module: 'MonitoolApp', root: 'partials'}))
	);

	// concat it all.
	return queue.done()
				.pipe(concat('monitool.js'))
				.pipe(gulp.dest('build/js'));
});

gulp.task('build-css', function() {
	var queue = new Queue({ objectMode: true });
	queue.queue(gulp.src(files.css.min));
	queue.queue(gulp.src(files.css.common).pipe(minifyCSS()));

	return queue.done()
				.pipe(concat('monitool.css'))
				.pipe(gulp.dest('build/css'));
});
