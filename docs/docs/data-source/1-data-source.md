# DataSource

## What is a DataSource?

Your interaction with the database is only possible once you setup a `DataSource`.
TypeORM's `DataSource` holds your database connection settings and
establishes the initial database connection or connection pool depending on the RDBMS you use.

To establish the initial connection/connection pool, you must call the `initialize` method of your `DataSource` instance.

Disconnection (closing all connections in the pool) occurs when the `destroy` method is called.

Generally, you call the `initialize` method of the `DataSource` instance on the application bootstrap,
and `destroy` it after you finished working with the database.
In practice, if you are building a backend for your site and your backend server always stays running -
you never `destroy` a DataSource.

## Creating a new DataSource

To create a new `DataSource` instance you must initialize its constructor by calling `new DataSource`
and assigning to a global variable that you'll use across your application:

```typescript
import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
})

try {
    await AppDataSource.initialize()
    console.log("Data Source has been initialized!")
} catch (error) {
    console.error("Error during Data Source initialization", error)
}
```

It's a good idea to make `AppDataSource` globally available by `export`-ing it since you'll use this instance across your application.

`DataSource` accepts `DataSourceOptions` and those options vary depending on the database `type` you use.
For different database types, there are different options you can specify.

You can define as many data sources as you need in your application, for example:

```typescript
import { DataSource } from "typeorm"

const MysqlDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [
        // ....
    ],
})

const PostgresDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    entities: [
        // ....
    ],
})
```

## How to use DataSource?

Once you set your `DataSource`, you can use it anywhere in your app, for example:

```typescript
import { AppDataSource } from "./app-data-source"
import { User } from "../entity/User"

export class UserController {
    @Get("/users")
    getAll() {
        return AppDataSource.manager.find(User)
    }
}
```

Using the `DataSource` instance you can execute database operations with your entities,
particularly using `.manager` and `.getRepository()` properties.
For more information about them see [Entity Manager](../working-with-entity-manager/1-working-with-entity-manager.md) and [Repository](../working-with-entity-manager/2-working-with-repository.md) documentation.
