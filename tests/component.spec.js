describe('Component Method', () => {

  it('should create the module.component method', () => {
    angular
      .module('polyfill', []);

    module('polyfill');

    expect(angular.module('polyfill').component).toBeDefined();
  });

  it('should return ddo with reasonable defaults', () => {
    angular
      .module('polyfill', [])
      .component('polyfillComponent', {});

    module('polyfill');

    inject((polyfillComponentDirective) => {
      expect(polyfillComponentDirective[0]).toEqual(jasmine.objectContaining({
        controller: jasmine.any(Function),
        controllerAs: '$ctrl',
        template: '',
        templateUrl: undefined,
        transclude: undefined,
        scope: {},
        bindToController: true,
        restrict: 'E'
      }));
    });
  });

  it('should return ddo with assigned options', () => {
    function polyfillCtrl() {}

    const polyfillComponent = {
      controller: polyfillCtrl,
      controllerAs: 'ctrl',
      template: 'abc',
      templateUrl: 'def.html',
      transclude: true,
      bindings: {
        abc: '='
      }
    };

    angular
      .module('polyfill', [])
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject((polyfillComponentDirective) => {
      expect(polyfillComponentDirective[0]).toEqual(jasmine.objectContaining({
        controller: polyfillCtrl,
        controllerAs: 'ctrl',
        template: 'abc',
        templateUrl: 'def.html',
        transclude: true,
        scope: {
          abc: '='
        },
        bindToController: true,
        restrict: 'E'
      }));
    });
  });

  it('should allow passing injectable functions as template/templateUrl', () => {
    let log = '';

    const polyfillComponent = {
      template($element, $attrs) {
        log += `template,${$element},${$attrs}\n`;
      },
      templateUrl($element, $attrs) {
        log += `templateUrl,${$element},${$attrs}\n`;
      }
    };

    angular
      .module('polyfill', [])
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject((polyfillComponentDirective) => {
      polyfillComponentDirective[0].template('a', 'b');
      polyfillComponentDirective[0].templateUrl('c', 'd');
      expect(log).toEqual('template,a,b\ntemplateUrl,c,d\n');
    });
  });

  it('should allow passing injectable arrays as template/templateUrl', () => {
    let log = '';

    const polyfillComponent = {
      template: ['$element', '$attrs', ($element, $attrs) => {
        log += `template,${$element},${$attrs}\n`;
      }],
      templateUrl: ['$element', '$attrs', ($element, $attrs) => {
        log += `templateUrl,${$element},${$attrs}\n`;
      }]
    };

    angular
      .module('polyfill', [])
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject((polyfillComponentDirective) => {
      polyfillComponentDirective[0].template('a', 'b');
      polyfillComponentDirective[0].templateUrl('c', 'd');
      expect(log).toEqual('template,a,b\ntemplateUrl,c,d\n');
    });
  });

  it('should allow passing transclude as object', function() {
    const polyfillComponent = {
      transclude: {}
    };

    angular
      .module('polyfill', [])
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject((polyfillComponentDirective) => {
      expect(polyfillComponentDirective[0]).toEqual(jasmine.objectContaining({
        transclude: {}
      }));
    });
  });

  it('should give ctrl as syntax priority over controllerAs', function() {
    const polyfillComponent = {
      controller: 'MyCtrl as vm'
    };

    angular
      .module('polyfill', [])
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject((polyfillComponentDirective) => {
      expect(polyfillComponentDirective[0]).toEqual(jasmine.objectContaining({
        controllerAs: 'vm'
      }));
    });
  });

});
