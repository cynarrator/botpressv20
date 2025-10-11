const webpack = require('webpack')
const path = require('path')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = ({ full, lite }) => {
  // Fix the publicPath for dynamic chunk loading
  full.output = {
    ...full.output,
    publicPath: '/assets/modules/code-editor/web/'
  }

  // Add Node.js polyfills for browser
  full.resolve = {
    ...full.resolve,
    fallback: {
      ...(full.resolve.fallback || {}),
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      vm: require.resolve('vm-browserify'),
      process: require.resolve('process/browser')
    }
  }

  // Inject polyfill-init at the very start (sets up globals)
  const originalEntry = full.entry
  full.entry = async () => {
    const entries = typeof originalEntry === 'function' ? await originalEntry() : originalEntry
    return [path.resolve(__dirname, 'polyfill-init.js')].concat(entries)
  }

  // Provide Buffer and process globals via ProvidePlugin as fallback
  full.plugins = [
    ...full.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new MonacoWebpackPlugin({
      languages: ['typescript', 'javascript', 'json'],
      features: [
        'bracketMatching',
        'caretOperations',
        'clipboard',
        'codeAction',
        'codelens',
        'colorPicker',
        'comment',
        'contextmenu',
        'coreCommands',
        'cursorUndo',
        'dnd',
        'documentSymbols',
        'find',
        'folding',
        'fontZoom',
        'format',
        'gotoError',
        'gotoLine',
        'gotoSymbol',
        'hover',
        'inPlaceReplace',
        'indentation',
        'inlineHints',
        'iPadShowKeyboard',
        'linesOperations',
        'links',
        'multicursor',
        'parameterHints',
        'quickCommand',
        'quickHelp',
        'quickOutline',
        'referenceSearch',
        'rename',
        'smartSelect',
        'snippets',
        'suggest',
        'toggleHighContrast',
        'toggleTabFocusMode',
        'transpose',
        'unusualLineTerminators',
        'viewportSemanticTokens',
        'wordHighlighter',
        'wordOperations',
        'wordPartOperations'
      ]
    })
  ]

  // Fix font file loader for monaco-editor
  full.module = {
    ...full.module,
    rules: [
      ...full.module.rules,
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
        generator: {
          filename: '../fonts/[name][ext]'
        }
      }
    ]
  }

  return [full, lite]
}
