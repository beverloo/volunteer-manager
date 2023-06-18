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
capabilities. This is the recommended environment for development.

### Production environment
Deployment of the AnimeCon Volunteer Manager happens using a Docker image. One can be created by
running the following command, instructed by our [Dockerfile](Dockerfile):

```
$ npm run build-prod
```

Once the image has been created, you can run it locally through `npm run serve-prod`, or directly
push it to production by using `npm run deploy-prod`. An external MySQL server for data storage
will continue to be required in both of these scenarios, configuration for which can be obtained
from the project maintainers if required.
