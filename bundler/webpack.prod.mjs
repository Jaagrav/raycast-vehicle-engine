import { merge } from 'webpack-merge';
import commonConfiguration from './webpack.common.mjs';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

export default merge(
    commonConfiguration,
    {
        mode: 'production',
        plugins: [
            new CleanWebpackPlugin()
        ]
    }
);
