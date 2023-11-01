import { merge } from 'webpack-merge';
import commonConfiguration from './webpack.common.mjs';
import {internalIpV4} from 'internal-ip';
import portFinderSync from 'portfinder-sync';

const infoColor = (_message) => {
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`;
};

export default merge(
    commonConfiguration,
    {
        mode: 'development',
        devServer: {
            host: '0.0.0.0',
            port: portFinderSync.getPort(8080),
            static: './dist',  // contentBase is now static
            watchFiles: './dist', // watchContentBase is now watchFiles
            open: true,
            https: false,
            allowedHosts: 'all', // replaces disableHostCheck
            client: {
                overlay: true,
            },
            onAfterSetupMiddleware: function(server) {
                const port = server.options.port;
                const https = server.options.https ? 's' : '';
                internalIpV4().then((localIp) => {
                    const domain1 = `http${https}://${localIp}:${port}`;
                    const domain2 = `http${https}://localhost:${port}`;
                    console.log(`Project running at:\n  - ${infoColor(domain1)}\n  - ${infoColor(domain2)}`);
                });
            }
        }
    }
);
