const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = {
  webpack: (config, env) => {
    const isProduction = env === 'production'

    // Ensure mode is set
    config.mode = isProduction ? 'production' : 'development'

    // Don't bail on errors - continue to emit files
    config.bail = false

    // Keep default output configuration, just ensure path is set
    if (!config.output.path || !config.output.path.includes('build')) {
      config.output.path = path.resolve(__dirname, 'build')
    }

    config.resolve.alias['common'] = path.join(__dirname, '../bp/dist/common')
    config.resolve.alias['~'] = path.join(__dirname, './src')
    config.resolve.alias['botpress/shared'] = '@botpress/ui-shared'
    config.resolve.plugins = config.resolve.plugins.filter(p => !p instanceof ModuleScopePlugin)

    // Disable source maps in production to save memory
    config.devtool = false

    config.infrastructureLogging = { level: 'error' }

    // Disable performance hints to reduce memory
    config.performance = {
      hints: false,
      maxEntrypointSize: 512000000,
      maxAssetSize: 512000000
    }

    // Aggressive memory optimization
    config.optimization = {
      ...config.optimization,
      minimize: false, // Disable minification to save memory
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: {
        chunks: 'all',
        name: false
      },
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`
      }
    }

    // Remove or disable memory-intensive plugins
    config.plugins = config.plugins.filter(plugin => {
      const name = plugin.constructor.name
      // Remove TypeScript checker plugin completely
      if (name === 'ForkTsCheckerWebpackPlugin') {
        return false
      }
      // Remove ESLint plugin
      if (name === 'ESLintWebpackPlugin') {
        return false
      }
      return true
    })

    config.plugins.push(
      new FileManagerPlugin({
        events: {
          onEnd: [
            {
              delete: [{ source: path.resolve(__dirname, '../bp/dist/admin/ui/public'), options: { force: true } }]
            },
            {
              copy: [
                {
                  source: 'build',
                  destination: path.resolve(__dirname, '../bp/dist/admin/ui/public')
                }
              ]
            }
          ]
        }
      })
    )

    const oneOfConfigIdx = config.module.rules.findIndex(x => x.oneOf)

    // Override CSS loaders to ignore URL resolution (avoids missing font file errors)
    config.module.rules[oneOfConfigIdx].oneOf = config.module.rules[oneOfConfigIdx].oneOf.map(rule => {
      if (rule.test && (rule.test.toString().includes('\\.css') || rule.test.toString().includes('\\.scss'))) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use = rule.use.map(loader => {
            if (typeof loader === 'object' && loader.loader && loader.loader.includes('css-loader')) {
              return {
                ...loader,
                options: {
                  ...loader.options,
                  url: false // Disable URL resolution to avoid missing font errors
                }
              }
            }
            return loader
          })
        }
      }
      return rule
    })

    // Configuration works for react and react-dom, but @blueprintjs still needs a special handling to make it work
    config.module.rules = [
      {
        test: require.resolve('react'),
        loader: 'expose-loader',
        options: {
          exposes: ['React']
        }
      },
      {
        test: require.resolve('react-dom'),
        loader: 'expose-loader',
        options: {
          exposes: ['ReactDOM']
        }
      },
      {
        test: require.resolve('@botpress/ui-shared'),
        loader: 'expose-loader',
        options: {
          exposes: ['BotpressShared']
        }
      },
      ...config.module.rules
    ]

    return config
  },
  devServer: configFunction => {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost)
      const target = 'http://localhost:3000'

      config.before = app => {
        app.use('/studio/:botId', (req, res) => res.redirect(`${target}/studio/${req.params.botId}`))

        const proxyPaths = ['/assets', '/lite', '/api', '/admin/env.js']
        proxyPaths.forEach(path => app.use(path, createProxyMiddleware({ target })))

        app.use(createProxyMiddleware('/socket.io', { target, ws: true, changeOrigin: true }))
      }

      config.after = app => {
        app.use('*', createProxyMiddleware({ target }))
      }

      return config
    }
  }
}
