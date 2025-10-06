const fs = require('fs')
const path = require('path')

let minify

try {
  // Try to load terser from terser-webpack-plugin's dependencies
  minify = require('terser').minify
} catch (err) {
  try {
    // Fallback: try loading from terser-webpack-plugin
    const TerserPlugin = require('terser-webpack-plugin')
    minify = require('terser-webpack-plugin/node_modules/terser').minify
  } catch (err2) {
    console.error('Terser not found. Skipping minification.')
    console.error('If you need minification, install terser: yarn add -D terser')
    process.exit(0)
  }
}

// Try to find the build output directory (could be 'build' or 'dist')
let buildDir = path.join(__dirname, 'build', 'static', 'js')
if (!fs.existsSync(buildDir)) {
  buildDir = path.join(__dirname, 'dist', 'static', 'js')
}
if (!fs.existsSync(buildDir)) {
  buildDir = path.join(__dirname, 'build')
}
if (!fs.existsSync(buildDir)) {
  buildDir = path.join(__dirname, 'dist')
}

async function minifyFile(filePath) {
  try {
    const filename = path.basename(filePath)
    console.log(`Minifying: ${filename}`)

    const code = fs.readFileSync(filePath, 'utf8')
    const originalSize = (code.length / 1024).toFixed(2)

    const result = await minify(code, {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    })

    if (result.code) {
      fs.writeFileSync(filePath, result.code, 'utf8')
      const newSize = (result.code.length / 1024).toFixed(2)
      const saved = (originalSize - newSize).toFixed(2)
      console.log(`✓ ${filename}: ${originalSize}KB → ${newSize}KB (saved ${saved}KB)`)
    }
  } catch (error) {
    console.error(`Error minifying ${path.basename(filePath)}:`, error.message)
  }
}

function findJSFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList
  }

  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      findJSFiles(filePath, fileList)
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

async function minifyAllFiles() {
  if (!fs.existsSync(buildDir)) {
    console.log('Build directory not found, skipping minification')
    console.log(`Tried: ${buildDir}`)
    return
  }

  const jsFiles = findJSFiles(buildDir)

  if (jsFiles.length === 0) {
    console.log('No JS files found to minify')
    console.log(`Searched in: ${buildDir}`)
    return
  }

  console.log(`\n🗜️  Minifying ${jsFiles.length} JavaScript files...\n`)

  for (const filePath of jsFiles) {
    await minifyFile(filePath)
  }

  console.log('\n✅ Minification complete!\n')
}

minifyAllFiles().catch(err => {
  console.error('Minification failed:', err)
  process.exit(1)
})
