/*! angular-component v0.1.2 | (c) 2016 @toddmotto | https://github.com/toddmotto/angular-component */
'use strict';

(function (angular) {

  var ng = angular.module;
  var toString = Object.prototype.toString;

  var identifierForController = function identifierForController(controller, ident) {
    if (ident && typeof ident === 'string') return ident;
    if (typeof controller === 'string') {
      var match = /^(\S+)(\s+as\s+(\w+))?$/.exec(controller);
      if (match) return match[3];
    }
  };

  function module() {

    var hijacked = ng.apply(undefined, arguments);

    if (hijacked.component) {
      return hijacked;
    }

    function UNINITIALIZED_VALUE() {}
    var _UNINITIALIZED_VALUE = new UNINITIALIZED_VALUE();

    function SimpleChange(previous, current) {
      this.previousValue = previous;
      this.currentValue = current;
    }
    SimpleChange.prototype.isFirstChange = function () {
      return this.previousValue === _UNINITIALIZED_VALUE;
    };

    var component = function component(name, options) {

      var controller = options.controller || function () {};

      var factory = function factory($injector, $parse) {

        var oneWayQueue = [];
        var attrBindQueue = [];

        var _parseRequire = parseRequire(options.require);

        var require = _parseRequire.require;
        var controllerNames = _parseRequire.controllerNames;

        var bindings = parseBindings(options.bindings);

        function parseRequire(required) {
          var parsed = {
            require: [name],
            controllerNames: []
          };
          if (toString.call(required) === '[object Object]') {
            for (var prop in required) {
              parsed.require.push(required[prop]);
              parsed.controllerNames.push(prop);
            }
          }
          return parsed;
        }

        function parseBindings(bindings) {
          var parsed = {};
          for (var prop in bindings) {
            var binding = bindings[prop];
            switch (binding.charAt(0)) {
              case '<':
                var oneWayAttr = binding.substring(1);
                oneWayQueue.unshift({
                  local: prop,
                  attr: oneWayAttr === '' ? prop : oneWayAttr
                });
                break;
              case '@':
                /**
                 * @TODO: Finalise '@' $observers
                 * Need to look into this implementation, we could just
                 * use the native '@' bindings, however we don't get $observe()
                 * access to update the change hash, so might need manual binding
                 */
                // let attr = binding.substring(1);
                // attrBindQueue.unshift({
                //   local: prop,
                //   attr: attr === '' ? prop : attr
                // });
                parsed[prop] = binding;
                break;
              default:
                parsed[prop] = binding;
            }
          }
          return parsed;
        }

        function makeInjectable(fn) {
          var _this = this;

          var isArray = toString.call(fn) === '[object Array]';
          var isFunction = typeof fn === 'function';
          if (isFunction || isArray) {
            return function (tElement, tAttrs) {
              return $injector.invoke(isArray ? fn : ['$element', '$attrs', fn], _this, {
                $element: tElement,
                $attrs: tAttrs
              });
            };
          } else {
            return fn;
          }
        }

        function pre($scope, $element, $attrs, $ctrls) {

          var changes = {};
          var destroyQueue = void 0;
          var self = $ctrls[0];
          var controllers = controllerNames;

          for (var i = 0, ii = controllers.length; i < ii; i++) {
            self[controllers[i]] = $ctrls[i + 1];
          }

          var onChangesQueue;

          function triggerOnChangesHook() {
            self.$onChanges(changes);
            changes = undefined;
          }

          function updateChangeListener(key, newValue, oldValue, flush) {
            if (typeof self.$onChanges !== 'function' && newValue !== oldValue) {
              return;
            }
            if (!onChangesQueue) {
              onChangesQueue = [];
            }
            if (!changes) {
              changes = {};
            }
            if (changes[key]) {
              oldValue = changes[key].currentValue;
            }
            changes[key] = new SimpleChange(oldValue, newValue);
            if (flush) {
              triggerOnChangesHook();
            }
          }

          function setupWatchers(watchers) {
            for (var i = watchers.length; i--;) {
              var current = watchers[i];
              current.ctx.$watch(current.exp, current.fn);
              destroyQueue.unshift(current);
            }
          }

          /**
           * @TODO: This initial stuff works, but breaks the tests, needs more understanding
           */
          // if (attrBindQueue.length) {
          //   attrBindQueue.forEach(current => {
          //     self[current.local] = new SimpleChange(_UNINITIALIZED_VALUE, $attrs[current.attr]);
          //     $attrs.$observe(current.attr, newValue => {
          //       let oldValue = self[current.local];
          //       self[current.local] = newValue;
          //       updateChangeListener(current.local, newValue, oldValue, false);
          //     });
          //   });
          // }

          if (oneWayQueue.length) {

            destroyQueue = [];

            for (var q = oneWayQueue.length; q--;) {
              (function (local, attr) {

                var parentScope = $scope.$parent;
                var initialValue = self[local] = $parse($attrs[attr])(parentScope);
                self[local] = initialValue;
                changes[local] = new SimpleChange(_UNINITIALIZED_VALUE, initialValue);

                setupWatchers([{
                  ctx: parentScope,
                  exp: $attrs[attr],
                  fn: function fn(newValue, oldValue) {
                    self[local] = newValue;
                    updateChangeListener(local, newValue, oldValue, true);
                  }
                }, {
                  ctx: $scope,
                  exp: function exp() {
                    return self[local];
                  },
                  fn: function fn(newValue, oldValue) {
                    return updateChangeListener(local, newValue, oldValue, false);
                  }
                }]);
              })(oneWayQueue[q].local, oneWayQueue[q].attr);
            }self.$onChanges(changes);

            $scope.$on('$destroy', function () {
              for (var _i = destroyQueue.length; _i--;) {
                destroyQueue[_i]();
              }
              destroyQueue = undefined;
            });
          }

          if (typeof self.$onInit === 'function') {
            self.$onInit();
          }
          if (typeof self.$onDestroy === 'function') {
            $scope.$on('$destroy', function () {
              return self.$onDestroy.call(self);
            });
          }
        }

        function post($scope, $element, $attrs, $ctrls) {
          var self = $ctrls[0];
          if (typeof self.$postLink === 'function') {
            self.$postLink();
          }
        }

        var ddo = {
          controller: controller,
          controllerAs: identifierForController(controller) || options.controllerAs || '$ctrl',
          template: makeInjectable(!options.template && !options.templateUrl ? '' : options.template),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: bindings,
          bindToController: !!bindings,
          restrict: 'E',
          require: require,
          link: { pre: pre, post: post }
        };

        return ddo;
      };

      for (var key in options) {
        if (key.charAt(0) === '$') {
          factory[key] = options[key];
        }
      }

      factory.$inject = ['$injector', '$parse'];

      return hijacked.directive(name, factory);
    };

    hijacked.component = component;

    return hijacked;
  }

  angular.module = module;
})(window.angular);