# Working on the frontend code

### History

The whole frontend application is a single page application made with AngularJS.
It is built and served by an nginx reverse proxy.

The main dependencies are:

- `bootstrap-css` for all the templating
- `ui-bootstrap` for modals, datepickers, dropdowns...
- `handsontable` for Excel-like data entry
- `c3` for graphs.
- `axios` for API queries
- `ui-router` for routing.

Monitool was originally written in AngularJS 1.2 using `gulp` tasks for packing and `bower` for dependencies.

The project currently uses the last AngularJS version (1.7), and was refactored to be component based.

It was then updated to use `yarn`, ES7, compiling with webpack and BabelJS.
Assets are compressed with brotli and gzip at compile time.

To ease a possible future transition out of AngularJS, the following conditions were respected:

- All component bindings are 'one-way' (`<` or `&`): the project could be migrated to a framework that does not support 2-way data bindings (React, Vue, ...).
- ES6 imports are used everywhere where possible, instead of AngularJS dependency injection.
- Exactly one component by angular module.
- No longer use AngularJS services, factories, $http, $resource, ...

However, AngularJS will still be "maintained" until July 2021.

Because of cost/benefit, porting the whole frontend to a more recent framework was not considered worth the effort over other priorities.

### Building

Building is done with webpack.

- `npm run build` builds a production ready version
- `npm run watch` builds and watch a development version

The build system needs an upgrade:
- There is no command to use `webpack dev server`
- The project depends on `babel-polyfill`, which is deprecated
- No attention was put into splitting the build files, so the users have to download / parse over 600kB of compressed javascript on the homepage.

### Folder scaffolding

```
components/             All components of the project
    pages/              All components which are *NOT* reused. Each subfolder is one page in the app.
        admin-*         Components in the Admin section
        cc-indicator-*  Components in the CrossCutting indicators section
        project-*       Components in the project section

    shared/             Shared components
        indicator       Components used across multiple to edit indicators (project structure)
        misc            Simple components used across all the project (icons, progress bar...)
        ng-models       Custom inputs (@see https://docs.angularjs.org/guide/forms#implementing-custom-form-controls-using-ngmodel-)
        reporting       Components shared by general-reporting and olap-reporting (csv export button, reporting field, ...)

directives/             Contains directives
    acl/                Remove content from the DOM when user is not allowed to see it.
    helpers/            Inject CSS on form inputs to specific purposes
    validators/         Custom validators (@see https://docs.angularjs.org/guide/forms#custom-validation)                      

filters/                Convenience filters used in templates
helpers/                Mostly all the code which power building the queries for reporting
models/                 One class by model (static methods allow fetching from server, instances methods allow saving, deleting, ...)
translation/            Translations files for AngularJS / Angular-translate
```

### Components

#### Naming

Components are defined using AngularJS components, added in 1.6.
https://docs.angularjs.org/guide/component

They are all composed of a `<componentName>.js` file which contains the code and a `<name>.html` file with the template.

The code was ported from AngularJS 1.2, which did not use components. As a consequence most of them are too large, and could use some refactoring to allow more reusing of template code.

#### Folders

Each folder under `component/pages/` represents *one* page.

Each of them contain:
- The main component for this page
    - Named with the suffix of the folder: i.e. `/pages/project-reporting-general` main component is `general.(js|html)`
    - Contains the routing information for the page (by calling `ui-router` to tell which component is available at at which URL).
- All the other components which were built only for this page and are not reused.

When needed, they can import components from the `/shared` folder.

#### Importing / exporting components

AngularJS does not play well with modern javascript workflow, as it mandates to use its own module system which is not very useful: all dependencies are handled in a flat object.

Declaring that a component depends on another has no consequences if any other component already did the same.

https://docs.angularjs.org/guide/module

To work around that the following rules were followed:
- One module by component with a name which is unique on the whole project
- import and export only the NAMES of the component
- Declare dependencies of each component, to help keeping track (and make migration to something else possible)


```javascript
import componentName1 from '../../shared/some-component';
import componentName2 from '../../shared/some-other-component';

const module = angular.module('unique-module-name', [
    componentName1, // we import component NAMES
    componentName2
]);

// declare the component
module.component('unique-component-name', ...);

// export the NAME of the module, and NOT the module itself.
export default module.name;
```

Code Smells:
- As there is no easy way to keep track if their are missing dependencies (no error is raised), some components may not declare all of their dependencies.
- The component names do not always match the filename, which is inconvenient when coding.
- Some external dependencies do not use the same system to work around AngularJS limitations, so the dependency strings were simply hardcoded (@see [ng-sortable](https://github.com/medecins-du-monde/monitool/blob/93bce65797302e4105096bbc22a36adbd47a4fb2/frontend/src/components/pages/project-structure-extra-indicators/extra-indicators.js#L31))


#### Controller classes

Component controller classes are used on the whole project instead of function controller, which are the default on AngularJS (and are all over the official documentation of the framework).

Those are more readable for devs used to more modern frameworks.

- https://www.michaelbromley.co.uk/blog/exploring-es6-classes-in-angularjs-1.x/
- https://www.codelord.net/2017/05/20/converting-angular-controllers-to-es6-classes/

The available lifecycles events are:
- $onInit()
- $onChanges(changesObj)
- $doCheck()
- $onDestroy()
- $postLink()

@see https://docs.angularjs.org/guide/component about those.


### Routing

The routing of the application is performed using `ui-router`.

https://ui-router.github.io/ng1/

This library allows automatically handles
- Nesting components depending on URL
- Mapping url parameters to load needed resources

Unlike other routing libraries (react-router, ...) the dots in the states name `.` have a meaning!

They tell `ui-router` how to nest the components.


```
State path                                     Component Path

main                            Main Menu (on top)      pages/menu/menu.js
  .home                         Main Home page          pages/home/home.js

  # Projects
  .projects                     Main project list       pages/project-list/list.js
  .project                      Empty component         pages/project-menu/menu.js
    .structure                  Structure edit menu     pages/project-structure-menu/menu.js
      .basics                   Self-explanatory        pages/project-structure-basics/basics.js
      .collection_form_list     Self-explanatory        pages/project-structure-data-source/data-source-list.js
      .collection_form_edition  Self-explanatory        pages/project-structure-data-source/data-source-edit.js
      .collection_site_list     Self-explanatory        pages/project-structure-sites/sites.js
      .cross_cutting            Self-explanatory        pages/project-structure-cc-indicators/cc-indicator-list.js
      .extra                    Self-explanatory        pages/project-structure-extra-indicators/extra-indicators.js
      .history                  Self-explanatory        pages/project-structure-history/history.js
      .home                     Self-explanatory        pages/project-structure-home/home.js
      .logical_frame_list       Self-explanatory        pages/project-structure-logical-frame/logframe-list.js
      .logical_frame_edition    Self-explanatory        pages/project-structure-logical-frame/logframe-edit.js
      .user_list                Self-explanatory        pages/project-structure-user/user-list.js
    .input                      Input edit menu         pages/project-input-menu/menu.js
      .home                     Self-explanatory        pages/project-input-home/home.js
      .edit                     Self-explanatory        pages/project-input-edition/input-edition.js
    .reporting                  Reporting menu          pages/project-reporting-menu/menu.js
      .general                  Self-explanatory        pages/project-reporting-general/general.js
      .home                     Self-explanatory        pages/project-reporting-home/home.js
      .olap                     Self-explanatory        pages/project-reporting-olap/olap.js

  # Cross-cutting indicators
  .indicators                   Indicator list          pages/cc-indicator-list/cc-indicator-list.js
  .indicator_reporting          Indicator reporting     pages/cc-indicator-reporting/cc-indicator-reporting.js

  # Admin settings
  .admin                        Menu (left)             pages/admin-menu/menu.js
    .indicator_list             Indicator list          pages/admin-cc-indicator/cc-indicator-list.js
    .theme_list                 Theme list              pages/admin-theme/theme-list.js
    .users                      User list               pages/admin-user/user-list.js
```


A typical component which needs routing (directly accessible from an url) would look like this:

```javascript
const module = angular.module('unique-module-name', []);

module.config($stateProvider => {

    $stateProvider.state('main.substate.subsubstate', {
        abstract: true, // true == it is a menu, false == it is a page
        url: '/projects/:projectId/subpage/something',
        component: 'unique-component-name',
        resolve: {
            // Load project from $stateParams
            project: $stateParams => Project.get($stateParams.projectId),

            // Load all indicators and themes
            ccIndicators: () => Indicator.fetchAll(),
            themes: () => Theme.fetchAll()
        }
    });
});

// declare the component
module.component('unique-component-name', ...);

// export the NAME of the module, and NOT the module itself.
export default module.name;
```

### Styling

The styling of the whole application is done by:
- require(`bootstrap3`)
- a single big CSS files `app.css` for everything not provided by bootstrap
- `class` referencing bootstrap and `style` attributes scattered across the codebase.

The styling system needs a good upgrade to something more systematic, and splitted by component, and possibly with better tooling.


### About the more modern fork of the project

A public version of the tool was made during covid lockdown, by removing all MDM specific features, and adding new ones.

Code can be pulled from there to gain time while updating this one.

#### Dependencies

All dependencies besides AngularJS, font awesome and bootstrap were updated to their latest versions on the fork.

AngularJS, font awesome and bootstrap were updated to the latest version within the major version which was used.

The only problems were:
- **SortableJS introduced a breaking change on 1.10: semantic versionning is broken for that package**: we're sticking with ~1.9.0.
- uuid introducted breaking changes on the way to import the library. It can find solved with `grep` in < 3 minutes
- Replace @bower_components/font-awesome by "font-awesome": "^4.7.0"
- Some dev dependencies are deprecated
    - Replace babel-polyfill with core-js:3 and reconfigure webpack
    - Replace zopfli-webpack-plugin with @gfx/zopfli
    - Brotli is supported by modern node. Remove 'brotli-webpack-plugin'

All the rest can go to their latest version.

#### About component structure

Naming modules/components to avoid naming collisions is a problem in AngularJS as the module system 
is from another age.

To work around that, macros were using in webpack configuration:

```javascript
/** webpack.config.js */
new webpack.DefinePlugin({
    // 'components.pages.project-structure-basics.project-basics'
    __moduleName: webpack.DefinePlugin.runtimeValue(...),

    // './project-basics.html'
    __templatePath: webpack.DefinePlugin.runtimeValue(...),

    // './project-basics.scss'
    __scssPath: webpack.DefinePlugin.runtimeValue(...),,

    // 'projectBasics'
    __componentName: webpack.DefinePlugin.runtimeValue(...),
}),
```

This allow to
- Avoid all naming collisions
- Split the CSS by component
- Keep the code free of identifiers

```javascript
/** Typical component */
import angular from 'angular';
require(__scssPath); // Import styles of this component alone

const module = angular.module(__moduleName, []);

module.config($stateProvider => {
    $stateProvider.state('project.config.basics', {
        url: '/basics',
        component: __componentName // component named after the filename
    });
});

module.component(__componentName, { // component is named after the filename
    bindings: {},
    template: require(__templatePath), // import template
    controller: class { // anonymous class
    }
}
```

Then in the scss file of the component:
```scss
@use '../../theme';

my-component-name {

    .something {
        display: flex;
        color: $titleColor;
    }

    .something-else {
        @include some-rules;
    }
}
```

#### Keeping track of translations

A small script was written to keep track of translations which are no longer used + those which are missing.

#### Authentication

All authentication code was removed from the code. Auth0 is used instead

### Others topics

#### Login page

The login page is not part of the AngularJS application.

Because of the big bundle size of the app, it was written in plain javascript. The code can be found in `/init.js`

#### Handsontable

`handsontable` is used for Excel-like data entry.

The library is way overkill for the purpose it is being used. Alone it is responsible for 2/3 of the weight of the final bundles.

#### Minification

Minifying code in AngularJS breaks the build, because the framework parses function prototypes to power [Dependency Injection](https://docs.angularjs.org/guide/di).

In order to enable minification, it is necessary to decorate all constructors and functions manually or use a babel plugin. [babel-plugin-angularjs-annotate](https://www.npmjs.com/package/babel-plugin-angularjs-annotate) is used on monitool. 

If updated, new versions of the plugin require class controllers to be manually flagged to enable transformation. This was not done

Example:
```javascript
module.component('some-component', {
    bindings: { ... },
    template: require(...),

    // anonymous classes are OK as controllers
    controller: class {
        constructor($state) {
            'ngInject';  // <-- Add this on recent versions of angularjs-annotate

            this.$state = $state;
        }
    }
});
```

#### Particular states/components

A couple states/components have more reponsibilities than expected from their names.

- `main.project`
    - This component have no DOM
    - It is responsible for loading the current project and injects it into the props of components under it.

- `main.project.structure`
    - This is the menu component when the user is editing the project
    - The name is misleading: this component also contains the action bar on the bottom of the screen which allows persisting or cancelling changes on the project which is being edited
    - It keeps an unmodified copy of the project.

##### Unit tests

The frontend is not unit tested
