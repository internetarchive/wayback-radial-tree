var gulp    = require('gulp');
var browserify = require('gulp-browserify');
var babel   = require('gulp-babel');
$           = require('gulp-load-plugins')();
meta        = require('./package.json');

var argv    = require('minimist')(process.argv.slice(2));

var jsDir   = 'src/js/',
sassDir     = 'src/sass/',
fontsDir    = 'src/fonts/',
distDir     = 'build',
banner      = [
    '/*!',
    ' * =============================================================',
    ' * <%= name %> v<%= version %> - <%= description %>',
    ' * <%= homepage %>',
    ' *',
    ' * (c) 2017 - <%= author %>',
    ' * =============================================================',
    ' */\n\n'
].join('\n');

var onError = function (err) {
    $.util.beep();
    console.log(err.toString());
    this.emit('end');
};

gulp.task('fonts', function() {
    return gulp.src(fontsDir + '**/*')
        .pipe(gulp.dest(distDir + "/fonts"));
});

gulp.task('sass', function() {
    return gulp.src(sassDir + '*.scss')
        .pipe($.plumber({ errorHandler: onError }))
        .pipe($.sass())
        .pipe($.autoprefixer())
        .pipe($.header(banner, meta))
        // .pipe(gulp.dest(distDir + "/css")) //
        .pipe($.if(!argv.dev, $.minifyCss()))
        .pipe($.if(!argv.dev, $.rename(meta.name + '.min.css')))
        .pipe($.if(!argv.dev, gulp.dest(distDir + "/css")));
});

gulp.task('scripts', function() {
return gulp.src([jsDir + '*.js'])
    .pipe(babel({presets: ['env']}))
    .pipe(browserify())
    .pipe($.plumber({ errorHandler: onError }))
    // .pipe(gulp.dest(distDir + "/js")) //
    .pipe($.header(banner, meta))
    .pipe($.rename(meta.name + '.js'))
    // .pipe(gulp.dest(distDir + "/js")) 
    .pipe($.if(!argv.dev, $.uglify()))
    .pipe($.if(!argv.dev, $.header(banner, meta)))
    .pipe($.if(!argv.dev, $.rename(meta.name + '.min.js')))
    .pipe($.if(!argv.dev, gulp.dest(distDir + "/js")));
});


gulp.task('default', ['sass', 'scripts', 'fonts'], function() {
    gulp.watch(jsDir + '**/*.js', ['scripts']);
    gulp.watch(sassDir + '**/*.scss', ['sass']);
});

gulp.task('build', ['sass', 'scripts', 'fonts']);
