const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
	// No need for minification etc.
	mode: 'development',

	// Import polyfills, then our code
	entry: {
		initscript: './src/init.js',
		application: './src/app.js',
	},

	// Output everything as a big bunder
	output: {
		path: path.resolve('dist'),
		filename :'monitool2-[name].js'
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							"presets": ["env"],
							"plugins": ["angularjs-annotate"]
						}
					}
				]
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: 'html-loader',
						options: {
							minimize: true
						}
					}
				]
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader'
					},
					{
						loader: 'css-loader'
					}
				]
			},
			{
				test: /\.(svg|eot|woff|woff2|ttf)$/,
				use: [
					{
						loader: 'file-loader'
					}
				]
			}
		]
	},

	optimization: {
		minimizer: [
			new UglifyJsPlugin({
				extractComments: true
			})
		]
	},

	plugins: [
		new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(fr|es|en)\.js/),
	]
};
