// The fleet-db connection and the schema it starts with.
//
// Backs Bus, GPSDevice, Route, Stop and Position per
// specs/design/domain-model.md:
//   - one GPS device per bus, reassignable (gps_devices.bus_id is UNIQUE; a
//     reassignment UPDATEs that column on the device's own row)
//   - one route per bus at a time (buses.route_id is a nullable FK)
//   - an ordered stop list per route (stops.sequence, UNIQUE per route)
//   - one latest-position row per bus, not a history table (positions.bus_id
//     is itself the primary key, so a location update is an upsert)
//
// `offline` is NOT a stored column: the contract defines it as "true when no
// update has arrived for over 2 minutes", a value that goes stale the instant
// it is written. It is computed at read time from `reported_at` by whatever
// implements listBusPositions (issue #5), never persisted here.

import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client fleetDb = check new (
    host = fleetDbHost,
    username = fleetDbUser,
    password = fleetDbPassword,
    database = fleetDbName,
    port = resolveFleetDbPort()
);

// FLEET_DB_PORT is a platform-injected string; 5432 is Postgres's own
// conventional default, not a stand-in for a missing credential — host,
// user, password and dbname have no such universal default and are read as-is.
function resolveFleetDbPort() returns int {
    int|error parsed = int:fromString(fleetDbPort);
    if parsed is int {
        return parsed;
    }
    return 5432;
}

final () schemaReady = check initSchema();

function initSchema() returns error? {
    sql:ExecutionResult _ = check fleetDb->execute(`
        CREATE TABLE IF NOT EXISTS routes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    sql:ExecutionResult _ = check fleetDb->execute(`
        CREATE TABLE IF NOT EXISTS buses (
            id TEXT PRIMARY KEY,
            license_plate TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            route_id TEXT NULL REFERENCES routes (id) ON DELETE SET NULL
        )
    `);

    sql:ExecutionResult _ = check fleetDb->execute(`
        CREATE TABLE IF NOT EXISTS stops (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            lat DOUBLE PRECISION NOT NULL,
            lng DOUBLE PRECISION NOT NULL,
            sequence INTEGER NOT NULL,
            UNIQUE (route_id, sequence)
        )
    `);

    sql:ExecutionResult _ = check fleetDb->execute(`
        CREATE TABLE IF NOT EXISTS gps_devices (
            id TEXT PRIMARY KEY,
            bus_id TEXT NOT NULL UNIQUE REFERENCES buses (id) ON DELETE CASCADE,
            secret_hash TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            last_update_at TIMESTAMPTZ NULL
        )
    `);

    sql:ExecutionResult _ = check fleetDb->execute(`
        CREATE TABLE IF NOT EXISTS positions (
            bus_id TEXT PRIMARY KEY REFERENCES buses (id) ON DELETE CASCADE,
            lat DOUBLE PRECISION NOT NULL,
            lng DOUBLE PRECISION NOT NULL,
            reported_at TIMESTAMPTZ NOT NULL
        )
    `);

    return;
}
