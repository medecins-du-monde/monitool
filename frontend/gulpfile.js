"use strict";

var del           = require('del'),
	fs            = require('fs'),
	gulp          = require('gulp'),
	templateCache = require('gulp-angular-templatecache'),
	concat        = require('gulp-concat'),
	cleanCSS      = require('gulp-clean-css'),
	gzip          = require('gulp-gzip'),
	ngAnnotate    = require('gulp-ng-annotate'),
	rename        = require('gulp-rename'),
	replace       = require('gulp-replace'),
	uglify        = require('gulp-uglify'),
	es            = require('event-stream'),
	Queue         = require('streamqueue');

var files = {
	css: [
		'node_modules/@bower_components/font-awesome/css/font-awesome.min.css',
		'node_modules/@bower_components/bootstrap-css-only/css/bootstrap.min.css',
		'node_modules/@bower_components/angular-ui-select/dist/select.min.css',
		'node_modules/@bower_components/c3/c3.min.css',
		'node_modules/@bower_components/handsontable/dist/handsontable.full.css',
	],
	js: [
		"node_modules/@bower_components/blob/Blob.js",
		"node_modules/@bower_components/canvas-to-Blob.js/canvas-toBlob.js",
		"node_modules/@bower_components/file-saver/FileSaver.min.js",
		"node_modules/@bower_components/angular/angular.min.js",
		"node_modules/@bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
		"node_modules/@bower_components/angular-ui-router/release/angular-ui-router.min.js",
		"node_modules/@bower_components/angular-ui-select/dist/select.min.js",
		"node_modules/@bower_components/angular-cookies/angular-cookies.min.js",
		"node_modules/@bower_components/angular-resource/angular-resource.min.js",
		"node_modules/@bower_components/angular-translate/angular-translate.min.js",
		"node_modules/@bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js",
		"node_modules/@bower_components/angular-translate-storage-local/angular-translate-storage-local.min.js",
		"node_modules/@bower_components/d3/d3.min.js",
		"node_modules/@bower_components/c3/c3.min.js",
		"node_modules/@bower_components/handsontable/dist/handsontable.full.min.js",
		"node_modules/@bower_components/Sortable/Sortable.min.js",
		"node_modules/@bower_components/Sortable/ng-sortable.js"
	]
};

//////////////////////////////////////////////////////////
// Build
//////////////////////////////////////////////////////////

gulp.task('default', ['build']);
gulp.task('build', ['build-js', 'build-css', 'copy-static']);

gulp.task('clean', function(cb) {
	del(['dist/**/*'], cb);
});

gulp.task('copy-static', [], function() {
	gulp.src([
			'src/index.html',
			'src/init.js',
			'src/assets/favicon.ico',
			'node_modules/@bower_components/font-awesome/fonts/*'
		])
		// .pipe(gzip({append: false}))
		.pipe(gulp.dest('dist'));

	gulp.src('src/assets/img/*')
		// .pipe(gzip({append: false}))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('build-js', [], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue()

	// min.js are unchanged
	queue.queue(
		gulp.src(files.js)
			.pipe(replace('glyphicon', 'fa'))
	);

	// js are annotated, uglified
	queue.queue(
		gulp.src(['src/**/*.js', '!src/**/*_test.js', '!src/init.js'])
			.pipe(ngAnnotate())
			.pipe(uglify())
	);

	// merge all templates into one angular module.
	queue.queue(
		gulp.src('src/partials/**/*.html')
			.pipe(replace(/<!--[\s\S]*?-->/g, ''))	// Remove HTML comments
			.pipe(replace(/[  \t\n\r]+/g, ' '))		// Merge spaces
			.pipe(templateCache({module: 'monitool.app', root: 'partials'}))
	);

	// concat it all.
	return queue.done()
				.pipe(concat('monitool2.js'))
				// .pipe(gzip({append: false}))
				.pipe(gulp.dest('dist'));
});

gulp.task('build-css', [], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue(gulp.src(files.css));
	queue.queue(gulp.src('src/**/*.css').pipe(cleanCSS()));

	return queue.done()
				.pipe(concat('monitool2.css'))
				.pipe(replace(/\.\.\/fonts\//g, ''))
				// .pipe(gzip({append: false}))
				.pipe(gulp.dest('dist'));
});

