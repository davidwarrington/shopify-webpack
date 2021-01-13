const path = require('path');

/** @typedef {{[key: string]: string}} Entrypoints */
/**
 * @typedef {{
 *  entrypoint: string;
 *  filename: string;
 *  parentDirectory?: string;
 *  type: string;
 * }} ModulePartialData
 */

const entryNameDelimiter = '@';
const entryPartsDelimiter = '.';

/**
 * @param {string} filename
 * @param {'development'|'production'} mode
 */
const getAssetSrc = (filename, mode) =>
    mode === 'production'
        ? `{{ '${filename}' | asset_url }}`
        : `https://localhost:3000/assets/${filename}`;

/**
 * @param {string} type
 * @param {string[]} otherFileNameParts
 */
const getEntrypointKey = (type, otherFileNameParts) => {
    const filename = otherFileNameParts.join(entryPartsDelimiter);

    return `${type}.${path.basename(filename, path.extname(filename))}`;
};

/** @param {ModulePartialData[]} partials */
const getLiquidConditionsFromPartials = partials => {
    return partials
        .map(partial => {
            let name = partial.filename;
            if (partial.parentDirectory) {
                name = `${partial.parentDirectory}/${name}`;
            }

            return `${partial.type} == '${name}'`;
        })
        .join(' or ');
};

/**
 * @param {string} entry
 * @param {Entrypoints} entrypoints
 */
const getParentDirectory = (entry, entrypoints) => {
    const dirname = path.dirname(entrypoints[entry][0]);

    return path.basename(dirname);
};

/**
 * @param {string} filename
 * @param {Entrypoints} entrypoints
 * @returns {ModulePartialData[]}
 */
const getPartialsData = (filename, entrypoints) => {
    const fileNameParts = path
        .basename(filename, path.extname(filename))
        .split(entryNameDelimiter)
        .filter(part => !part.startsWith('vendor'));

    return fileNameParts.map(partialName => {
        const [type, ...otherFileNameParts] = partialName.split(
            entryPartsDelimiter
        );

        let parentDirectory;
        if (type === 'templates') {
            const parentDirectoryName = getParentDirectory(
                partialName,
                entrypoints
            );
            if (parentDirectoryName !== 'templates') {
                parentDirectory = parentDirectoryName;
            }
        }

        return {
            entrypoint: entrypoints[getEntrypointKey(type, otherFileNameParts)],
            filename: otherFileNameParts[0],
            parentDirectory,
            type: type === 'templates' ? 'template' : type,
        };
    });
};

const renderScriptTagsSnippet = ({ htmlWebpackPlugin }) => {
    const jsFiles = htmlWebpackPlugin.files.js.map(filename =>
        decodeURIComponent(path.basename(filename))
    );

    return jsFiles
        .map(filename => {
            if (filename === 'runtime.js') {
                return `<script src="${getAssetSrc(
                    filename,
                    htmlWebpackPlugin.options.entrypoints
                )}"></script>`;
            }

            const partials = getPartialsData(
                filename,
                htmlWebpackPlugin.options.entrypoints
            );

            const assetSrc = getAssetSrc(
                filename,
                htmlWebpackPlugin.options.mode
            );

            const conditions = getLiquidConditionsFromPartials(partials);

            return `
                {%- if ${conditions} -%}
                    <script src="${assetSrc}" defer></script>
                {%- else -%}
                    <link rel="prefetch" href="${assetSrc}" as="script">
                {%- endif -%}
            `;
        })
        .join('');
};

const renderStyleTagsSnippet = ({ htmlWebpackPlugin }) => {
    const cssFiles = htmlWebpackPlugin.files.css.map(filename =>
        decodeURIComponent(path.basename(filename))
    );

    return cssFiles
        .map(filename => {
            const partials = getPartialsData(
                filename,
                htmlWebpackPlugin.options.entrypoints
            );
            const assetSrc = getAssetSrc(
                filename,
                htmlWebpackPlugin.options.mode
            );

            const conditions = getLiquidConditionsFromPartials(partials);

            return `
                {%- if ${conditions} -%}
                    <link href="${assetSrc}" rel="stylesheet">
                {%- else -%}
                    <link rel="prefetch" href="${assetSrc}" as="style">
                {%- endif -%}
            `;
        })
        .join('');
};

module.exports = {
    renderScriptTagsSnippet,
    renderStyleTagsSnippet,
};
