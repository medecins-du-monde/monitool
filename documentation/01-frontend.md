# Working on the frontend code

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

## Building

Building is done with webpack.

- `npm run build` builds a production ready version
- `npm run watch` builds and watch a development version

The build system needs an upgrade:
- There is no command to use `webpack dev server`
- The project depends on `babel-polyfill`, which is deprecated
- No attention was put into splitting the build files, so the users have to download / parse over 600kB of compressed javascript on the homepage.

## Folder scaffolding

```
components                      Contains all components of the project

components/pages                Contains all components which are *NOT* reused. Each subfolder is one page in the app.
components/pages/admin-*        Components in the Admin section
components/pages/cc-indicator-* Components in the CrossCutting indicators section
components/pages/project-*      Components in the project section

components/shared               Shared components
components/shared/indicator     Components used across multiple to edit indicators (project structure)
components/shared/misc          Simple components used across all the project (icons, progress bar...)
components/shared/ng-models     Custom inputs (@see https://docs.angularjs.org/guide/forms#implementing-custom-form-controls-using-ngmodel-)
components/shared/reporting     Components shared by general-reporting and olap-reporting (csv export button, reporting field, ...)

directives                      Contains directives
directives/acl                  Remove content from the DOM when user is not allowed to see it.
directives/helpers              Inject CSS on form inputs to specific purposes
directives/validators           Custom validators (@see https://docs.angularjs.org/guide/forms#custom-validation)                      

filters                         Convenience filters used in templates
helpers                         Mostly all the code which power building the queries for reporting
models                          One class by model (static methods allow fetching from server, instances methods allow saving, deleting, ...)
translation                     Translations files for AngularJS / Angular-translate
```

## Components

### Naming

Components are defined using AngularJS components, added in 1.6.
https://docs.angularjs.org/guide/component

They are all composed of a `<componentName>.js` file which contains the code and a `<name>.html` file with the template.

The code was ported from AngularJS 1.2, which did not use components. As a consequence most of them are too large, and could use some refactoring to allow more reusing of template code.

### Folders

Each folder under `component/pages/` represents *one* page.

Each of them contain:
- The main component for this page
    - Named with the suffix of the folder: i.e. `/pages/project-reporting-general` main component is `general.(js|html)`
    - Contains the routing information for the page (by calling `ui-router` to tell which component is available at at which URL).
- All the other components which were built only for this page and are not reused.

When needed, they can import components from the `/shared` folder.

### Component dependencies (importing / exporting components)

AngularJS does not play well with modern javascript workflow, as it mandates to use its own module system which is not very useful: all dependencies are handled in a flat object.

Declaring that a component depends on another has no consequences if any other component already did the same.

https://docs.angularjs.org/guide/module

To work around that the following rules were followed:
- One module by component with a name which is unique on the whole project
- import and export only the NAMES of the component
- Declare dependencies of each component, to help keeping track (and make migration to something else possible)


```
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


### Particular states/components

A couple states/components have more reponsibilities than expected from their names.

- `main.project`
    - This component have no DOM
    - It is responsible for loading the current project and injects it into the props of components under it.

- `main.project.structure`
    - This is the menu component when the user is editing the project
    - The name is misleading: this component also contains the action bar on the bottom of the screen which allows persisting or cancelling changes on the project which is being edited
    - It keeps an unmodified copy of the project.



## Routing

The routing of the application is performed using `ui-router`.

https://ui-router.github.io/ng1/

This library allows automatically handles
- Nesting components depending on URL
- Mapping url parameters to load needed resources

Unlike other routing libraries (react-router, ...) the dots in the states name `.` have a meaning!
They tell `ui-router` how to nest the components.


```
What is it              State name                                     Component Path

# Top of the tree
Main Menu (on top)      main                                           pages/menu/menu.js
Main Home page          main.home                                      pages/home/home.js
Main project list       main.projects                                  pages/project-list/list.js

# Project
Empty component         main.project                                   pages/project-menu/menu.js
Structure edit menu     main.project.structure                         pages/project-structure-menu/menu.js
Self-explanatory        main.project.structure.basics                  pages/project-structure-basics/basics.js
Self-explanatory        main.project.structure.collection_form_list    pages/project-structure-data-source/data-source-list.js
Self-explanatory        main.project.structure.collection_form_edition pages/project-structure-data-source/data-source-edit.js
Self-explanatory        main.project.structure.collection_site_list    pages/project-structure-sites/sites.js
Self-explanatory        main.project.structure.cross_cutting           pages/project-structure-cc-indicators/cc-indicator-list.js
Self-explanatory        main.project.structure.extra                   pages/project-structure-extra-indicators/extra-indicators.js
Self-explanatory        main.project.structure.history                 pages/project-structure-history/history.js
Self-explanatory        main.project.structure.home                    pages/project-structure-home/home.js
Self-explanatory        main.project.structure.logical_frame_list      pages/project-structure-logical-frame/logframe-list.js
Self-explanatory        main.project.structure.logical_frame_edition   pages/project-structure-logical-frame/logframe-edit.js
Self-explanatory        main.project.structure.user_list               pages/project-structure-user/user-list.js

Input edit menu         main.project.input                             pages/project-input-menu/menu.js
Self-explanatory        main.project.input.home                        pages/project-input-home/home.js
Self-explanatory        main.project.input.edit                        pages/project-input-edition/input-edition.js

Reporting menu          main.project.reporting                         pages/project-reporting-menu/menu.js
Self-explanatory        main.project.reporting.general                 pages/project-reporting-general/general.js
Self-explanatory        main.project.reporting.home                    pages/project-reporting-home/home.js
Self-explanatory        main.project.reporting.olap                    pages/project-reporting-olap/olap.js

# Cross-cutting indicators
Indicator list          main.indicators                                pages/cc-indicator-list/cc-indicator-list.js
Indicator reporting     main.indicator_reporting                       pages/cc-indicator-reporting/cc-indicator-reporting.js

# Admin settings
Menu (left)             main.admin                                     pages/admin-menu/menu.js
Indicator list          main.admin.indicator_list                      pages/admin-cc-indicator/cc-indicator-list.js
Theme list              main.admin.theme_list                          pages/admin-theme/theme-list.js
User list               main.admin.users                               pages/admin-user/user-list.js
```

## Styling

The styling of the whole application is done by:
- require(`bootstrap3`)
- a single big CSS files `app.css` for everything not provided by bootstrap
- `class` referencing bootstrap and `style` attributes scattered across the codebase.

The styling system needs a good upgrade to something more systematic, and splitted by component.

## Others topics

### Login page

The login page is not part of the AngularJS application.

Because of the big bundle size of the app, it was written in plain javascript.

The code can be found in `/init.js`

### Handsontable

`handsontable` is used for Excel-like data entry.

The library is way overfill for the purpose it is being used. Alone it is responsible for 2/3 of the weight of the final bundles.

#### Unit tests

The frontend is not unit tested