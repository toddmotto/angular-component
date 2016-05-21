module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'dist/angular-component.js',
      'tests/**/*.spec.js'
    ],
    exclude: [],
    plugins: [
      require('karma-chrome-launcher'),
      require('karma-jasmine'),
      require('karma-babel-preprocessor'),
      require('karma-spec-reporter'),
      require('karma-junit-reporter')
    ],
    preprocessors: {
      'tests/**/*.spec.js': ['babel']
    },
    babelPreprocessor: {
      options: {
        presets: ['es2015']
      }
    },
    reporters: ['spec', 'junit'],
    junitReporter: {
      outputDir: (process.env.CIRCLE_TEST_REPORTS || 'tests') + '/',
      outputFile: 'junit.xml',
      useBrowserName: false
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true,
    concurrency: Infinity
  })
};
