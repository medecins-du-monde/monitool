// Karma configuration
// Generated on Wed Aug 12 2015 12:30:19 GMT+0200 (CEST)

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],

		client: {
			captureConsole: true
		},


		// list of files / patterns to load in the browser
		files: [
			'client/bower_components/blob/Blob.js',
			'client/bower_components/canvas-to-Blob.js/canvas-toBlob.js',
			'client/bower_components/file-saver/FileSaver.min.js',
			'client/bower_components/angular/angular.js',
			'client/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
			'client/bower_components/angular-ui-router/release/angular-ui-router.min.js',
			'client/bower_components/angular-ui-select/dist/select.min.js',
			'client/bower_components/angular-cookies/angular-cookies.min.js',
			'client/bower_components/angular-resource/angular-resource.min.js',
			'client/bower_components/angular-translate/angular-translate.min.js',
			'client/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js',
			'client/bower_components/angular-translate-storage-local/angular-translate-storage-local.min.js',
			'client/bower_components/d3/d3.min.js',
			'client/bower_components/c3/c3.min.js',
			'client/bower_components/handsontable/dist/handsontable.full.min.js',
			'client/bower_components/Sortable/Sortable.min.js',
			'client/bower_components/Sortable/ng-sortable.js',
			
			'client/bower_components/angular-mocks/angular-mocks.js',

			'client/js/**/*.js',
			'client/i18n/*.js'
		],


		// list of files to exclude
		exclude: [
		],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['spec'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true
	})
}
