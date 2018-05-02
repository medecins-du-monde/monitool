const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ZopfliPlugin = require('zopfli-webpack-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');

module.exports = {
	// No need for minification etc.
	mode: 'development',

	// Import polyfills, then our code
	entry: {
		initscript: './src/init.js'
	},

	// Output everything as a big bunder
	output: {
		path: path.resolve('dist'),
		filename :'monitool2-[name]-[chunkhash].js'
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
							"plugins": [
								"angularjs-annotate",
								"syntax-dynamic-import"
							]
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
		new webpack.ContextReplacementPlugin(
			/moment[\/\\]locale$/,
			/(fr|es|en)\.js/
		),

		new HtmlWebpackPlugin({
			favicon: 'src/favicon.ico',
			template: 'src/index.html',
			chunks: ['initscript'],
			inject: 'head'
		}),

		new ZopfliPlugin({
			asset: "[path].gz[query]",
			algorithm: "zopfli",
			test: /\.(css|html|js|svg|ttf)$/,
			threshold: 0,
			minRatio: 0.8
		}),

		new BrotliPlugin({
			asset: '[path].br[query]',
			test: /\.(css|html|js|svg|ttf)$/,
			threshold: 0,
			minRatio: 0.8
		}),

        // new BundleAnalyzerPlugin({
        //     analyzerMode: 'static'
        // })
	]
};
