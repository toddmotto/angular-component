describe('Component Method', () => {

  let createModule = () => angular.module('polyfill', []);

  it('should create the module.component method', () => {
    createModule();

    module('polyfill');

    expect(angular.module('polyfill').component).toBeDefined();
  });

  it('should return ddo with reasonable defaults', () => {
    createModule()
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

    createModule()
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

    createModule()
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

    createModule()
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

    createModule()
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

    createModule()
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject((polyfillComponentDirective) => {
      expect(polyfillComponentDirective[0]).toEqual(jasmine.objectContaining({
        controllerAs: 'vm'
      }));
    });
  });

});
