const gulp = require('gulp');
const sass = require('gulp-sass');
const htmlmin = require('gulp-htmlmin');
const gulpAmpValidator = require('gulp-amphtml-validator');
const plumber = require('gulp-plumber');
const cssnano = require('gulp-cssnano');
const image = require('gulp-image');
const fs = require("fs");
const inject = require('gulp-inject-string');
const browser = require('browser-sync');
const del = require('del');
const gulpSequence = require('gulp-sequence')
const reload = browser.reload;

gulp.task('scss', () => {
  gulp.src('src/style/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(cssnano())
    .pipe(gulp.dest('src/style'));
});

gulp.task('html', () => {
  let cssContent = fs.readFileSync("src/style/style.css", "utf8");
  gulp.src("src/components/*.html")
    .pipe(inject.after('style amp-custom>', cssContent))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("public/"))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('data', () => {
  gulp.src("src/data/*.json")
    .pipe(gulp.dest("public/data/"))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('amphtml:validate', () => {
  return gulp.src("public/*.html")
    .pipe(gulpAmpValidator.validate())
    .pipe(gulpAmpValidator.format())
    .pipe(gulpAmpValidator.failAfterError());
});

gulp.task('serve', () => {
  browser({
    port: 3000,
    open: false,
    ghostMode: false,
    server: {
      baseDir: 'public'
    }
  });
});

gulp.task('images', () => {
  return gulp.src('src/img/*')
    .pipe(image({
      pngquant: true,
      optipng: true,
      zopflipng: true,
      jpegRecompress: true,
      mozjpeg: true,
      guetzli: false,
      gifsicle: true,
      svgo: true,
      concurrent: 10,
      quiet: false
    }))
    .pipe(gulp.dest('public/img/'))
});

// clean task to keep public directory in sync when files are removed from /src
gulp.task('clean', () => {
  return del('public/**', { force: true });
});

// clean needs to run first. then build html/css and compress images.  then validate. then serve, and finally watch task.
gulp.task('default', gulpSequence('clean', ['html', 'scss', 'images', 'data'], 'amphtml:validate', 'serve', 'watch'));

gulp.task('watch', () => {
  gulp.watch("src/style/style.scss", ['scss']);
  gulp.watch("src/style/style.css", ['html']);
  gulp.watch("src/components/*.html", ['html']);
  gulp.watch("src/data/data.json", ['data']);
  gulp.watch("src/img/**", ['images']);
  gulp.watch("public/*.html", ['amphtml:validate'])
});