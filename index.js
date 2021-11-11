/**
 *
 * @param {string} str
 */
function removeMarks(str) {
    return str.substr(1, str.length - 2);
}

class ReplacePlugin {
    imgTagReg = /<img(.*?)>/gm;
    markdownImg = /!\[(.*?)\)/gm;

    /**
     *
     * @param {string} path
     */
    isRelativePath(path) {
        return path.startsWith('.');
    }

    /**
     *
     * @param {string} path
     */
    transformBaseUrl(path) {
        const staticPath = 'static';
        return path.substr(path.indexOf(staticPath) + staticPath.length);
    }

    /**
     *
     * @param {string} content
     */
    extractPathFromHtmlTag(content) {
        const srcReg = /src="(.*?)"/gm;
        const imgs = content.match(this.imgTagReg);
        const results = imgs.map((img) => {
            if (srcReg.test(img)) {
                const [_, rawPath] = img.match(srcReg)[0].split('=');
                return removeMarks(rawPath);
            }
            return null;
        });
        return results.filter(Boolean);
    }

    /**
     *
     * @param {string} content
     */
    extractPathFromMarkdownTag(content) {
        const srcReg = /\((.*?)\)/gm;
        const imgs = content.match(this.imgTagReg);
        const results = imgs.map((img) => {
            const src = img.match(srcReg)[0];
            return removeMarks(src);
        });
        return results;
    }

    apply(compiler) {
        compiler.hooks.emit.tap('Test', (compilation) => {
            Object.keys(compilation.assets).forEach((asset) => {
                if (asset.endsWith('html')) {
                    let content = compilation.assets[asset].source();
                    if (this.imgTagReg.test(content)) {
                        const srcPaths = this.extractPathFromHtmlTag(content);
                        srcPaths.forEach((src) => {
                            if (this.isRelativePath(src)) {
                                const nextSrc = this.transformBaseUrl(src);
                                content = content.replace(src, nextSrc);
                            }
                        });
                    }

                    if (this.markdownImg.test(content)) {
                        const srcPaths = this.extractPathFromMarkdownTag(
                            content
                        );
                        srcPaths.forEach((src) => {
                            if (this.isRelativePath(src)) {
                                const nextSrc = this.transformBaseUrl(src);
                                content = content.replace(src, nextSrc);
                            }
                        });
                    }

                    compilation.assets[asset] = {
                        source() {
                            return content;
                        },
                        size() {
                            return content.length;
                        },
                    };
                }
            });
        });
    }
}

module.exports = function replaceImagePath() {
    return {
        name: 'replace-image-path',
        configureWebpack() {
            return {
                plugins: [new ReplacePlugin()],
            };
        },
    };
};
