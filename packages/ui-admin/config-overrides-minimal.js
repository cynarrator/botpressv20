const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = {
  webpack: (config, env) => {
    console.log('Webpack mode:', config.mode, 'env:', env)

    config.resolve.alias['common'] = path.join(__dirname, '../bp/dist/common')
    config.resolve.alias['~'] = path.join(__dirname, './src')
    config.resolve.alias['botpress/shared'] = '@botpress/ui-shared'
    config.resolve.plugins = config.resolve.plugins.filter(p => !p instanceof ModuleScopePlugin)

    // Disable TypeScript checking to save memory
    config.plugins = config.plugins.filter(plugin => {
      const name = plugin.constructor.name
      return name !== 'ForkTsCheckerWebpackPlugin' && name !== 'ESLintWebpackPlugin'
    })

    console.log(
      'Plugins after filter:',
      config.plugins.map(p => p.constructor.name)
    )
    console.log('Output path:', config.output.path)

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
