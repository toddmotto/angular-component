/*! angular-component v0.0.1 | (c) 2015 @toddmotto | https://github.com/toddmotto/angular-component */
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

    function component(name, options) {

      function factory($injector) {

        function makeInjectable(fn) {
          if (angular.isFunction(fn)) {
            return function (tElement, tAttrs) {
              return $injector.invoke(fn, this, {
                $element: tElement,
                $attrs: tAttrs
              });
            };
          } else {
            return fn;
          }
        }

        return {
          controller: options.controller || angular.noop,
          controllerAs: identifierForController(options.controller) || options.controllerAs || name,
          template: makeInjectable(
            !options.template && !options.templateUrl ? '' : options.template
          ),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude === undefined ? true : options.transclude,
          scope: (
            options.isolate === false ?
            true :
            options.bindings
          ),
          bindToController: !!options.bindings,
          restrict: options.restrict || 'E'
        };

      }

      if (options.$canActivate) {
        factory.$canActivate = options.$canActivate;
      }

      if (options.$routeConfig) {
        factory.$routeConfig = options.$routeConfig;
      }

      factory.$inject = ['$injector'];

      return hijacked.directive(name, factory);

    }

    hijacked.component = component;

    return hijacked;

  }

  angular.module = module;

})();
