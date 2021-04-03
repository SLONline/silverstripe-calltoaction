/* Webpack Configuration
===================================================================================================================== */
const Path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpackConfig = require('@silverstripe/webpack-config');
const {
	      resolveJS,
	      externalJS,
	      moduleJS,
	      pluginJS,
	      moduleCSS,
	      pluginCSS,
      } = webpackConfig;

console.log(externalJS());

const ENV = process.env.NODE_ENV;
const PATHS = {
	MODULES   : 'node_modules',
	FILES_PATH: '../',
	ROOT      : Path.resolve(),
	SRC       : Path.resolve('client/src'),
	DIST      : Path.resolve('client/dist'),
	LEGACY_SRC: Path.resolve('client/src/legacy'),
};

const externals = externalJS(ENV, PATHS);
delete externals.reactstrap;

const config = [
	{
		name   : 'js',
		entry  : {
			bundle              : `${PATHS.SRC}/bundles/bundle.js`,
			'TinyMCE_call-to-action': `${PATHS.LEGACY_SRC}/entwine/TinyMCE_call-to-action.js`,
		},
		output : {
			path    : PATHS.DIST,
			filename: 'js/[name].js',
		},
		devtool: (ENV !== 'production') ? 'source-map' : '',
		resolve: resolveJS(ENV, PATHS),
		externals,
		module : moduleJS(ENV, PATHS),
		plugins: pluginJS(ENV, PATHS),
	},
	{
		name   : 'css',
		entry  : {
			bundle: `${PATHS.SRC}/bundles/bundle.scss`,
		},
		output : {
			path    : PATHS.DIST,
			filename: 'styles/[name].css',
		},
		devtool: (ENV !== 'production') ? 'source-map' : '',
		module : moduleCSS(ENV, PATHS),
		plugins: pluginCSS(ENV, PATHS),
	},
];

// Use WEBPACK_CHILD=js or WEBPACK_CHILD=css env var to run a single config
module.exports = (process.env.WEBPACK_CHILD)
	? config.find((entry) => entry.name === process.env.WEBPACK_CHILD)
	: module.exports = config;