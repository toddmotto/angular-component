# angular-component.js

Start using `.component()` now!

> [View live demo in v1.3.0](https://jsfiddle.net/vz53audf)

angular-component.js is a `~1kb` script that adds `component()` support in Angular 1.5 to all Angular versions above `1.3`, so you can begin using the new method now.

_Note_: you must include this script straight after `angular.js` and before your application code to ensure the `component()` method has been added to the `angular.module` global.

> Read about the Angular 1.5 `component()` method [here](http://toddmotto.com/exploring-the-angular-1-5-component-method)

### Polyfill support

This polyfill supports the following feature set of the `.component()` method:

| Feature                                                        | Supports  |
|----------------------------------------------------------------|-----------|
| `angular.module.component()` method                            | Yes       |
| `bindings` property                                            | Yes       |
| `'E'` restrict default                                         | Yes       |
| `$ctrl` controllerAs default                                   | Yes       |
| `transclude` property                                          | Yes       |
| `template` support                                             | Yes       |
| `templateUrl` injectable for `$element` and `$attrs`           | Yes       |
| One-way data-binding emulated                                  | Yes       |
| Lifecycles: `$onInit`, `$onChanges`m `$postLink`, `$onDestroy` | Yes       |
| `require` Object for parent Component inheritance              | Yes       |
| `$` prefixed properties such as `$canActivate`                 | Yes       |

### Component method usage

```html
<div ng-app="app">
  <div ng-controller="MainCtrl as vm">
    <counter count="vm.count"></counter>
  </div>
</div>

<script>
angular
	.module('app', [])
  .component('parentComponent', {
    template: `
      <div>
        {{ $ctrl.user }}
        <child-component user="$ctrl.user" on-update="$ctrl.updateUser($event);"></child-component>
      </div>
    `,
    controller: function () {
      this.user = {
        name: 'Todd',
        location: 'England, UK'
      };
      this.updateUser = function (event) {
        this.user = event.user;
      };
    }
  })
	.component('childComponent', {
    bindings: {
      user: '<',
      onUpdate: '&'
    },
    controller: function () {
    	this.$onInit = function () {
        // component initialisation
      };
      this.$onChanges = function (changes) {
        if (changes.user) {
          this.user = angular.copy(this.user);
        }
      };
      this.$postLink = function () {
        // component post-link
      };
      this.$onDestroy = function () {
        // component $destroy function
      };
    },
    template: `
      <div>
        <input type="text" ng-model="$ctrl.user.name">
        <a href="" ng-click="$ctrl.onUpdate({$event: {user: $ctrl.user}});">Update</a>
      </div>
    `
  });
</script>
```

## Installing with NPM

```
npm install angular-component --save
```

## Installing with Bower

```
bower install angular-component.js --save
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

- 0.1.2
  - Version fixes
- 0.1.1
  - Version fixes
- 0.1.0
  - Add one-way data-binding and $onChanges lifecycle, stable release
- 0.0.8
  - Add new lifecycle hooks ($onInit, $onDestroy, $postLink)
- 0.0.7
  - Add `require` property from 1.5 stable, `restrict: 'E'` as default
- 0.0.6
  - Add automated `$` prefixed properties to factory Object
- 0.0.5
  - Add automatic function annotations
- 0.0.4
  - Fix Array dependency annotations [#11](https://github.com/toddmotto/angular-component/issues/11)
- 0.0.3
  - Fix bug caused by bugfix (aligns with new 1.5 changes)
- 0.0.2
  - Bugfix isolate scope when `bindings` is omitted, short-circuit if .component() is already supported
- 0.0.1
  - Initial release
