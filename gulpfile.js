"use strict";

var addCors       = require('add-cors-to-couchdb'),
	gulp          = require('gulp'),
	templateCache = require('gulp-angular-templatecache'),
	awspublish    = require('gulp-awspublish'),
	bower         = require('gulp-bower'),
	concat        = require('gulp-concat'),
	insert        = require('gulp-insert'),
	minifyCSS     = require('gulp-minify-css'),
	ngAnnotate    = require('gulp-ng-annotate'),
	rename        = require('gulp-rename'),
	replace       = require('gulp-replace'),
	uglify        = require('gulp-uglify'),
	es            = require('event-stream'),
	Queue         = require('streamqueue');

var files = {
	css: {
		min: [
			'client/dev/bower_components/fontawesome/css/font-awesome.min.css',
			'client/dev/bower_components/bootstrap-css-only/css/bootstrap.min.css',
			'client/dev/bower_components/angular-ui-select/dist/select.min.css',
			'client/dev/bower_components/c3/c3.min.css',
			'client/dev/bower_components/textAngular/src/textAngular.css'
		],
		common: [
			'client/dev/css/app.css'
		]
	},
	js: {
		min: [
			'client/dev/bower_components/moment/min/moment.min.js',
			'client/dev/bower_components/FileSaver.js/FileSaver.min.js',
			'client/dev/bower_components/angular/angular.min.js',
			'client/dev/bower_components/angular-ui-router/release/angular-ui-router.min.js',
			'client/dev/bower_components/angular-moment/angular-moment.min.js',
			'client/dev/bower_components/angular-translate/angular-translate.min.js',
			// 'client/dev/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
			'client/dev/js/ui-bootstrap-tpls-0.13.0-SNAPSHOT.min.js',
			'client/dev/bower_components/angular-bootstrap-show-errors/src/showErrors.min.js',
			'client/dev/bower_components/angular-ui-select/dist/select.min.js',
			'client/dev/bower_components/angular-cookies/angular-cookies.min.js',
			'client/dev/bower_components/angular-resource/angular-resource.min.js',
			'client/dev/bower_components/angular-translate/angular-translate.min.js',
			'client/dev/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js',
			'client/dev/bower_components/angular-translate-storage-local/angular-translate-storage-local.min.js',
			'client/dev/bower_components/d3/d3.min.js',
			'client/dev/bower_components/c3/c3.min.js',
			'client/dev/bower_components/textAngular/dist/textAngular-rangy.min.js',
			'client/dev/bower_components/textAngular/dist/textAngular-sanitize.min.js',
			'client/dev/bower_components/textAngular/dist/textAngular.min.js',
		],
		common: [
			'client/dev/bower_components/Blob.js/Blob.js',
			'client/dev/bower_components/canvas-toBlob.js/canvas-toBlob.js',
			'client/dev/i18n/fr.js',
			'client/dev/i18n/es.js',
			'client/dev/i18n/en.js',
			'client/dev/js/controllers/admin.js',
			'client/dev/js/controllers/helper.js',
			'client/dev/js/controllers/project.js',
			'client/dev/js/controllers/indicator.js',
			'client/dev/js/directives/acls.js',
			'client/dev/js/directives/forms.js',
			'client/dev/js/directives/project-form.js',
			'client/dev/js/directives/project-input.js',
			'client/dev/js/directives/project-logframe.js',
			'client/dev/js/directives/reporting.js',
			'client/dev/js/services/fetch.js',
			'client/dev/js/services/reporting.js',
			'client/dev/js/services/reporting-compute-helper.js',
			'client/dev/js/services/reporting-raw-helper.js',
			'client/dev/js/services/reporting-regroup-helper.js',
			'client/dev/js/services/string.js',
			'client/dev/js/app.js',
			'client/dev/js/filters.js',
			'client/dev/js/polyfills.js',
		]
	}
};


//////////////////////////////////////////////////////////
// Deploy
//////////////////////////////////////////////////////////

gulp.task('size-report', function() {
	gulp.src(files.js.min)
		.pipe(awspublish.gzip())
		.pipe(es.map(function(toto) {
			console.log(toto.contents.length, toto.path.substring(toto.path.lastIndexOf('/') + 1))
		}))
})

//////////////////////////////////////////////////////////
// Build
//////////////////////////////////////////////////////////

gulp.task('default', ['build']);
gulp.task('build', ['build-js', 'build-css', 'copy-static']);

gulp.task('copy-static', function() {
	gulp.src('client/dev/index-prod.html').pipe(rename('index.html')).pipe(gulp.dest('client/build'));
	gulp.src('client/dev/bower_components/fontawesome/fonts/*').pipe(gulp.dest('client/build'));
	gulp.src('client/dev/bower_components/bootstrap/fonts/*').pipe(gulp.dest('client/build'));
	gulp.src('client/dev/monitool.appcache').pipe(gulp.dest('client/build'));
});

gulp.task('build-js', ['bower'], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue()
	queue.queue(gulp.src(files.js.min));										// min.js are unchanged
	queue.queue(gulp.src(files.js.common).pipe(ngAnnotate()).pipe(uglify()));	// js are annotated, uglified

	// merge all templates into one angular module.
	queue.queue(
		gulp.src('client/dev/partials/**/*.html')
			.pipe(replace(/<!--[\s\S]*?-->/g, ''))	// Remove HTML comments
			.pipe(replace(/[  \t\n\r]+/g, ' '))		// Merge spaces
			// .pipe(replace(/> </g, '><'))			// Remove spaces between tags (but keep others)
			.pipe(templateCache({module: 'monitool.app', root: 'partials'}))
	);

	// concat it all.
	return queue.done()
				.pipe(concat('monitool.js'))
				.pipe(gulp.dest('client/build'));
});

gulp.task('build-css', ['bower'], function() {
	var queue = new Queue({ objectMode: true });
	queue.queue(gulp.src(files.css.min));
	queue.queue(gulp.src(files.css.common).pipe(minifyCSS()));

	return queue.done()
				.pipe(concat('monitool.css'))
				.pipe(replace(/\.\.\/fonts\//g, ''))
				.pipe(gulp.dest('client/build'));
});

gulp.task('bower', function() {
	return bower({cwd: './client/dev'});
});
