describe('$onDestroy lifecycle hook', () => {

  let createModule = () => angular.module('polyfill', []);

  it('should call `$onDestroy`, if provided, on the controller when its scope is destroyed', () => {

    function TestController() {
      this.count = 0;
    }

    TestController.prototype.$onDestroy = function() {
      this.count++;
    };

    createModule()
      .component('polyfillOne', { scope: true, controller: TestController })
      .component('polyfillTwo', { scope: {}, controller: TestController })
      .component('polyfillThree', { controller: TestController });

    module('polyfill');

    inject(($compile, $rootScope) => {

      const template = `
        <div>
          <polyfill-one ng-if="show[0]"></polyfill-one>
          <polyfill-two ng-if="show[1]"></polyfill-two>

          <div ng-if="show[2]">
            <polyfill-three></polyfill-three>
          </div>
        </div>
      `;

      const element = $compile(template)($rootScope);

      $rootScope.$apply('show = [true, true, true]');

      const polyfillOneController = element.find('polyfill-one').controller('polyfillOne');
      const polyfillTwoController = element.find('polyfill-two').controller('polyfillTwo');
      const polyfillThreeController = element.find('polyfill-three').controller('polyfillThree');

      expect([polyfillOneController.count, polyfillTwoController.count, polyfillThreeController.count]).toEqual([0,0,0]);

      $rootScope.$apply('show = [false, true, true]');
      expect([polyfillOneController.count, polyfillTwoController.count, polyfillThreeController.count]).toEqual([1,0,0]);

      $rootScope.$apply('show = [false, false, true]');
      expect([polyfillOneController.count, polyfillTwoController.count, polyfillThreeController.count]).toEqual([1,1,0]);

      $rootScope.$apply('show = [false, false, false]');
      expect([polyfillOneController.count, polyfillTwoController.count, polyfillThreeController.count]).toEqual([1,1,1]);
    });
  });


  it('should call `$onDestroy` top-down (the same as `scope.$broadcast`)', () => {
    let log = [];

    class ParentController {
      constructor() {
        log.push('parent created');
      }

      $onDestroy() {
        log.push('parent destroyed');
      }
    }

    class ChildController {
      constructor() {
        log.push('child created');
      }

      $onDestroy() {
        log.push('child destroyed');
      }
    }

    class GrandChildController {
      constructor() {
        log.push('grand child created');
      }

      $onDestroy() {
        log.push('grand child destroyed');
      }
    }

    createModule()
      .component('parent', {
        scope: true,
        controller: ParentController
      })
      .component('child', {
        scope: true,
        controller: ChildController
      })
      .component('grandChild', {
        scope: true,
        controller: GrandChildController
      });

    module('polyfill');

    inject(($compile, $rootScope) => {
      const template = `
        <parent ng-if="show">
          <child>
            <grand-child></grand-child>
          </child>
        </parent>
      `;

      const element = $compile(template)($rootScope);

      $rootScope.$apply('show = true');
      expect(log).toEqual(['parent created', 'child created', 'grand child created']);

      log = [];
      $rootScope.$apply('show = false');
      expect(log).toEqual(['parent destroyed', 'child destroyed', 'grand child destroyed']);
    });
  });

});
