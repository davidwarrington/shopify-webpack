const chokidar = require('chokidar');
const themeKit = require('@shopify/themekit');
const Builder = require('./packages/Builder');
const getShopifyEnvKeys = require('./utils/get-shopify-env-keys');

const LAYOUT_DIR = 'src/scripts/layout/';
const TEMPLATES_DIR = 'src/scripts/templates/';
const builder = new Builder();

(async () => {
    await builder.start('watch');
    themeKit.command('watch', {
        dir: 'dist',
        ...getShopifyEnvKeys(),
    });

    chokidar
        .watch('./src', { ignoreInitial: true })
        .on('all', async (event, path) => {
            const changeInLayoutOrTemplatesDir = [
                LAYOUT_DIR,
                TEMPLATES_DIR,
            ].some(dirPath => path.startsWith(dirPath));
            const restartEvent = ['add', 'unlink'].includes(event);

            if (changeInLayoutOrTemplatesDir && restartEvent) {
                builder.restart('watch');
            }
        });
})();
