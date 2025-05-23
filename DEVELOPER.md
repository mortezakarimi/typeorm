# Building and Testing TypeORM

This document describes how to set up your development environment and run TypeORM test cases.

* [Prerequisite Software](#prerequisite-software)
* [Getting the Sources](#getting-the-sources)
* [Installing NPM Modules](#installing-npm-modules)
* [Building](#building)
* [Running Tests Locally](#running-tests-locally)

See the [contribution guidelines](https://github.com/typeorm/typeorm/blob/master/CONTRIBUTING.md)
if you'd like to contribute to TypeORM.

## Prerequisite Software

Before you can build and test TypeORM, you must install and configure the
following products on your development machine:

* [Git](http://git-scm.com) and/or the **GitHub app** (for [Mac](http://mac.github.com) or
  [Windows](http://windows.github.com)); [GitHub's Guide to Installing
  Git](https://help.github.com/articles/set-up-git) is a good source of information.
* [Node.js](http://nodejs.org), (better to install latest version) which is used to run a development web server,
  run tests, and generate distributable files.
  Depending on your system, you can install Node either from source or as a pre-packaged bundle.
* [Mysql](https://www.mysql.com/) is required to run tests on this platform (or docker)
* [MariaDB](https://mariadb.com/) is required to run tests on this platform (or docker)
* [Postgres](https://www.postgresql.org/) is required to run tests on this platform (or docker)
* [Oracle](https://www.oracle.com/database/index.html) is required to run tests on this platform
* [Microsoft SQL Server](https://www.microsoft.com/en-us/cloud-platform/sql-server) is required to run tests on this platform
* For MySQL, MariaDB and Postgres you can use [docker](https://www.docker.com/) instead (docker configuration is
 [here](https://github.com/typeorm/typeorm/blob/master/docker-compose.yml))

## Getting the Sources

Fork and clone the repository:

1. Login to your GitHub account or create one by following the instructions given [here](https://github.com/signup/free).
2. [Fork](http://help.github.com/forking) the [main TypeORM repository](https://github.com/typeorm/typeorm).
3. Clone your fork of the TypeORM repository and define an `upstream` remote pointing back to
   the TypeORM repository that you forked in the first place.

```shell
# Clone your GitHub repository:
git clone git@github.com:<github username>/typeorm.git

# Go to the TypeORM directory:
cd typeorm

# Add the main TypeORM repository as an upstream remote to your repository:
git remote add upstream https://github.com/typeorm/typeorm.git
```

## Installing NPM Modules

Install all TypeORM dependencies by running this command:

```shell
npm install
```

## ORM config

To create an initial `ormconfig.json` file, run the following command:

```shell
cp ormconfig.sample.json ormconfig.json
```

## Building

To build a distribution package of TypeORM run:

```shell
npm run package
```

This command will generate a distribution package in the `build/package` directory.
You can link (or simply copy/paste) this directory into your project and test TypeORM there
(but make sure to keep all node_modules required by TypeORM).

To build the distribution package of TypeORM packed into a `.tgz`, run:

```shell
npm run pack
```

This command will generate a distribution package tar in the `build` directory (`build/typeorm-x.x.x.tgz`).
You can copy this tar into your project and run `npm install ./typeorm-x.x.x.tgz` to bundle your build of TypeORM in your project.

## Running Tests Locally

It is greatly appreciated if PRs that change code come with appropriate tests. 

To create a new test, check the [relevant functional tests](https://github.com/typeorm/typeorm/tree/master/test/functional). Depending on the test, you may need to create a new test file or modify an existing one.

If the test is for a specific regression or issue opened on GitHub, add a comment to the tests mentioning the issue number.

Most tests will benefit from using this template as a starting point:

```ts
import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai";

describe("description of the functionality you're testing", () => {

    let dataSources: DataSource[];
    before(async () => dataSources = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(dataSources));
    after(() => closeTestingConnections(dataSources));

    // optional: test fix for issue https://github.com/typeorm/typeorm/issues/<issue-number>
    it("should <put a detailed description of what it should do here>", () => Promise.all(dataSources.map(async dataSource => {
       // tests go here
    })));

// you can add additional tests if needed
});
```

If you place entities in `./entity/<entity-name>.ts` relative to your test file,
they will automatically be loaded.

To run the tests, setup your environment configuration by copying `ormconfig.sample.json` into `ormconfig.json` and replacing parameters with your own. The tests will be run for each database that is defined in that file. If you're working on something that's not database specific and you want to speed things up, you can pick which objects in the file make sense for you to keep.

Run the tests as follows:

```shell
npm test
```

You should make sure the test suites pass before submitting a PR to GitHub. Tests are run on PRs via GitHub Actions after approval, but your fork repository should be able to run CI as well. All tests need to pass before a PR will be merged.

**Executing only some tests**: When you are creating tests to some specific code, you may want to only execute the tests that you're creating.

To do this, you can temporarily modify your test definitions by adding [`.only` _mocha_ commands](https://mochajs.org/#exclusive-tests) to `describe` and `it`. For example:

```
describe.only('your describe test', ....)
```

Alternatively, you can use the `--grep` flag to pass a regex to `mocha`. Only the tests that have `describe`/`it` statements that match the regex will be run. For example:

```shell
npm run test -- --grep "your test name"
```

### Faster developer cycle for editing code and running tests

The `npm run test` script works by deleting built TypeScript code, rebuilding the codebase, and then running tests. This can take a long time.

Instead, for a quicker feedback cycle, you can run `npm run compile -- --watch` to make a fresh build and instruct TypeScript to watch for changes and only compile what code you've changed.

Once TypeScript finishes compiling your changes, you can run `npm run test:fast` (instead of `test`), to trigger a test without causing a full recompile, which allows you to edit and check your changes much faster.

## Using Docker

To run your tests you need the Database Management Systems (DBMS) installed on your machine. Alternatively, you can use docker with the DBMS running in containers. To have docker run all the DBMS for you simply run `docker-compose up`
in the root of the project. Once all images are fetched and are running, you can run the tests.

- The docker image of mssql-server needs at least 3.25GB of RAM.
- Make sure to assign enough memory to the Docker VM if you're running on Docker for Mac or Windows
