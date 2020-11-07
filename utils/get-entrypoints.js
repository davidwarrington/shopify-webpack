const fs = require('fs');
const path = require('path');
const consola = require('consola');

/**
 * This module is basically just a rewrite of the {@link https://github.com/Shopify/slate/blob/master/packages/slate-tools/tools/webpack/config/utilities/get-template-entrypoints.js|Slate v1 get-entrypoints utilities}.
 */

const VALID_LIQUID_TEMPLATES = [
    '404',
    'article',
    'blog',
    'cart',
    'collection',
    'account',
    'activate_account',
    'addresses',
    'login',
    'order',
    'register',
    'reset_password',
    'gift_card',
    'index',
    'list-collections',
    'page',
    'password',
    'product',
    'search',
];

/** @param {string} filename */
const isValidTemplate = filename => {
    return VALID_LIQUID_TEMPLATES.some(
        template => filename.startsWith(template)
    );
}

const getEntrypoints = () => {
    const entrypoints = {};

    const entrypointsMap = {
        layout: fs.readdirSync('./src/scripts/layout'),
        templates: fs.readdirSync('./src/scripts/templates'),
        'templates/customers':  fs.readdirSync('./src/scripts/templates/customers'),
    };

    Object.keys(entrypointsMap).forEach(key => {
        entrypointsMap[key].forEach(file => {
            const name = path.parse(file).name;
            const entryFile = path.join(
                './src/scripts',
                key,
                `${name}.js`
            );
            const entryType = key.split('/')[0];

            // Ignore directories
            if (!fs.existsSync(entryFile)) {
                return;
            }

            // Ignore invalid template entrypoints
            if (entryType === 'templates' && !isValidTemplate(name)) {
                return;
            }

            entrypoints[`${entryType}.${name}`] = `./${entryFile}`;
        });
    });

    consola.info('Entrypoints:', entrypoints);

    return entrypoints;
}

module.exports = getEntrypoints;