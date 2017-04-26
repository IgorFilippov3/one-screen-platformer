var gulp = require('gulp');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var open = require('gulp-open');

gulp.task('scripts', function(){
    return gulp.src('./js/*.js')
      .pipe(concat('dist.js'))
      .pipe(gulp.dest('./dist/'))
      .pipe(connect.reload());
});

gulp.task('connect', function() {
  connect.server({
  	port: 8080,
		base: 'http://localhost/',
		livereload: true
  	});
});

gulp.task('open', ['connect'], function() {
	gulp.src('index.html')
		.pipe(open({ uri: 'http://localhost' + ':' + 8080}));
});

gulp.task('watch', function(){
    gulp.watch('./js/*.js', ['scripts']);
});

gulp.task('start', ['open', 'watch']);
