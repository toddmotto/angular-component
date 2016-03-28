/*! angular-component v0.0.7 | (c) 2016 @toddmotto | https://github.com/toddmotto/angular-component */
(function () {

  var ng = angular.module;

  function identifierForController(controller, ident) {
    if (ident && typeof ident === 'string') return ident;
    if (typeof controller === 'string') {
      var match = /^(\S+)(\s+as\s+(\w+))?$/.exec(controller);
      if (match) return match[3];
    }
  }

  function module() {

    var hijacked = ng.apply(this, arguments);

    if (hijacked.component) {
      return hijacked;
    }

    function component(name, options) {

      function factory($injector) {

        function makeInjectable(fn) {
          var closure;
          var isArray = angular.isArray(fn);
          if (angular.isFunction(fn) || isArray) {
            return function (tElement, tAttrs) {
              return $injector.invoke((isArray ? fn : [
                '$element',
                '$attrs',
                fn
              ]), this, {
                $element: tElement,
                $attrs: tAttrs
              });
            };
          } else {
            return fn;
          }
        }

        var requires = [name];
        var ctrlNames = [];
        if (angular.isObject(options.require)) {
          for (var prop in options.require) {
            requires.push(options.require[prop]);
            ctrlNames.push(prop);
          }
        }

        return {
          controller: options.controller || angular.noop,
          controllerAs: identifierForController(options.controller) || options.controllerAs || '$ctrl',
          template: makeInjectable(
            !options.template && !options.templateUrl ? '' : options.template
          ),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: options.bindings || {},
          bindToController: !!options.bindings,
          restrict: 'E',
          require: requires,
          link: {
            pre: function ($scope, $element, $attrs, $ctrls) {
              var self = $ctrls[0];
              for (var i = 0; i < ctrlNames.length; i++) {
                self[ctrlNames[i]] = $ctrls[i + 1];
              }
              if (typeof self.$onInit === 'function') {
                self.$onInit();
              }
            },
            post: function ($scope, $element, $attrs, $ctrls) {
              var self = $ctrls[0];
              if (typeof self.$postLink === 'function') {
                self.$postLink();
              }
              if (typeof self.$onDestroy === 'function') {
                $scope.$on('$destroy', function () {
                  self.$onDestroy.call(self);
                });
              }
            }
          }
        };
      }

      for (var key in options) {
        if (key.charAt(0) === '$') {
          factory[key] = options[key];
        }
      }

      factory.$inject = ['$injector'];

      return hijacked.directive(name, factory);

    }

    hijacked.component = component;

    return hijacked;

  }

  angular.module = module;

})();
