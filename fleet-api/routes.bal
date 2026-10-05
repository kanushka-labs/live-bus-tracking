// Business logic for GET/POST /routes and PATCH /routes/{routeId} (F1.5).
// A route is its name plus an ordered stop list; updating it REPLACES the
// whole stop list rather than merging into it, per the acceptance feature
// and the domain model. The contract's PATCH body is a NewRoute — name and
// stops are both required on every update, so there is no partial-update
// branch to write here, unlike BusUpdate/DeviceUpdate.
//
// Sequence is assigned from the request body array's own order (its index),
// not copied from whatever `sequence` value the client sent on each Stop —
// that is what "preserving sequence order from the request body's array
// order" means: the array position is authoritative, so two stops can never
// collide or gap the ordering by sending duplicate/out-of-order numbers.

import ballerina/http;
import ballerina/sql;
import ballerina/uuid;

type RouteRow record {|
    string id;
    string name;
|};

type StopRow record {|
    string name;
    decimal lat;
    decimal lng;
    int sequence;
|};

function fetchStops(string routeId) returns Stop[]|error {
    stream<StopRow, sql:Error?> rowStream = fleetDb->query(
        `SELECT name, lat, lng, sequence FROM stops WHERE route_id = ${routeId} ORDER BY sequence`
    );
    StopRow[] rows = check from StopRow row in rowStream select row;
    Stop[] stops = [];
    foreach StopRow row in rows {
        stops.push({name: row.name, sequence: row.sequence, lat: row.lat, lng: row.lng});
    }
    return stops;
}

function rowToRoute(RouteRow row) returns Route|error {
    Stop[] stops = check fetchStops(row.id);
    return {id: row.id, name: row.name, stops: stops};
}

function countRoutes() returns int|error {
    record {| int count; |} result = check fleetDb->queryRow(`SELECT COUNT(*)::int AS count FROM routes`);
    return result.count;
}

function fetchRoutes(int 'limit, int offset) returns Route[]|error {
    stream<RouteRow, sql:Error?> rowStream = fleetDb->query(
        `SELECT id, name FROM routes ORDER BY name LIMIT ${'limit} OFFSET ${offset}`
    );
    RouteRow[] rows = check from RouteRow row in rowStream select row;
    Route[] routes = [];
    foreach RouteRow row in rows {
        Route withStops = check rowToRoute(row);
        routes.push(withStops);
    }
    return routes;
}

function listRoutesLogic(int 'limit, int offset) returns inline_response_200_1|error {
    int total = check countRoutes();
    Route[] routes = check fetchRoutes('limit, offset);
    [string?, string?] links = buildPageLinks("/routes", 'limit, offset, total);
    return {
        count: total,
        next: links[0],
        previous: links[1],
        data: routes
    };
}

function findRouteById(string routeId) returns RouteRow?|error {
    RouteRow|sql:Error result = fleetDb->queryRow(
        `SELECT id, name FROM routes WHERE id = ${routeId}`
    );
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function insertStops(string routeId, Stop[] stops) returns error? {
    int sequence = 1;
    foreach Stop stop in stops {
        string stopId = uuid:createRandomUuid();
        sql:ExecutionResult _ = check fleetDb->execute(
            `INSERT INTO stops (id, route_id, name, lat, lng, sequence)
             VALUES (${stopId}, ${routeId}, ${stop.name}, ${stop.lat}, ${stop.lng}, ${sequence})`
        );
        sequence += 1;
    }
}

function createRouteLogic(NewRoute payload) returns http:Created|ErrorBadRequest|error {
    if payload.name.trim().length() == 0 {
        return <ErrorBadRequest>{body: {code: 400, message: "name is required"}};
    }
    string routeId = uuid:createRandomUuid();
    sql:ExecutionResult _ = check fleetDb->execute(
        `INSERT INTO routes (id, name) VALUES (${routeId}, ${payload.name})`
    );
    check insertStops(routeId, payload.stops);
    Stop[] stops = check fetchStops(routeId);
    Route route = {id: routeId, name: payload.name, stops: stops};
    return <http:Created>{body: route};
}

function updateRouteLogic(string routeId, NewRoute payload) returns Route|ErrorBadRequest|ErrorNotFound|error {
    if payload.name.trim().length() == 0 {
        return <ErrorBadRequest>{body: {code: 400, message: "name is required"}};
    }
    RouteRow? current = check findRouteById(routeId);
    if current is () {
        return <ErrorNotFound>{body: {code: 404, message: "route not found"}};
    }

    sql:ExecutionResult _ = check fleetDb->execute(`UPDATE routes SET name = ${payload.name} WHERE id = ${routeId}`);
    sql:ExecutionResult _ = check fleetDb->execute(`DELETE FROM stops WHERE route_id = ${routeId}`);
    check insertStops(routeId, payload.stops);

    Stop[] stops = check fetchStops(routeId);
    return {id: routeId, name: payload.name, stops: stops};
}
