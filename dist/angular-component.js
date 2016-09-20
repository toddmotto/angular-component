/*! angular-component v0.1.3 | (c) 2016 @toddmotto | https://github.com/toddmotto/angular-component */
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

        var oneWayQueue = [];

        function parseBindings(bindings) {
          var newBindings = {};
          for (var prop in bindings) {
            var binding = bindings[prop];
            if (binding.charAt(0) === '<') {
              var attr = binding.substring(1);
              oneWayQueue.unshift({
              	local: prop,
                attr: attr === '' ? prop : attr
              });
            } else {
              newBindings[prop] = binding;
            }
          }
          return newBindings;
        }

        var modifiedBindings = parseBindings(options.bindings);

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
          scope: modifiedBindings || {},
          bindToController: !!modifiedBindings,
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
              if (typeof self.$onDestroy === 'function') {
                $scope.$on('$destroy', function () {
                  self.$onDestroy.call(self);
                });
              }
              var changes;
              function triggerOnChanges() {
                self.$onChanges(changes);
                changes = undefined;
              }
              function updateChangeListener(key, newValue, oldValue, flush) {
                if (typeof self.$onChanges === 'function') {
                  if (!changes) {
                    changes = {};
                  }
                  if (changes[key]) {
                    oldValue = changes[key].currentValue;
                  }
                  changes[key] = {
                    currentValue: newValue,
                    previousValue: oldValue
                  };
                  if (flush) {
                    triggerOnChanges();
                  }
                }
              }
              if (oneWayQueue.length) {
                var destroyQueue = [];
                for (var q = oneWayQueue.length; q--;) {
                  (function(current){
                    var unbindParent = $scope.$parent.$watch($attrs[current.attr], function (newValue, oldValue) {
                      self[current.local] = newValue;
                      updateChangeListener(current.local, newValue, oldValue, true);
                    });
                    destroyQueue.unshift(unbindParent);
                    var unbindLocal = $scope.$watch(function () {
                      return self[current.local];
                    }, function (newValue, oldValue) {
                      updateChangeListener(current.local, newValue, oldValue, false);
                    });
                    destroyQueue.unshift(unbindLocal);
                  })(oneWayQueue[q]);
                }
                $scope.$on('$destroy', function () {
                  for (var i = destroyQueue.length; i--;) {
                    destroyQueue[i]();
                  }
                });
              }
            },
            post: function ($scope, $element, $attrs, $ctrls) {
              var self = $ctrls[0];
              if (typeof self.$postLink === 'function') {
                self.$postLink();
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
