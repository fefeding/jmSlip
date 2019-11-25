
console.log('start build');
const jshint = require('gulp-jshint');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const uglifyes = require('gulp-terser');
const babelify = require('babelify');
const standalonify = require('standalonify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const gulp = require('gulp');
const cleanimport = require('gulp-clean-import');
const gulpJsdoc2md = require('gulp-jsdoc-to-markdown')

const jsSources = [
    "../src/jmSlip.js",
   ];

//语法检测
gulp.task('jshint', function () { 
    
    //console.log('jshint:');
    return gulp.src(jsSources)
        .pipe(jshint({
            "esversion": 6
        }))
        .pipe(jshint.reporter('default'));
});

//生成文档
gulp.task('docs', function () { 
    return gulp.src(jsSources)
        .pipe(concat('jmSlip.md'))
        .pipe(gulpJsdoc2md({}))
        .on('error', function (err) {
            console.error('jsdoc2md failed', err.message);
        })
        .pipe(rename(function (path) {
        path.extname = '.md'
        }))
        .pipe(gulp.dest('../api'));
});

//编译成es6版本
gulp.task('build-js-es6', function () {     
    return gulp.src(jsSources) 
    .pipe(cleanimport())
    .pipe(concat('jmslip.es6.js'))
    .pipe(gulp.dest('../dist'))
    .pipe(uglifyes())
    .pipe(rename('jmslip.es6.min.js'))
    .pipe(gulp.dest('../dist'));
});

//编译成es5版本
gulp.task('build-js-cmd', function () {
    return browserify({
        entries: [
            '../src/jmSlip.js'
        ]
      })
    .transform("babelify", {
        presets: ['@babel/preset-env']
    })  //使用babel转换es6代码
    .bundle()  //合并打包
    .pipe(source('jmslip.js'))
    .pipe(buffer())
    .pipe(gulp.dest('../dist'))
    .pipe(rename('jmslip.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('../dist'));
});

let tasks = ['build-js-es6', 'build-js-cmd'];

gulp.task('default', gulp.parallel(tasks, function(done) {
    done();
}));  