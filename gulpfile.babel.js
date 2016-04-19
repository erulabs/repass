'use strict'

const gulp = require('gulp')
const gutil = require('gutil')
const babel = require('gulp-babel')
const sourcemaps = require('gulp-sourcemaps')
const eslint = require('gulp-eslint')
const webpack = require('webpack-stream')
const less = require('gulp-less')
const nodemon = require('gulp-nodemon')
const proxy = require('proxy-middleware')
const url = require('url')
const changed = require('gulp-changed')
const modRewrite = require('connect-modrewrite')
const preprocess = require('gulp-preprocess')
const rimraf = require('rimraf')
const gulpSequence = require('gulp-sequence')
const browserSync = require('browser-sync').create()
const prepend = require('prepend-file')
const fs = require('fs')
const mocha = require('gulp-mocha')

let watching = false
const api_tasks = ['api:js']
const cli_tasks = ['cli:js']
const lib_tasks = ['lib:js']
const www_tasks = ['www:js', 'www:style', 'www:assets', 'www:html']
const all_tasks = api_tasks.concat(www_tasks).concat(lib_tasks).concat(cli_tasks)
const ASSET_URL_PREFIX = process.env.ASSET_URL_PREFIX || '/'
const es6Presets = ['es2016', 'stage-0']

const webpack_loaders = [ {
  test: /\.jsx?$/,
  exclude: /(node_modules|bower_components)/,
  loader: 'babel-loader',
  query: { presets: es6Presets.concat(['react']) }
}, {
  test: /\.json$/,
  exclude: /(node_modules|bower_components)/,
  loader: 'json'
} ]

gulp.task('all_tasks', function (done) {
  gulpSequence('clean', all_tasks, done)
})

gulp.task('clean', function (done) {
  rimraf('./build', done)
})

gulp.task('reloadBrowsersAfterDelay', function () {
  setTimeout(browserSync.reload, 250)
})

gulp.task('www:js', function () {
  return gulp.src('./src/www/index.jsx')
    .pipe(changed('./build/www/'))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(webpack({
      devtool: 'source-map',
      watch: watching,
      output: { filename: './build/www/index.js' },
      module: { loaders: webpack_loaders }
    }))
    .on('error', gutil.log)
		.pipe(gulp.dest('.'))
    .pipe(browserSync.stream())
})
gulp.task('www:style', function () {
  const dir = '/www/style/'
  return gulp.src('./src' + dir + 'index.less')
    .pipe(changed('./build' + dir))
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('./build' + dir))
    .pipe(browserSync.stream())
})
gulp.task('www:assets', function () {
  const dir = '/www/assets/'
  return gulp.src('./src' + dir + '**/*')
    .pipe(changed('./build' + dir))
    .on('error', gutil.log)
    .pipe(gulp.dest('./build' + dir))
    .pipe(browserSync.stream())
})
gulp.task('www:html', function () {
  const dir = '/www/'
  return gulp.src('./src' + dir + '**/*.html')
    .pipe(changed('./build' + dir))
    .pipe(preprocess({ context: { ASSET_URL_PREFIX: ASSET_URL_PREFIX } }))
    .on('error', gutil.log)
    .pipe(gulp.dest('./build' + dir))
    .pipe(browserSync.stream())
})

gulp.task('api:js', function () {
  return gulp.src('src/api/**/*.js')
    .pipe(changed('build/api/'))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: es6Presets }))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build/api/'))
})
gulp.task('lib:js', function () {
  return gulp.src('src/lib/**/*.js')
    .pipe(changed('build/lib/'))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: es6Presets }))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build/lib/'))
})
gulp.task('cli:js', function () {
  return gulp.src('src/cli/**/*.js')
    .pipe(changed('build/cli/'))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: es6Presets }))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build/cli/'))
})

gulp.task('test', function () {
  return gulp.src(`test/*.js`, { read: false })
    .pipe(mocha({ reporter: 'spec' }))
})

gulp.task('finalize', function () {
  prepend('./build/cli/index.js', '#!/usr/bin/env node\n')
  fs.chmodSync('./build/cli/index.js', '0770')
})

gulp.task('watch', ['all_tasks'], function () {
  watching = true

  if (process.env.DOCKER_HOST) {
    process.env.DB_HOST = url.parse(process.env.DOCKER_HOST).hostname
  }

  const apiProxy = url.parse('http://localhost:9000/')
  apiProxy.route = '/api'
  browserSync.init({ server: {
    baseDir: './build/www',
    middleware: [
      modRewrite([
        '^[^\\.]*$ /index.html [L]'
      ]),
      proxy(apiProxy)
    ]
  }})
  nodemon({
    script: './build/api/index.js', ext: 'js',
    watch: ['./src/api/**/*.js'],
    tasks: all_tasks.concat(['reloadBrowsersAfterDelay'])
  })
  gulp.watch('src/api/**/*.js', ['api:js'])
  gulp.watch('src/cli/**/*.js', ['cli:js'])
  gulp.watch('src/lib/**/*.js', ['lib:js'])
  gulp.watch('src/www/**/*.jsx', ['www:js'])
  gulp.watch('src/www/style/**/*.less', ['www:style'])
  gulp.watch('src/www/assets/**/*', ['www:assets'])
  gulp.watch('src/www/**/*.html', ['www:html'])
})

gulp.task('default', ['all_tasks'])
gulp.task('www_tasks', ['www_tasks'])
gulp.task('api_tasks', ['api_tasks'])
gulp.task('lib_tasks', ['lib_tasks'])
gulp.task('cli_tasks', ['cli_tasks'])
