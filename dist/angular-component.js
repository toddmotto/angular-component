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

        if (options.bindings) {
          var props = [];
          angular.forEach(options.bindings, function(binding, compPropName){
            var matchRE = binding.match(/^<(.*)/);
            var propName = matchRE && matchRE[1] ? matchRE[1] : compPropName;

            if (matchRE) {
              options.bindings[compPropName] = '&' + propName;

              props.push(compPropName);

            }
          });

          var ctrlFn = options.controller;
          options.controller = function() {
            var ctrl = this;

            angular.forEach(props, function(prop){
              ctrl[prop] = ctrl[prop]();
            });

            return ctrlFn();
          };
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
          require: options.require
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
