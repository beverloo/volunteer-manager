# AnimeCon Volunteer Manager
_Description tbc_

## Building, testing and deployment

### Development environment
Developing the AnimeCon Volunteer Manager follows NextJS' best practices. The following commands are
enabled and actively supported:

```
$ npm run build
$ npm run lint
$ npm run serve
$ npm run test
```

It is recommended to run the `build`, `lint` and `test` commands prior to committing a change.

The `serve` command spawns a local server that features live reload and advanced debugging
capabilities. This is the recommended environment for development. In order for this to work well,
you will need to copy [`.env.development.sample`](.env.development.sample) to `.env.development` and
fill in the details of a MySQL database, as well as various encryption passwords. Each of those
passwords needs to be at least 32 characters in length.

### Production environment
Deployment of the AnimeCon Volunteer Manager happens using a Docker image. One can be created by
running the following command, instructed by our [Dockerfile](Dockerfile):

```
$ npm run build-prod
```

Once the image has been created, you can run it locally through `npm run serve-prod`, providing
Docker has been installed on your system. The production environment will need a completed
`.env.production` file based on [`.env.production.sample`](.env.production.sample).

Deployment to the actual server is done through a [GitHub Action](.github/workflows/deploy.yml) that
mimics these steps remotely. This action is accessible through the GitHub user interface as well, at
least for people with the necessary permissions.
