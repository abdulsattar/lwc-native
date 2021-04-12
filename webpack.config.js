const webpack = require("@nativescript/webpack");
const lwcWebpackPlugin = require("lwc-webpack-plugin");

const { basename, dirname, extname, resolve } = require("path");

const lwcResolver = require("@lwc/module-resolver");

const EMPTY_STYLE = resolve(__dirname, "mocks", "empty-style.js");

/**
 * Webpack plugin to resolve LWC modules.
 */
class LwcModuleResolverPlugin {
  constructor() {
    this.modules = [{ dir: "/Users/abdulsattarmohammed/hadi/app/modules" }];
  }

  apply(resolver) {
    this.fs = resolver.fileSystem;
    this.resolver = resolver;
    resolver.hooks.module.tapAsync("LWC module", (req, ctx, cb) =>
      this.resolveModule(req, ctx, cb)
    );
    // resolver.hooks.file.tapAsync("LWC CSS", (req, ctx, cb) =>
    //   this.resolveFile(req, ctx, cb)
    // );
  }

  resolveModule(req, ctx, cb) {
    let {
      request,
      // eslint-disable-next-line prefer-const
      query,
      context: { issuer }
    } = req;

    try {
      if (!issuer) {
        issuer = process.cwd();
      }

      request = request.replace("./", "");

      let mod;

      if (this.modules && this.modules.length) {
        mod = lwcResolver.resolveModule(request, issuer, {
          modules: this.modules
        });
      } else {
        mod = lwcResolver.resolveModule(request, issuer);
      }

      return cb(undefined, {
        path: mod.entry,
        query,
        file: true,
        resolved: true
      });
    } catch (e) {
      // LWC Module Resolver will throw errors for any non lwc modules
      cb();
    }
  }

  isImplicitHTMLImport(importee, importer) {
    return (
      extname(importer) === ".js" &&
      extname(importee) === ".html" &&
      dirname(importer) === dirname(importee) &&
      basename(importer, ".js") === basename(importee, ".html")
    );
  }

  resolveFile(req, ctx, cb) {
    return cb();
  }
}

module.exports = env => {
  webpack.init(env);

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  webpack.chainWebpack(config => {
    config.resolve.plugin("lwc-resolver").use(LwcModuleResolverPlugin);
    config.plugin("lwc-webpack-plugin").use(lwcWebpackPlugin);
  });

  return webpack.resolveConfig();
};
