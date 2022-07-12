# Nagios Read Component

A read only nagios service which generates feeds from nagios status information

## Development

This section assumes that you already have a node environment setup

### Install packages

Run `npm install`, this will install both dependencies and development dependencies (which are necessary to build)

### Running

As this is a typescript project, the source code needs to be built before the service can be ran.

#### Build

There are two options for building;

1.  `npm run build`, this will compile `src` into `dist`, the entrypoint being `dist/app.js`
2.  `npm run build:watch`, this is the same as (.1) however, it will watch for changes and automatically compile

#### Starting

To start the service, run `npm run start`

### Testing

This project uses jest for testing, all the tests are in the `__test__` directory.
To run all tests: `npm run test`

### Linting / Formatting

This project uses EsLint for linting and Prettier for formatting.

To lint the project: `npm run lint`

To format the project: `npm run fmt` or `npm run prettier`

## Production Install

### Download

[//]: #
[//]: # ' 1. You first need to download the latest release, `<Link to latest release in GitHub releases>`'
[//]: # '    1. With curl'
[//]: # '    2. With wget'
[//]: # ' 2. Unzip result'
[//]: # ' 3. Once in the directory, you need to install the project dependencies `npm install --production`'
[//]: #
[//]: # 'At this point, the project is ready to run'

## Running

### systemd (Preferred)

### Docker

### PM2
