// Karma configuration
// Generated on Wed Aug 12 2015 12:30:19 GMT+0200 (CEST)

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [

			'client/dev/bower_components/moment/min/moment.min.js',
			'client/dev/bower_components/Blob.js/Blob.js',
			'client/dev/bower_components/canvas-toBlob.js/canvas-toBlob.js',
			'client/dev/bower_components/FileSaver.js/FileSaver.min.js',
			'client/dev/bower_components/angular/angular.js',
			'client/dev/bower_components/angular-ui-router/release/angular-ui-router.min.js',
			'client/dev/bower_components/angular-moment/angular-moment.min.js',
			'client/dev/bower_components/angular-ui-select/dist/select.min.js',
			'client/dev/bower_components/angular-bootstrap-show-errors/src/showErrors.min.js',
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
			
			'client/dev/bower_components/angular-mocks/angular-mocks.js',

			'client/dev/js/**/*.js',
			'client/dev/i18n/*.js'
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
		reporters: ['progress'],


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
		singleRun: false
	})
}
