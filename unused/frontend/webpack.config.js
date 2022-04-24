const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	// No need for minification etc.
	mode: 'development',

	// Import polyfills, then our code
	entry: ["babel-polyfill", "./src/init.js"],

	// Output everything as a big bundle
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
							"plugins": ["angularjs-annotate", "syntax-dynamic-import"]
						}
					}
				]
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: 'html-loader',
						options: {minimize: true}
					}
				]
			},
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'}
				]
			},
			{
				test: /\.(svg|eot|woff|woff2|ttf)$/,
				use: [
					{loader: 'file-loader'}
				]
			}
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
			inject: 'head'
		}),
	],

    devServer: {
        port: 8081,
        compress: false,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                pathRewrite: { '^/api': '' },
            },
        }
    },

};
