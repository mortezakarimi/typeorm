import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ActivityEntity } from "./entity/ActivityEntity"

describe("github issues > #320 Bug in getManyAndCount", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly parse type from PrimaryGeneratedColumn options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tiles = [2, 3]

                let query = connection
                    .createQueryBuilder(ActivityEntity, "activity")
                    .innerJoinAndSelect("activity.tiles", "tile")
                    .select("activity.id")
                    .orderBy("activity.endDate", "DESC")

                query = query
                    .innerJoin(
                        "(SELECT " +
                            "COUNT(activityId) AS matchedTileCount, " +
                            "tile_activities_activity.activityId " +
                            "FROM tile " +
                            "INNER JOIN tile_activities_activity " +
                            "ON tile.id = tile_activities_activity.tileId " +
                            "WHERE tile.id IN (:...tiles) " +
                            "GROUP BY activityId)",
                        "b",
                        "b.activityId = activity.id",
                    )
                    .addSelect("b.matchedTileCount")
                    .addSelect("COUNT(activity.id) as tileCount")
                    .groupBy("activity.id, tile.id")
                    .having("b.matchedTileCount = :tileCount")
                    .orHaving("tileCount <= b.matchedTileCount")
                    .setParameter("tiles", tiles)
                    .setParameter("tileCount", tiles.length)

                await expect(query.getMany()).to.eventually.be.fulfilled
            }),
        ))
})
