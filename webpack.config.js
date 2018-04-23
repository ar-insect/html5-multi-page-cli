const path = require('path');
const fs = require('fs');
var glob = require('glob');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const WebpackMd5Hash = require('webpack-md5-hash');

//=========================================================
//  VARS
//---------------------------------------------------------
const NODE_ENV = process.env.NODE_ENV;

const ENV_DEVELOPMENT = NODE_ENV === 'development';
const ENV_PRODUCTION = NODE_ENV === 'production';

const HOST = '127.0.0.1';
const PORT = 3000;

const buildingForLocal = () => {
  return (NODE_ENV === 'development');
};

const ROOT_PATH = path.resolve(__dirname);
const BUILD_PATH = path.resolve(ROOT_PATH, 'build');

//=========================================================
//  CONFIG
//---------------------------------------------------------
const config = module.exports = {};

config.mode = buildingForLocal() ? 'development' : 'production';

config.resolve = {
  extensions: ['.js', '.ts', '.scss', '.json'],
  modules: [
    path.resolve('.'),
    'node_modules'
  ]
};

config.module = {
  rules: [
    {
      test: /\.ts$/,
      loader: 'ts-loader',
      exclude: /node_modules/
    },
    {
      test: /\.html$/,
      loader: 'raw-loader'
    },
    {
      test: /\.json$/,
      loader: 'json-loader'
    },
    {
      test: require.resolve('zepto'),
      loader: 'exports-loader?window.Zepto!script-loader'
    },
    {
      test: /\.(woff|svg|eot|ttf)\??.*$/,
      use: ['url-loader']
    },
    {
      test: /\.(png|jpg)$/,
      use: ['url-loader?limit=8192&name=images/[hash:8].[name].[ext]']
    },
    {
      test: /\.scss$/,
      // css-hot-loader will increase the packaged volume
      use:  buildingForLocal() ? [
          'css-hot-loader',
          // 'style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              includePaths: [ path.resolve('src/shared/styles') ],
            },
          }
        ] : [
          MiniCssExtractPlugin.loader,
          'css-loader?importLoaders=1',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              includePaths: [ path.resolve('src/shared/styles') ],
            }
          }
        ]
    }
  ]
};

config.plugins = [
  new MiniCssExtractPlugin({
    filename: buildingForLocal() ? '[name].css' : '[name].[chunkhash].css'
  })
];

function getEntry(globPath) {
  let entries = {},
    basename, tmp, pathname;

  glob.sync(globPath).forEach((entry) => {
    basename = path.basename(entry, path.extname(entry));
    tmp = entry.split('/').splice(-3);
    pathname = tmp.splice(0, 1) + '/' + basename; // html & js path
    entries[pathname] = entry;
  });
  return entries;
}

// multi entrys
config.entry = getEntry('./src/*.ts');

// output
config.output = {
  path: BUILD_PATH,
};

config.plugins.push(
  new CopyWebpackPlugin([
    { from: './src/shared/assets', to: 'assets' }
  ])
);

let pages = getEntry('./src/*.html');
for (let pathname in pages) {
  // html page config
  let conf = {
    filename: pathname + '.html',
    template: pages[pathname],
    chunksSortMode: 'manual',
    // hash: !buildingForLocal(),
    inject: 'body',
    chunksSortMode: function (chunk1, chunk2) {
      let orders = [ './polyfills', 'vendor', 'common', pathname ];
      let order1 = orders.indexOf(chunk1.names[0]);
      let order2 = orders.indexOf(chunk2.names[0]);
      return order1 > order2;
    },
    chunks: [ './polyfills', 'vendor', 'common', pathname ] // every html referenced js module
  };
  config.plugins.push(new HtmlWebpackPlugin(conf));
}

//=====================================
//  DEVELOPMENT
//-------------------------------------
if (ENV_DEVELOPMENT) {
  config.devtool = 'cheap-module-source-map';

  config.output.filename = '[name].js';

  config.plugins.push(
    // Suggested for hot-loading
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]), // ignore the d.ts file to avoid rechecking the d.ts file resulting from compiling
    new webpack.optimize.ModuleConcatenationPlugin(),
    // 3.0 New Features Scope Hoisting, scope upgrade,
    // which was proposed in webpack3. It will make the code smaller, because the function declaration statement will generate a lot of code.
    new webpack.NoEmitOnErrorsPlugin(),
    new ProgressPlugin()
  );

  config.devServer = {
    contentBase: './src',
    compress: true, // Is it gzip?
    historyApiFallback: true,
    host: HOST,
    port: PORT,
    stats: {
      cached: true,
      cachedAssets: true,
      chunks: true,
      chunkModules: false,
      colors: true,
      hash: false,
      reasons: true,
      timings: true,
      version: false
    }
  };

  config.watch = buildingForLocal();
  config.watchOptions = {
    ignored: /node_modules/,
    aggregateTimeout: 500, // prevent repeated saves Frequent recompilation, repeated saves within 500 mm without packing
    poll: 1000 // the number of file changes requested per second
  };
}

//=====================================
//  PRODUCTION
//-------------------------------------
if (ENV_PRODUCTION) {
  config.devtool = 'source-map';

  config.output.filename = '[name].[chunkhash].js';

  config.optimization = {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          compress: true,
          ecma: 6,
          mangle: true
        },
        sourceMap: true
      }),
      new OptimizeCssAssetsPlugin({})
    ],
    // Webpack4 removes the commonchunkplugin and uses the `common-chunk-and-vendor-chunk` configuration as follows
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true
        },
        common: {
          test: /src/,
          chunks: 'initial', // only deal with the entry file
          name: 'common',
          priority: 10,
          enforce: true
        }
      }
    }
  };

  config.plugins.push(
    new WebpackMd5Hash(),
    new CleanPlugin([BUILD_PATH])
  );
}
