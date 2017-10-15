'use strict'

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  gulp.src('./sass/d3_frequency/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./d3_frequency'));
  gulp.src('./sass/markov/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./markov'));
  gulp.src('./sass/tag/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./tag'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
});
