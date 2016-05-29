describe('$onChanges lifecycle hook', () => {

  let createModule = () => angular.module('polyfill', []);

  it('should call `$onChanges`, if provided, when a one-way (`<`) or interpolation (`@`) bindings are updated', () => {
    let log = [];

    class TestController {
      constructor() {}
      $onChanges(change) {
        log.push(change);
      }
    }

    const polyfillComponent = {
      controller: TestController,
      bindings: {
        'prop1': '<',
        'prop2': '<',
        'other': '=',
        'attr': '@'
      }
    };

    createModule()
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject(($compile, $rootScope) => {
      $rootScope.$watch('val', (val, oldVal) => {
        $rootScope.val2 = val * 2;
      });

      const element = $compile('<polyfill-component prop1="val" prop2="val2" other="val3" attr="{{val4}}"></polyfill-component>')($rootScope);

      expect(log[0].prop1.currentValue).toEqual(undefined);
      expect(log[0].prop2.currentValue).toEqual(undefined);

      log = [];

      $rootScope.$apply('val = 42');

      expect(log[0].prop1.currentValue).toEqual(42);
      expect(log[1].prop2.currentValue).toEqual(84);

      log = [];

      $rootScope.$apply('val = 17');

      expect(log[0].prop1.currentValue).toEqual(17);
      expect(log[0].prop1.previousValue).toEqual(42);

      expect(log[1].prop2.currentValue).toEqual(34);
      expect(log[1].prop2.previousValue).toEqual(84);

      log = [];

      $rootScope.$apply('val3 = 63');
      expect(log).toEqual([]);

      //$rootScope.$apply('val4 = 22');
      //expect(log).toEqual([
      //  {
      //    attr: jasmine.objectContaining({previousValue: '', currentValue: '22'})
      //  }
      //]);
    });
  });

  it('should trigger `$onChanges` even if the inner value already equals the new outer value', function() {
    let log = [];

    class TestController {
      constructor() {
      }

      $onChanges(change) {
        log.push(change);
      }
    }

    const polyfillComponent = {
      controller: TestController,
      bindings: {
        'prop1': '<'
      }
    };

    createModule()
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject(($compile, $rootScope) => {
      const element = $compile('<polyfill-component prop1="val"></polyfill-component>')($rootScope);

      $rootScope.$apply('val = 1');

      expect(log.pop()).toEqual({prop1: jasmine.objectContaining({previousValue: undefined, currentValue: 1})});

      element.isolateScope().$ctrl.prop1 = 2;
      $rootScope.$apply('val = 2');
      expect(log.pop()).toEqual({prop1: jasmine.objectContaining({previousValue: 1, currentValue: 2})});
    });
  });

//   it('should pass the original value as `previousValue` even if there were multiple changes in a single digest', () => {
//     let log = [];
//
//     class TestController {
//       constructor() {
//       }
//
//       $onChanges(change) {
//         log.push(change);
//       }
//     }
//
//     const polyfillComponent = {
//       controller: TestController,
//       bindings: { 'prop': '<' }
//     };
//
//     createModule()
//       .component('polyfillComponent', polyfillComponent);
//
//     module('polyfill');
//
//     inject(($compile, $rootScope) => {
//       const element = $compile('<polyfill-component prop="a + b"></polyfill-component>')($rootScope);
//
//       $rootScope.$watch('a', function(val) { $rootScope.b = val * 2; });
//
//       expect(log[0]).toEqual({prop: jasmine.objectContaining({currentValue: undefined})});
//
//       log = [];
//
//       $rootScope.$apply('a = 42');
//       expect(log[1]).toEqual({prop: jasmine.objectContaining({currentValue: 126})});
//
//       log = [];
//
//       $rootScope.$apply('a = 7');
//       expect(log).toEqual([{prop: jasmine.objectContaining({previousValue: 126, currentValue: 21})}]);
//     });
//   });
//
//
  it('should trigger an initial onChanges call for each binding with the `isFirstChange()` returning true', () => {
    let log = [];

    class TestController {
      constructor() {
      }

      $onChanges(change) {
        log.push(change);
      }
    }

    const polyfillComponent = {
      controller: TestController,
      bindings: {
        prop: '<',
        attr: '@'
      }
    };

    createModule()
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject(($compile, $rootScope) => {
      $rootScope.$apply('a = 7');

      const element = $compile('<polyfill-component prop="a" attr="{{a}}"></polyfill-component>')($rootScope);

      expect(log).toEqual([
        {
          prop: jasmine.objectContaining({currentValue: 7}),
          // attr: jasmine.objectContaining({currentValue: '7'})
        }
      ]);
      expect(log[0].prop.isFirstChange()).toEqual(true);
      // expect(log[0].attr.isFirstChange()).toEqual(true);

      log = [];

      $rootScope.$apply('a = 9');
      expect(log).toEqual([
        {
          prop: jasmine.objectContaining({previousValue: 7, currentValue: 9}),
          // attr: jasmine.objectContaining({previousValue: '7', currentValue: '9'})
        }
      ]);
      expect(log[0].prop.isFirstChange()).toEqual(false);
      // expect(log[0].attr.isFirstChange()).toEqual(false);
    });
  });


  it('should trigger an initial onChanges call for each binding even if the hook is defined in the constructor', () => {
    let log = [];

    function TestController() {
      this.$onChanges = function(change) { log.push(change); };
    }

    const polyfillComponent = {
      controller: TestController,
      bindings: { 'prop': '<', attr: '@' }
    };

    createModule()
      .component('polyfillComponent', polyfillComponent);

    module('polyfill');

    inject(($compile, $rootScope) => {
      $rootScope.$apply('a = 7');

      const element = $compile('<polyfill-component prop="a" attr="{{a}}"></polyfill-component>')($rootScope);

      expect(log).toEqual([
        {
          prop: jasmine.objectContaining({currentValue: 7}),
          // attr: jasmine.objectContaining({currentValue: '7'})
        }
      ]);
      expect(log[0].prop.isFirstChange()).toEqual(true);
      // expect(log[0].attr.isFirstChange()).toEqual(true);

      log = [];
      $rootScope.$apply('a = 10');
      expect(log).toEqual([
        {
          prop: jasmine.objectContaining({previousValue: 7, currentValue: 10}),
          // attr: jasmine.objectContaining({previousValue: '7', currentValue: '10'})
        }
      ]);
      expect(log[0].prop.isFirstChange()).toEqual(false);
      // expect(log[0].attr.isFirstChange()).toEqual(false);
    });
  });

//   it('should only trigger one extra digest however many controllers have changes', () => {
//     let log = [];
//
//     class TestController1 {
//       constructor() {
//       }
//
//       $onChanges(change) {
//         log.push(['TestController1', change]);
//       }
//     }
//
//     class TestController2 {
//       constructor() {
//       }
//
//       $onChanges(change) {
//         log.push(['TestController2', change]);
//       }
//     }
//
//     const polyfillOne = {
//       controller: TestController1,
//       bindings: {
//         'prop': '<'
//       }
//     };
//
//     const polyfillTwo = {
//       controller: TestController2,
//       bindings: {
//         'prop': '<'
//       }
//     };
//
//     createModule()
//       .component('polyfillOne', polyfillOne)
//       .component('polyfillTwo', polyfillTwo);
//
//     module('polyfill');
//
//     inject(($compile, $rootScope) => {
//       let watchCount = 0;
//       $rootScope.$watch(function() { watchCount++; });
//
//       const element = $compile('<div><c1 prop="val1"></c1><c2 prop="val2"></c2></div>')($rootScope);
//
//       log = [];
//
//       $rootScope.$apply('val1 = 42; val2 = 17');
//
//       expect(log).toEqual([
//         ['TestController1', {prop: jasmine.objectContaining({currentValue: 42})}],
//         ['TestController2', {prop: jasmine.objectContaining({currentValue: 17})}]
//       ]);
//
//       expect(watchCount).toEqual(3);
//     });
//   });
//
//
//   it('should cope with changes occuring inside `$onChanges()` hooks', () => {
//     let log = [];
//
//     class OuterController {
//       constructor() {
//         this.prop1 = 0;
//       }
//
//       $onChanges(change) {
//         log.push(['OuterController', change]);
//
//         this.b = this.prop1 * 2;
//       }
//     }
//
//     class InnerController {
//       constructor() {
//         this.prop1 = 0;
//       }
//
//       $onChanges(change) {
//         log.push(['InnerController', change]);
//       }
//     }
//
//     const outer = {
//       controller: OuterController,
//       bindings: {
//         'prop1': '<'
//       },
//       template: '<inner prop2="$ctrl.b"></inner>'
//     };
//
//     const inner = {
//       controller: InnerController,
//       bindings: {
//         'prop2': '<'
//       }
//     };
//
//     createModule()
//       .component('outer', outer)
//       .component('inner', inner);
//
//     module('polyfill');
//
//     inject(($compile, $rootScope) => {
//       const element = $compile('<outer prop1="a"></outer>')($rootScope);
//
//       log = [];
//
//       $rootScope.$apply('a = 42');
//
//       expect(log).toEqual([
//         ['OuterController', {prop1: jasmine.objectContaining({currentValue: 42})}],
//         ['InnerController', {prop2: jasmine.objectContaining({currentValue: 84})}]
//       ]);
//     });
//   });
//
//
//   it('should throw an error if `$onChanges()` hooks are not stable', () => {
//
//     class TestController {
//       constructor() {
//         this.prop1 = 0;
//       }
//
//       $onChanges(change) {
//         this.onChange();
//       }
//     }
//
//     const polyfillComponent = {
//       controller: TestController,
//       bindings: {
//         prop: '<',
//         onChange: '&'
//       }
//     };
//
//     createModule()
//       .component('polyfillComponent', polyfillComponent);
//
//     module('polyfill');
//
//     inject(($compile, $rootScope) => {
//       const element = $compile('<c1 prop="a" on-change="a = -a"></c1>')($rootScope);
//
//       expect(() => {
//         $rootScope.$apply('a = 42');
//       }).toThrowError('$compile', 'infchng');
//
//       dealoc(element);
//
//       $compile('<c1 prop="b" on-change=""></c1>')($rootScope);
//
//       $rootScope.$apply('b = 24');
//       $rootScope.$apply('b = 48');
//     });
//   });
//
//
//   it('should log an error if `$onChanges()` hooks are not stable', () => {
//     class TestController {
//       constructor() {
//         this.prop1 = 0;
//       }
//
//       $onChanges(change) {
//         this.onChange();
//       }
//     }
//
//     const polyfillComponent = {
//       controller: TestController,
//       bindings: {
//         prop: '<',
//         onChange: '&'
//       }
//     };
//
//     createModule()
//       .component('polyfillComponent', polyfillComponent)
//       .config(($exceptionHandlerProvider) => {
//         $exceptionHandlerProvider.mode('log');
//       });
//
//     module('polyfill');
//
//     inject(($compile, $rootScope, $exceptionHandler) => {
//       $compile('<c1 prop="a" on-change="a = -a"></c1>')($rootScope);
//
//       $rootScope.$apply('a = 42');
//       expect($exceptionHandler.errors.length).toEqual(1);
//       expect($exceptionHandler.errors[0].toString()).toContain('[$compile:infchng] 10 $onChanges() iterations reached.');
//     });
//   });

});
