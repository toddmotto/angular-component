describe('$postLink lifecycle hook', () => {

  let createModule = () => angular.module('polyfill', []);

  it('should call `$postLink`, if provided, after the element has completed linking (i.e. post-link)', () => {
    let log = [];

    class Controller1 {
      constructor() {

      }

      $postLink() {
        log.push('polyfillOne view init');
      }
    }

    class Controller2 {
      constructor() {

      }

      $postLink() {
        log.push('polyfillTwo view init');
      }
    }

    const polyfillOne = {
      controller: Controller1,
      template: '<polyfill-two></polyfill-two>'
    };

    const polyfillTwo = {
      controller: Controller2,
      template: 'loaded'
    };

    createModule()
      .component('polyfillOne', polyfillOne)
      .component('polyfillTwo', polyfillTwo);

    module('polyfill');

    inject(($compile, $rootScope, polyfillOneDirective, polyfillTwoDirective) => {
      const hijackedOneLink  = polyfillOneDirective[0].link;
      const hijackedTwoLink  = polyfillTwoDirective[0].link;

      polyfillOneDirective[0].compile = () => {
        return {
          pre(scope, element) {
            log.push('polyfillOne pre: ' + element.text());

            hijackedOneLink.pre(...arguments);
          },
          post(scope, element) {
            log.push('polyfillOne post: ' + element.text());

            hijackedOneLink.post(...arguments);
          }
        }
      };

      polyfillTwoDirective[0].compile = () => {
        return {
          pre(scope, element) {
            log.push('polyfillTwo pre: ' + element.text());

            hijackedTwoLink.pre(...arguments);
          },
          post(scope, element) {
            log.push('polyfillTwo post: ' + element.text());

            hijackedTwoLink.post(...arguments);
          }
        }
      };

      $compile('<polyfill-one></polyfill-one>')($rootScope);

      expect(log).toEqual([
        'polyfillOne pre: loaded',
        'polyfillTwo pre: loaded',
        'polyfillTwo post: loaded',
        'polyfillTwo view init',
        'polyfillOne post: loaded',
        'polyfillOne view init'
      ]);
    });
  });
});
