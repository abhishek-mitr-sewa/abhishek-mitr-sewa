const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin')


module.exports = {
    node: {
        __dirname: true
    },
    output: {
        filename: 'bundle.js'
    },
    target: 'node',
    externals: [nodeExternals()],
    devtool: 'source-map',
    resolve: {
        modules: [path.join(__dirname, 'node_modules')]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                include: [path.join(__dirname, 'utility'), path.join(__dirname, 'model'), path.join(__dirname, 'config'), path.join(__dirname, 'middleware')],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin()
    ]
}
