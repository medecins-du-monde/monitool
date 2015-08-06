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

gulp.task('clean', function(cb) {
	del(['client/build/**/*'], cb);
});

gulp.task('copy-static', function() {
	gulp.src('client/dev/index-prod.html').pipe(rename('index.html')).pipe(gulp.dest('client/build'));
	gulp.src('client/dev/bower_components/fontawesome/fonts/*').pipe(gulp.dest('client/build'));
	gulp.src('client/dev/bower_components/bootstrap/fonts/*').pipe(gulp.dest('client/build'));
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

			if (doc.type === 'project') {
				if (doc.entities)
					return;

				// rename entities, groups and forms
				doc.entities = doc.inputEntities;
				doc.groups = doc.inputGroups;
				doc.forms = doc.dataCollection;

				delete doc.inputEntities;
				delete doc.inputGroups;
				delete doc.dataCollection;

				doc.forms.forEach(function(form) {
					// rename sections
					form.sections = form.rawData;
					delete form.rawData;

					// rewrite partitions
					form.sections.forEach(function(section) {
						section.elements.forEach(function(element) {
							element.partitions = [];
							if (element.partition1.length)
								element.partitions.push(element.partition1);
							if (element.partition2.length)
								element.partitions.push(element.partition2);
							delete element.partition1;
							delete element.partition2;
						});
					});

					// move indicator computation to the indicator meta in the root project.
					form.fields.forEach(function(field) {
						var indicatorMeta = doc.indicators[field.indicatorId];
						if (field.type == 'formula') {
							indicatorMeta.formula = field.formulaId;
							indicatorMeta.parameters = {};

							for (var key in field.parameters) {
								if (field.parameters[key].type === 'raw')
									indicatorMeta.parameters[key] = {
										variable: field.parameters[key].rawId,
										filter: field.parameters[key].filter.map(function(filter) {
											return Array.isArray(filter) ? filter.sort().join('.') : filter;
										})
									};
								else if (field.parameters[key].type === 'zero')
									indicatorMeta.parameters[key] = {variable: null, filter: []};
								else
									throw new Error('Invalid subfield type');
							}
						}
						else if (field.type === 'raw') {
							indicatorMeta.formula = null;
							indicatorMeta.variable = field.rawId;
							indicatorMeta.filter = field.filter.map(function(filter) {
								return Array.isArray(filter) ? filter.sort().join('.') : filter;
							});
						}
						else if (field.type === 'zero') {
							indicatorMeta.formula = null;
							indicatorMeta.variable = null;
							indicatorMeta.filter = [];
						}
						else
							throw new Error('Unexpected field type.');
					});

					delete form.fields;
				});

				// Remove custom coloring in indicatorMeta
				for (var indicatorId in doc.indicators) {
					delete doc.indicators[indicatorId].showRed;
					delete doc.indicators[indicatorId].showYellow;
				}
			}
			else if (doc.type === 'indicator') {
				if (['forbidden', 'optional', 'mandatory'].indexOf(doc.operation) !== -1 && doc.scope)
					return;

				if (['forbidden', 'optional', 'mandatory'].indexOf(doc.operation) === -1)
					doc.operation = 'optional';

				if (!doc.scope)
					doc.scope = 'broad';
			}
			else if (doc.type === 'input') {
				var updated = false;

				var values = {};
				for (var elementId in doc.values) {
					if (elementId === 'sum')
						continue;
					else if (typeof doc.values[elementId] === 'number')
						values[elementId] = doc.values[elementId];
					else {
						updated = true;
						for (var p1 in doc.values[elementId]) {
							if (p1 === 'sum')
								continue;
							else if (typeof doc.values[elementId][p1] === 'number')
								values[elementId + '.' + p1] = doc.values[elementId][p1];
							else {
								for (var p2 in doc.values[elementId][p1]) {
									if (p2 === 'sum')
										continue;
									else
										values[elementId + '.' + [p1, p2].sort().join('.')] = doc.values[elementId][p1][p2];
								}
							}
						}
					}
				}

				doc.values = values;

				if (!updated)
					return;
			}
			else
				return

			updates.push(doc);
		});

		console.log("Updated documents", updates.length);
		// console.log(updates)

		async.eachLimit(
			updates,
			4,
			function(doc, cb) {
				request({method: "PUT", url: config.couchdb.url + '/' + config.couchdb.bucket + '/' + doc._id, json: doc}, cb)
			},
			callback
		);
	});
});

