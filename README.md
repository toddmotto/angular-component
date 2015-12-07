# angular-component.js

Start using `component()` now!

> [View live demo in v1.3.0](http://jsfiddle.net/toddmotto/wwzeo0sv)

angular-component.js is a `<1kb` script that adds `component()` support in Angular 1.5 to all Angular versions above `1.3`, so you can begin using the new method now.

_Note: you must include this script straight after `angular.js` and before your application code to ensure the `component()` method has been added to the `angular.module` global.

> Read about the Angular 1.5 `component()` method [here](http://toddmotto.com/exploring-the-angular-1-5-component-method)

```html
<div ng-app="app">
  <div ng-controller="MainCtrl as vm">
    <counter count="vm.count"></counter>
  </div>
</div>

<script>
angular
.module('app', [])
.component('counter', {
    bindings: {
      count: '='
    },
    controller: 'CounterCtrl',
    template: function ($element, $attrs) {
      return [
        '<div class="counter">',
          '<p>Counter component</p>',
          '<input type="text" ng-model="counter.count">',
          '<button type="button" ng-click="counter.decrement();">-</button>',
          '<button type="button" ng-click="counter.increment();">+</button>',
        '</div>'
      ].join('');
    }
})
.controller('CounterCtrl', function CounterCtrl() {
  function increment() {
    this.count++;
  }
  function decrement() {
    this.count--;
  }
  this.increment = increment;
  this.decrement = decrement;
})
.controller('MainCtrl', function MainCtrl() {
  this.count = 4;
});
</script>
```

## Installing with Bower

```
bower install https://github.com/toddmotto/angular-component.git
```

## Manual installation
Ensure you're using the files from the `dist` directory (contains compiled production-ready code). Ensure you place the script before the closing `</body>` tag.

```html
<body>
  <!-- html above -->
  <script src="angular-1.x.js"></script>
  <script src="dist/angular-component.js"></script>
  <script src="app.js"></script>
</body>
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using Gulp.

## Release history

- 0.0.1
  - Initial release
