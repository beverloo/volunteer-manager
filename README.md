# AnimeCon Volunteer Manager
This repository contains the [AnimeCon](https://animecon.nl/) Volunteer Manager, through which the
Crew, Crew Care, Festival Host and Steward teams will be managed. The following features are
available in the current version:

  * Multi-tenant landing page referring visitors to all active events,
  * Registration portal for information backed by a CMS, allowing visitors to apply to join,
    * Once approved, volunteers can express their hotel and training preferences. When confirmed by
      a volunteering lead, they will receive real-time confirmation.
  * Administration area for managing the volunteers,
    * Several dashboards summarising the current status of an event's organisation,
    * Flexible event management for any number of in-flight events at once,
      * Automatic e-mail generation for mutations that directly impact volunteers,
      * Separated application and volunteer management systems, per team, per event,
      * Hotel booking management including support for non-volunteers and warnings,
      * Training scheduling management including support for non-volunteers and warnings,
    * Full accountability through extensive logging, including any and all outgoing messages.
    * Powerful permission management based on assigned roles and expressly granted privileges,
    * Direct integration with our friends at [Del a Rie Advies](https://delarieadvies.nl).

The Volunteer Manager has integrations with [AnPlan](https://animecon.nl/),
[Google Cloud](https://cloud.google.com) and the
[Google Vertex AI API](https://cloud.google.com/vertex-ai/docs/reference/rest) for sourcing event
information and implementing certain functionality. A MySQL (or MariaDB) database is used, for which
we use the excellent [ts-sql-query](https://ts-sql-query.readthedocs.io/en/stable/) library.

## Building and deploying

### Building a developer environment
Developing the AnimeCon Volunteer Manager follows NextJS' best practices. The following commands are
enabled and actively supported:

```
$ npm run build
$ npm run serve
```

It is recommended to run the `build` and `test` commands prior to committing a change.

The `serve` command spawns a local server that features live reload and advanced debugging
capabilities. This is the recommended environment for development. In order for this to work well,
you will need to copy [`.env.development.sample`](.env.development.sample) to `.env.development` and
fill in the details of a MySQL database, as well as various encryption passwords. Each of those
passwords needs to be at least 32 characters in length.

### Building a production environment
Deployment of the AnimeCon Volunteer Manager happens using a Docker image. One can be created by
running the following command, instructed by our [Dockerfile](Dockerfile):

```
$ npm run build-prod
```

Once the image has been created, you can run it locally through `npm run serve-prod`, providing
Docker has been installed on your system. The production environment will need a completed
`.env.production` file based on [`.env.production.sample`](.env.production.sample).

### Deploying to production
Deployment to the actual server is done through a [GitHub Action](.github/workflows/deploy.yml) that
mimics these steps remotely. This action is accessible through the GitHub user interface.

## Testing

### Jest and unit tests
We use [Jest](https://jestjs.io/) for unit tests in the project. They primarily focus on server-side
logic, as using them for client-side components is awkward at best. (Consider Playwright.) Adding
unit tests is easy and cheap, so should be the default for anything involving non-trivial logic.

```
$ npm run test
```

### Playwright end-to-end tests
We use [Playwright](https://playwright.dev/) to enable end-to-end testing of the critical user
journeys part of the Volunteer Manager. The full suite can be found in [`e2e/`](./e2e), where the
cases are grouped together based on their use case.

```
$ npm run test:e2e
```

Not everything is expected to be covered by end-to-end tests, their primary purpose is to act as a
smoke test for important user journeys that we don't manually verify frequently. An example would be
creating an account, as it's safe to assume everyone working on this project has one.
