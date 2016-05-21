((angular) => {

  let ng = angular.module;
  let toString = Object.prototype.toString;

  let identifierForController = (controller, ident) => {
    if (ident && typeof ident === 'string') return ident;
    if (typeof controller === 'string') {
      let match = /^(\S+)(\s+as\s+(\w+))?$/.exec(controller);
      if (match) return match[3];
    }
  };

  function module() {

    let hijacked = ng(...arguments);

    if (hijacked.component) {
      return hijacked;
    }

    let component = (name, options) => {

      let controller = options.controller || function () {};

      let factory = ($injector, $parse) => {

        let oneWayQueue = [];
        let {require, controllerNames} = parseRequire(options.require);
        let bindings = parseBindings(options.bindings);

        function parseRequire(required) {
          let parsed = {
            require: [name],
            controllerNames: []
          };
          if (toString.call(required) === '[object Object]') {
            for (let prop in required) {
              parsed.require.push(required[prop]);
              parsed.controllerNames.push(prop);
            }
          }
          return parsed;
        }

        function parseBindings(bindings) {
          let parsed = {};
          for (let prop in bindings) {
            let binding = bindings[prop];
            if (binding.charAt(0) === '<') {
              let attr = binding.substring(1);
              oneWayQueue.unshift({
              	local: prop,
                attr: attr === '' ? prop : attr
              });
            } else {
              parsed[prop] = binding;
            }
          }
          return parsed;
        }

        function makeInjectable(fn) {
          let isArray = toString.call(fn) === '[object Array]';
          let isFunction = typeof fn === 'function';
          if (isFunction || isArray) {
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

        function postLink($scope, $element, $attrs, $ctrls) {
          let self = $ctrls[0];
          if (typeof self.$postLink === 'function') {
            self.$postLink();
          }
        }

        function preLink($scope, $element, $attrs, $ctrls) {

          let changes = {};
          let self = $ctrls[0];
          let controllers = controllerNames;

          for (let i = 0; i < controllers.length; i++) {
            self[controllers[i]] = $ctrls[i + 1];
          }

          function updateChangeListener(key, newValue, oldValue, flush) {
            if (typeof self.$onChanges !== 'function') {
              return;
            }
            if (!changes) {
              changes = {};
            }
            changes[key] = {
              currentValue: newValue,
              previousValue: changes[key] ? changes[key].currentValue : oldValue
            };
            if (flush) {
              self.$onChanges(changes);
              changes = undefined;
            }
          }


          if (oneWayQueue.length) {
            let destroyQueue = [];
            for (let q = oneWayQueue.length; q--;) {
              let current = oneWayQueue[q];
              let initialValue = $parse($attrs[current.attr])($scope.$parent);
              self[current.local] = initialValue;
              let unbindParent = $scope.$parent.$watch($attrs[current.attr], function (newValue, oldValue) {
                self[current.local] = newValue;
                updateChangeListener(current.local, newValue, oldValue, true);
              });
              changes[current.local] = {
                currentValue: initialValue
              };
              destroyQueue.unshift(unbindParent);
              let unbindLocal = $scope.$watch(function () {
                return self[current.local];
              }, function (newValue, oldValue) {
                updateChangeListener(current.local, newValue, oldValue, false);
              });
              destroyQueue.unshift(unbindLocal);
            }
            self.$onChanges(changes);
            $scope.$on('$destroy', () => {
              for (let i = destroyQueue.length; i--;) {
                destroyQueue[i]();
              }
            });
          }

          if (typeof self.$onInit === 'function') {
            self.$onInit();
          }

          if (typeof self.$onDestroy === 'function') {
            $scope.$on('$destroy', () => {
              self.$onDestroy.call(self);
            });
          }

        }

        return {
          controller: controller,
          controllerAs: identifierForController(controller) || options.controllerAs || '$ctrl',
          template: makeInjectable(
            !options.template && !options.templateUrl ? '' : options.template
          ),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: bindings || {},
          bindToController: !!bindings,
          restrict: 'E',
          require: require,
          link: {
            pre: preLink,
            post: postLink
          }
        };
      };

      for (let key in options) {
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
