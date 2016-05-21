describe('$onInit lifecycle hook', () => {

  let createModule = () => angular.module('polyfill', []);

  it('should call `$onInit`, if provided, after all the controllers on the element have been initialized', () => {

    function checkOne() {
      expect(this.element.controller('polyfillOne').id).toEqual(1);
    }

    function checkTwo() {
      expect(this.element.controller('polyfillTwo').id).toEqual(2);
    }

    function Controller1($element) {
      this.id = 1;
      this.element = $element;
    }

    Controller1.prototype.$onInit = jasmine.createSpy('$onInit').and.callFake(checkOne);

    function Controller2($element) {
      this.id = 2;
      this.element = $element;
    }

    Controller2.prototype.$onInit = jasmine.createSpy('$onInit').and.callFake(checkTwo);

    createModule()
      .component('polyfillOne', {
        controller: Controller1
      })
      .component('polyfillTwo', {
        controller: Controller2
      });

    module('polyfill');

    inject(($compile, $rootScope) => {
      $compile('<polyfill-one />')($rootScope);
      $compile('<polyfill-two />')($rootScope);
      expect(Controller1.prototype.$onInit).toHaveBeenCalled();
      expect(Controller2.prototype.$onInit).toHaveBeenCalled();
    });
  });

});
