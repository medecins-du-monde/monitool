"use strict";

var async         = require('async'),
	addCors       = require('add-cors-to-couchdb'),
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
	request       = require('request'),
	Queue         = require('streamqueue'),
	config        = require('./config');

var files = {
	css: [
		'client/dev/bower_components/fontawesome/css/font-awesome.min.css',
		'client/dev/bower_components/bootstrap-css-only/css/bootstrap.min.css',
		'client/dev/bower_components/angular-ui-select/dist/select.min.css',
		'client/dev/bower_components/c3/c3.min.css',
		'client/dev/bower_components/textAngular/src/textAngular.css',
	],
	js: [
		'client/dev/bower_components/moment/min/moment.min.js',
		'client/dev/bower_components/FileSaver.js/FileSaver.min.js',
		'client/dev/bower_components/angular/angular.min.js',
		'client/dev/bower_components/angular-ui-router/release/angular-ui-router.min.js',
		'client/dev/bower_components/angular-moment/angular-moment.min.js',
		'client/dev/bower_components/angular-translate/angular-translate.min.js',
		// 'client/dev/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
		'client/dev/js/ui-bootstrap-tpls-0.13.0-SNAPSHOT.min.js',
		'client/dev/js/ui-bootstrap-override.min.js',
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

		'client/dev/bower_components/Blob.js/Blob.js',
		'client/dev/bower_components/canvas-toBlob.js/canvas-toBlob.js',
	]
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

gulp.task('default', ['build', 'design-docs', 'update-database']);
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

	// min.js are unchanged
	queue.queue(gulp.src(files.js));

	// js are annotated, uglified
	queue.queue(
		gulp.src(['client/dev/js/**/*.js', 'client/dev/i18n/**/*.js'])
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


gulp.task('update-database', function(callback) {
	request.get(config.couchdb.url + '/' + config.couchdb.bucket + '/_all_docs?include_docs=true', function(error, response, result) {
		var updates = [];

		JSON.parse(result).rows.forEach(function(row) {
			var doc = row.doc, update = false;

			if (doc.type === 'indicator') {
				if (doc.geoAggregation) {
					delete doc.geoAggregation;
					update = true;
				}
				if (doc.timeAggregation) {
					delete doc.timeAggregation;
					update = true;
				}

				for (var formulaId in doc.formulas)
					for (var key in doc.formulas[formulaId].parameters) {
						if (doc.formulas[formulaId].parameters[key].timeAggregation) {
							delete doc.formulas[formulaId].parameters[key].timeAggregation;
							update = true;
						}

						if (doc.formulas[formulaId].parameters[key].geoAggregation) {
							delete doc.formulas[formulaId].parameters[key].geoAggregation;
							update = true;
						}

						if (doc.formulas[formulaId].parameters[key].name) {
							doc.formulas[formulaId].parameters[key].fr = doc.formulas[formulaId].parameters[key].name;
							doc.formulas[formulaId].parameters[key].es = doc.formulas[formulaId].parameters[key].name;
							doc.formulas[formulaId].parameters[key].en = doc.formulas[formulaId].parameters[key].name;
							delete doc.formulas[formulaId].parameters[key].name;
							update = true;
						}
					}
			}
			else if (doc.type == 'project')
				doc.dataCollection.forEach(function(form) {
					form.rawData.forEach(function(section) {
						section.elements.forEach(function(element) {
							if (!element.timeAgg) {
								element.timeAgg = 'sum';
								update = true;
							}

							if (!element.geoAgg) {
								element.geoAgg = 'sum';
								update = true;
							}
						});
					});
				});

			if (update)
				updates.push(doc);
		});

		console.log("Updated documents", updates.length);

		async.eachSeries(
			updates,
			function(doc, cb) {
				request({method: "PUT", url: config.couchdb.url + '/' + config.couchdb.bucket + '/' + doc._id, json: doc}, cb)
			},
			callback
		);
	});
});

