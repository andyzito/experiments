'use strict'

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  return gulp.src('./sass/d3_frequency/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./d3_frequency'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./sass/d3_frequency/**/*.scss', ['sass']);
});
