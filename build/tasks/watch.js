var gulp = require('gulp');
var paths = require('../paths');

// this task wil watch for changes
// to js, html, and css files. Also, by depending on the
// serve task, it will instantiate a browserSync session
gulp.task('watch', function() {
  gulp.watch(paths.source, gulp.series('build-commonjs'))
    .on('change', path => console.log('File ' + path + ' was changed, running tasks...'))
    .on('unlink', path => console.log('File ' + path + ' was removed, running tasks...'))
    .on('add', path => console.log('File ' + path + ' was added, running tasks...'));
});
