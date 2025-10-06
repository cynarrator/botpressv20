const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = {
  webpack: (config, env) => {
    const isProduction = env === 'production'

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
      splitChunks: false, // Disable code splitting to reduce memory
      runtimeChunk: false,
      usedExports: false,
      concatenateModules: false
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
                  source: 'dist',
                  destination: path.resolve(__dirname, '../bp/dist/admin/ui/public')
                }
              ]
            }
          ]
        }
      })
    )

    const oneOfConfigIdx = config.module.rules.findIndex(x => x.oneOf)

    // Override the CSS generation - simplified to reduce memory usage
    config.module.rules[oneOfConfigIdx].oneOf = [
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]___[hash:base64:5]'
              },
              url: false,
              importLoaders: 1,
              sourceMap: false
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: false
            }
          }
        ]
      },
      ...config.module.rules[oneOfConfigIdx].oneOf
    ]

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
