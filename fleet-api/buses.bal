// Business logic for GET/POST /buses and PATCH /buses/{busId} (F1.1, F1.4,
// F1.6). A bus runs at most one route: routeId is a single nullable column
// on the bus's own row, so assigning one always REPLACES whatever was there
// — there is nothing to add to. `routeId: null` on a PATCH clears it.

import ballerina/http;
import ballerina/sql;
import ballerina/uuid;

type BusRow record {|
    string id;
    string licensePlate;
    boolean active;
    string? routeId;
|};

function rowToBus(BusRow row) returns Bus => {
    id: row.id,
    licensePlate: row.licensePlate,
    active: row.active,
    routeId: row.routeId
};

function countBuses() returns int|error {
    record {| int count; |} result = check fleetDb->queryRow(`SELECT COUNT(*)::int AS count FROM buses`);
    return result.count;
}

function fetchBuses(int 'limit, int offset) returns Bus[]|error {
    stream<BusRow, sql:Error?> rowStream = fleetDb->query(
        `SELECT id, license_plate AS licensePlate, active, route_id AS routeId
         FROM buses ORDER BY license_plate LIMIT ${'limit} OFFSET ${offset}`
    );
    BusRow[] rows = check from BusRow row in rowStream select row;
    Bus[] buses = [];
    foreach BusRow row in rows {
        buses.push(rowToBus(row));
    }
    return buses;
}

function listBusesLogic(int 'limit, int offset) returns inline_response_200|error {
    int total = check countBuses();
    Bus[] buses = check fetchBuses('limit, offset);
    [string?, string?] links = buildPageLinks("/buses", 'limit, offset, total);
    return {
        count: total,
        next: links[0],
        previous: links[1],
        data: buses
    };
}

function findBusById(string busId) returns BusRow?|error {
    BusRow|sql:Error result = fleetDb->queryRow(
        `SELECT id, license_plate AS licensePlate, active, route_id AS routeId
         FROM buses WHERE id = ${busId}`
    );
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function routeExistsById(string routeId) returns boolean|error {
    record {| int count; |} result = check fleetDb->queryRow(
        `SELECT COUNT(*)::int AS count FROM routes WHERE id = ${routeId}`
    );
    return result.count > 0;
}

function registerBusLogic(NewBus payload) returns http:Created|ErrorBadRequest|error {
    string licensePlate = payload.licensePlate;
    if licensePlate.trim().length() == 0 {
        return <ErrorBadRequest>{body: {code: 400, message: "licensePlate is required"}};
    }
    string busId = uuid:createRandomUuid();
    sql:ExecutionResult _ = check fleetDb->execute(
        `INSERT INTO buses (id, license_plate, active, route_id)
         VALUES (${busId}, ${licensePlate}, TRUE, NULL)`
    );
    Bus bus = {id: busId, licensePlate: licensePlate, active: true, routeId: ()};
    return <http:Created>{body: bus};
}

function updateBusLogic(string busId, BusUpdate payload) returns Bus|ErrorBadRequest|ErrorNotFound|error {
    BusRow? current = check findBusById(busId);
    if current is () {
        return <ErrorNotFound>{body: {code: 404, message: "bus not found"}};
    }

    boolean newActive = current.active;
    if payload.hasKey("active") {
        boolean? activeValue = payload?.active;
        if activeValue is boolean {
            newActive = activeValue;
        }
    }

    string? newRouteId = current.routeId;
    if payload.hasKey("routeId") {
        newRouteId = payload?.routeId;
        if newRouteId is string {
            boolean exists = check routeExistsById(newRouteId);
            if !exists {
                return <ErrorBadRequest>{body: {code: 400, message: "routeId does not exist"}};
            }
        }
    }

    sql:ExecutionResult _ = check fleetDb->execute(
        `UPDATE buses SET active = ${newActive}, route_id = ${newRouteId} WHERE id = ${busId}`
    );
    return {id: busId, licensePlate: current.licensePlate, active: newActive, routeId: newRouteId};
}
