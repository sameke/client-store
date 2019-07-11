var gulp = require('gulp');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var paths = require('../paths');
var assign = Object.assign || require('object.assign');
var notify = require('gulp-notify');
var typescript = require('gulp-typescript');
require('./clean');

// transpiles changed es6 files to SystemJS format
// the plumber() call prevents 'pipe breaking' caused
// by errors from other gulp plugins
// https://www.npmjs.com/package/gulp-plumber
var typescriptCompiler = typescriptCompiler || null;
gulp.task('build-commonjs', function () {
    typescriptCompiler = typescript.createProject('commonjs.tsconfig.json', {
        "typescript": require('typescript')
    });

    return gulp.src(paths.source)
        .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
        .pipe(changed(paths.outputCommonjs, { extension: '.ts' }))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(typescriptCompiler())
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
        .pipe(gulp.dest(paths.outputCommonjs));
});

gulp.task('build-amd', function () {
    typescriptCompiler = typescript.createProject('amd.tsconfig.json', {
        "typescript": require('typescript')
    });

    return gulp.src(paths.source)
        .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
        .pipe(changed(paths.outputWeb, { extension: '.ts' }))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(typescriptCompiler())
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
        .pipe(gulp.dest(paths.outputWeb));
});

gulp.task('move-commonjs', () => {
    return gulp.src(paths.move)
        .pipe(gulp.dest(paths.outputCommonjs));
});

gulp.task('move-web', () => {
    return gulp.src(paths.moveWeb.concat(paths.move))
        .pipe(gulp.dest(paths.outputWeb));
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('build-commonjs', 'move-commonjs', 'build-amd', 'move-web'))
);