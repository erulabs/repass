'use strict'
require('babel-core/register')
import gulp from 'gulp'
import rimraf from 'rimraf'
import sourcemaps from 'gulp-sourcemaps'
import eslint from 'gulp-eslint'
import babel from 'gulp-babel'
import server from 'gulp-develop-server'
import mocha from 'gulp-mocha'
import webpack from 'webpack-stream'
import less from 'gulp-less'
import prepend from 'prepend-file'
import fs from 'fs'
const browserSync = require('browser-sync').create()

const DEST = '_build'
const SRC = 'src'
const SHARED_SRC = [`${SRC}/**/*.js`]
const CLIENT_SRC = `${SRC}/client/index.jsx`

let watching = false

gulp.task('clean', function (done) {
  rimraf(DEST, done)
})

gulp.task('client:vendor', function () {
  return gulp.src(`${SRC}/client/vendor.js`)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(webpack({
      devtool: 'source-map',
      watch: watching,
      output: { filename: `${DEST}/client/vendor.js` },
      module: {
        loaders: [ {
          test: /\.js?$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
          query: { presets: ['react', 'es2015'] }
        } ]
      }
    }))
		.pipe(gulp.dest('.'))
    .pipe(browserSync.stream())
})

gulp.task('client:less', function () {
  return gulp.src(`./${SRC}/client/**/*.less`)
    .pipe(less())
    .pipe(gulp.dest(`${DEST}/client/`))
    .pipe(browserSync.stream())
})

gulp.task('client:webpack', function () {
  return gulp.src(CLIENT_SRC)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(webpack({
      devtool: 'source-map',
      watch: watching,
      output: { filename: `${DEST}/client/index.js` },
      module: {
        loaders: [ {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
          query: { presets: ['react', 'es2015'] }
        } ]
      }
    }))
		.pipe(gulp.dest('.'))
    .pipe(browserSync.stream())
})

gulp.task('client:html', function () {
  return gulp.src(`${SRC}/client/index.html`)
		.pipe(gulp.dest(`${DEST}/client`))
    .pipe(browserSync.stream())
})

gulp.task('shared:es', function () {
  return gulp.src(SHARED_SRC)
    .pipe(eslint()).pipe(eslint.format())
    .pipe(sourcemaps.init())
		.pipe(babel({ presets: [ 'es2015' ] }))
    .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(DEST))
    .pipe(browserSync.stream())
})

const reloadBrowsersAfterDelay = function () {
  setTimeout(browserSync.reload, 250)
}

const allTasks = ['shared:es', 'client:html', 'client:vendor', 'client:webpack', 'client:less']

gulp.task('watch', allTasks, function () {
  watching = true
  browserSync.init({ server: { baseDir: `${DEST}/client` } })
  server.listen({ path: `./${DEST}/server/index.js` })
  gulp.watch(`${SRC}/client/*.jsx`, ['client:webpack'])
  gulp.watch(`${SRC}/client/vendor.js`, ['client:vendor'])
  gulp.watch(`${SRC}/client/*.html`, ['client:html'])
  gulp.watch(`${SRC}/client/**/*.less`, ['client:less'])
  gulp.watch(SHARED_SRC, ['shared:es', server.restart]).on('change', reloadBrowsersAfterDelay)
})

gulp.task('test', function () {
  return gulp.src(`test/*.js`, { read: false })
    .pipe(mocha({ reporter: 'spec' }))
})

gulp.task('finalize', allTasks, function () {
  prepend('./_build/cli/index.js', '#!/usr/bin/env node\n')
  fs.chmodSync('./_build/cli/index.js', '0770')
})

gulp.task('default', ['clean'], function () {
  gulp.start(allTasks)
})
