# Working on the backend

### History

The API is a NodeJS daemon which was originally written with express.js and used CouchDB 1 as database.

Chosing CouchDB was convenient as in-situ training were made on the field, without internet access, and CouchDB allows easy replication to be used with a local server, which then could be synchronized with the production database when the training was over.

The code was later ported to ES7, Koa and CouchDB 2.0.

- Async/await syntax everywhere.
- Model validation is performed with `is-my-json-valid` and some custom code.
- User authentication is performed with `passport`, specifically for Azure Active Directory (OAuth2).
- PDF generation is enabled by `pdfmake`.
- Document versionning is performed by using `fast-json-patch` which generates RFC-6902 patches.
- The API also depends on an external npm modules to help with the reporting computation: `timeslot-dag` (created for monitool)

Originally, the NodeJS daemon was in charge of serving the gzipped static files, and used an in-memory cache to speed up request.
This allowed having to start only two services to start the complete application (NodeJS app and CouchDB).

To reduce the amount of code that need to be maintained, the static files are now served from an nginx reverse proxy.

### Building

Building is done with `babel`, but the code can be run directly with `babel-node`.

```
# Start server directly with autoreload/compilation on the fly (`babel-node` + `nodemon`)
npm run start 

# Build & start production code
npm run build
npm run serve

# Run the tests
npm run test
```

### Folder scaffolding

```
config/*                 Loader/validator for environnement variables

middlewares/
    error-handler        Middleware which catches exceptions and set status codes.
    force-authentication Check Auth Cookie, and load list of allowed projects into the context

routers/
    authentication       Routes used to authenticate (login/logout/...)
    config               Login page config (to display version, label content...)
    resources            CRUD on all resources (projets, inputs, indicators, ...)
    reporting            Route which compute reporting
    pdf                  PDF Generation routes

olap/
    cube                 All reporting computation code.
    dimension            Represents either time, a list of sites, or desagregations
    dimension-group      Represents groups of dimension items (i.e. to convert months to quarters...)

resource/
    migrations/          Database migrations
    schema/              Validations schemas for models (JSON Schema)
    model/               One class by type of model
    store/               Loaders to access to models
    database             Wrapper around CouchDB driver (nano)

passport                 Authentication related code, used by the `force-authentication` middleware
application              Koa application (imports all routers, middlewares, ...)
main-webapp              Main (connects to DB, starts Koa)
main-reporting           Subprocess. Do not run directly
```

### Models

Monitool has evolved a lot, and many things have been renamed over time to make 
the app more intuitive.

However, in the code, old names have stuck around on portions of the code which did
not need to be updated, or when this required database migrations, which are
inconvenient in NoSQL environements.

In the project model:

```
Field                                   | Human Name            | In code
----------------------------------------+-----------------------+-------------------------------------
project.entities                        | Collection Sites      | entity, site, collectionSite
project.groups                          | Collection Groups     | group
form                                    | Data Source           | form, collectionForm, ds, dataSource
form.elements                           | Variable              | element, variable, v
form.elements[*].partitions             | Disagregation         | partition, p
form.elements[*].partitions[*].elements | Disagregation element | pe, element
```

Other than that, mapping the models to the actual items displayed on screen when using
the application is trivial.

### Routers

Most routers are just simple CRUD.

Validation of permissions is performed in the controllers themselves, while all logic
in inside of the models, under `/resources/models`.

### Reporting

The main features which were needed to replace the previous Excel workflow and could
not be found in commercial tools when this project was started were:

- Logical Frameworks
- Data Entry of aggregated data taken from other sources (instead of raw data collection on the field)
- Being able to *change* the structure of the data entry, without restarting data-entry from scratch.

#### Cubes

The database contains the unitary data entries, which are stored using the CRUD api.
The model is called `input`.

Each of them contains a copy of the structure of the considered variable at the time
the data entry was performed.

This allows to be able to reshape each data entry to how the data source is looking
at a given point in the futur (disagregations can be added over time, disagregations
elements deleted etc...).

A typical `input` format is:
```json
{
  # Metadata
  "project": "project:16e04060-adc6-4a42-a18a-f516bcd57c76",
  "form": "7efc7bd1-c66e-4bc9-8e87-7ca2171e9000",
  "period": "2020-04",
  "entity": "18a8a966-8ca8-40fc-853d-ca930e31926d",
  "updatedAt": "2020-04-22T13:38:27.538Z",

  # Structure of the data source at the time of data entry
  "structure": {
    # Id of variable (at the time of data entry)
    "ffd5a6f7-5ad7-45e4-9b6f-2e2d99be8be5": [
      {
        # Id of disagregation (at the time of data entry)
        "id": "ec05550e-c9ae-4a6a-aed3-b8429d5bfb83",
        "aggregation": "sum",
        "items": [
          # ids of disagregation item
          "1604c53d-e726-4516-804d-46cbe59d6610",
          "30ab39a1-1df7-491a-9b4f-b1e83014ebdf"
        ]
      },
      {
        "id": "f009f32a-9a6a-46d8-a885-fd6694c85cba",
        "aggregation": "sum",
        "items": [
          "a14d12db-309c-4173-a621-0c82b533221f",
          "67bd31b9-0dec-45f2-a2aa-adaabf8fdae4",
          "6f5ea9eb-ab03-418a-b69d-11d15bef6cfb"
        ]
      }
    ]
  },

  # Entered data
  "values": {
    # Id of variable (at the time of data entry)
    "ffd5a6f7-5ad7-45e4-9b6f-2e2d99be8be5": [
        23424, 4234, 433, 344, 344, 333
    ]
  }
}
```

When started the api daemon forks, and start a child were all reporting is computed.

This is done to avoid locking the event loop serving requests for big projects, which can have > 500ms wait on complicated indicators.

Computing reporting is done on `/main-reporting.js`

The steps are the following:
1. Get the current structure of the variable. `@see /resource/model/variable#get structure`
2. Create a cube which can fit all data entry for this variable. `@see /olap/cube`
3. Stream all input data for this variable from the database `@see main-reporting`
    - reshape them to match the current structure. `@see resources/model/input@update()`
    - load them in the cube
4. Cache the cube (in memory)
5. Execute reporting queries against the cube

### Authentication

Two kinds of accounts can be used to log in:

- AzureAD accounts, using passport, which give read only access to all projects. Those are used by all internal MDM staff.
- Partner accounts, which give access to a single project.

The username and password hashes for the partner account password are stored in the projects documents.

#### When deploying

By default, monitool starts with the `common` endpoint for AzureAD.

This will allow all users using microsoft accounts to log-in.
It is convenient for development, but don't forget to set the environnement
variables for production deployments, as *they have default values which are very permissive*.

#### Partner password hashing

Currently, this is using https://www.npmjs.com/package/password-hash.

Those accounts can only access one project, and the password is never sent when fetching projects.
However, this should be migrated a safer `bcrypt`.


### Persistence

#### CouchDB

The choice that lead to using CouchDB may no longer be relevant today.

It's performance is sub-par with other providers (Mongo...), and difficult to query
even if that is changing in most recent versions (map-reduce).

#### Migrations

Everytime the server daemon is started it runs the `database.prepare()` fn.

This performs the following operations:
- Aquires a database lock, to make sure that multiple servers won't run migrations in parallel
- Reads the `version` document in the database
- Checks `/resources/migrations/index.js` file for new migrations
- Runs them
- Release the lock

When updating the app and needed to update the format of documents in the database, just add files to the `/resources/migrations` folder.
They should each contain a single async function, which runs the migration.

However:
- Migrations can only be played one way.
- There is no `COMMIT/ROLLBACK` in CouchDB: the migrations will be run partially if they fails
- Take care with the memory consumption of the migrations. Loading all documents in RAM, then migrating them is unlikely to work on a production cluster.

=> In production, **backup the database** before updating the containers.

#### design/docs

All queries to the database are performed using map/reduce (Monitool was developped for CouchDB 1, they was no other mean to query at the time).

A single design document, created by the migrations, is used to store all the views (`_design/monitool`).

The available queries are the following:

```
ViewName                Content                             Function
project_by_theme        Map(themeId => projectId)           Find projects for a given theme. 
cross_cutting           Map(indicatorId => projectId)       Find projects for a given cross cutting indicator
indicator_by_theme      Map(themeId => indicatorId)         Find indicators for a given theme.

partners                Map(partnerAccount => permissions)  Resolve perms of partner
projects_short          List(projects)                      Light version of projects for the homepage
inputs_variable         Data Entry by variable/site/period  Compute reports
inputs_with_progress    Data entry % of completion          Input list page
inputs_updated_at       Map(projectId => Date)              Project list page "last entry"

projects_public         List(public projects)               User together, choose which projects are ...
projects_private        Map(userId => projects)             ... shown to given users.
```

#### Foreign keys

There is no support for foreign keys in CouchDB, however when saving/deleting
items from the database, most models will try to update/delete linked models.

This is implemented in the `Model.validateForeignKeys()` and `Model.destroy()` methods of each model.
