import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';

const __dirname = path.resolve(); // In Node.js with support for ES modules __dirname is not available by default

export default {
    entry: path.resolve(__dirname, './src/script.js'),
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, './dist')
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, './static') }
            ]
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './src/index.html'),
            minify: true
        }),
        new MiniCSSExtractPlugin()
    ],
    module: {
        rules: [
            // HTML
            {
                test: /\.(html)$/,
                use: ['html-loader']
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },

            // CSS
            {
                test: /\.css$/,
                use: [MiniCSSExtractPlugin.loader, 'css-loader']
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'assets/images/'
                        }
                    }
                ]
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'assets/fonts/'
                        }
                    }
                ]
            }
        ]
    }
};
