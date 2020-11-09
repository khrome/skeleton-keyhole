module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        files: [
            'keyhole.js',
            'engines/**/*.js',
            'test/**/*.js',
            'test/**/*.css'
        ],
        preprocessors: {
          '**/*.js': ['env']
        },
        envPreprocessor: [
          'MAPBOX_TOKEN',
          'GOOGLE_TOKEN'
        ],
        reporters: ['spec'],
        specReporter: {
          maxLogLines: 5,         // limit number of lines logged per test
          suppressErrorSummary: true,  // do not print error summary
          suppressFailed: false,  // do not print information about failed tests
          suppressPassed: false,  // do not print information about passed tests
          suppressSkipped: true,  // do not print information about skipped tests
          showSpecTiming: false // print the time elapsed for each spec
        },
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless', 'Firefox', 'FirefoxDeveloper', 'FirefoxNightly', 'IE'],
        autoWatch: false,
        concurrency: Infinity,
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
            },
        },
    })
}
