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

    function UNINITIALIZED_VALUE() {}
    let _UNINITIALIZED_VALUE = new UNINITIALIZED_VALUE();

    function SimpleChange(previous, current) {
      this.previousValue = previous;
      this.currentValue = current;
    }
    SimpleChange.prototype.isFirstChange = function () {
      return this.previousValue === _UNINITIALIZED_VALUE;
    };

    let component = (name, options) => {

      let controller = options.controller || function () {};

      let factory = ($injector, $parse) => {

        let oneWayQueue = [];
        let attrBindQueue = [];
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
            switch (binding.charAt(0)) {
              case '<':
                let oneWayAttr = binding.substring(1);
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
          let isArray = toString.call(fn) === '[object Array]';
          let isFunction = typeof fn === 'function';
          if (isFunction || isArray) {
            return (tElement, tAttrs) => {
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

        function pre($scope, $element, $attrs, $ctrls) {

          let changes = {};
          let destroyQueue;
          let self = $ctrls[0];
          let controllers = controllerNames;

          for (let i = 0, ii = controllers.length; i < ii; i++) {
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
              let current = watchers[i];
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

            for (let q = oneWayQueue.length; q--;) ((local, attr) => {

              let parentScope = $scope.$parent;
              let initialValue = self[local] = $parse($attrs[attr])(parentScope);
              self[local] = initialValue;
              changes[local] = new SimpleChange(_UNINITIALIZED_VALUE, initialValue);

              setupWatchers([
                {
                  ctx: parentScope,
                  exp: $attrs[attr],
                  fn(newValue, oldValue) {
                    self[local] = newValue;
                    updateChangeListener(local, newValue, oldValue, true);
                  }
                },
                {
                  ctx: $scope,
                  exp: () => self[local],
                  fn: (newValue, oldValue) => updateChangeListener(local, newValue, oldValue, false)
                }
              ]);

            })(oneWayQueue[q].local, oneWayQueue[q].attr);

            self.$onChanges(changes);

            $scope.$on('$destroy', () => {
              for (let i = destroyQueue.length; i--;) {
                destroyQueue[i]();
              }
              destroyQueue = undefined;
            });

          }

          if (typeof self.$onInit === 'function') {
            self.$onInit();
          }
          if (typeof self.$onDestroy === 'function') {
            $scope.$on('$destroy', () => self.$onDestroy.call(self));
          }

        }

        function post($scope, $element, $attrs, $ctrls) {
          let self = $ctrls[0];
          if (typeof self.$postLink === 'function') {
            self.$postLink();
          }
        }

        var ddo = {
          controller,
          controllerAs: identifierForController(controller) || options.controllerAs || '$ctrl',
          template: makeInjectable(!options.template && !options.templateUrl ? '' : options.template),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: bindings,
          bindToController: !!bindings,
          restrict: 'E',
          require,
          link: { pre, post }
        };

        return ddo;

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
