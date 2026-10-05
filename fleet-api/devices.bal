// Business logic for GET/POST /devices and PATCH /devices/{deviceId}
// (F1.2, F1.3, F1.4). A device's id and secretHash are issued once, at
// registration, and never change again: reassignment (and
// active/inactive toggling) only ever UPDATEs bus_id / active on the same
// row. The plaintext secret is generated here and returned exactly once, in
// the registration response — only its bcrypt hash is persisted.

import ballerina/crypto;
import ballerina/http;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

type DeviceRow record {|
    string id;
    string busId;
    boolean active;
    time:Utc? lastUpdateAt;
|};

function rowToDevice(DeviceRow row) returns Device {
    string? lastUpdateAt = ();
    time:Utc? reported = row.lastUpdateAt;
    if reported is time:Utc {
        lastUpdateAt = time:utcToString(reported);
    }
    return {
        id: row.id,
        busId: row.busId,
        active: row.active,
        lastUpdateAt: lastUpdateAt
    };
}

function countDevices() returns int|error {
    record {| int count; |} result = check fleetDb->queryRow(`SELECT COUNT(*)::int AS count FROM gps_devices`);
    return result.count;
}

function fetchDevices(int 'limit, int offset) returns Device[]|error {
    stream<DeviceRow, sql:Error?> rowStream = fleetDb->query(
        `SELECT id, bus_id AS busId, active, last_update_at AS lastUpdateAt
         FROM gps_devices ORDER BY id LIMIT ${'limit} OFFSET ${offset}`
    );
    DeviceRow[] rows = check from DeviceRow row in rowStream select row;
    Device[] devices = [];
    foreach DeviceRow row in rows {
        devices.push(rowToDevice(row));
    }
    return devices;
}

function listDevicesLogic(int 'limit, int offset) returns inline_response_200_2|error {
    int total = check countDevices();
    Device[] devices = check fetchDevices('limit, offset);
    [string?, string?] links = buildPageLinks("/devices", 'limit, offset, total);
    return {
        count: total,
        next: links[0],
        previous: links[1],
        data: devices
    };
}

function findDeviceById(string deviceId) returns DeviceRow?|error {
    DeviceRow|sql:Error result = fleetDb->queryRow(
        `SELECT id, bus_id AS busId, active, last_update_at AS lastUpdateAt
         FROM gps_devices WHERE id = ${deviceId}`
    );
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function busExistsById(string busId) returns boolean|error {
    record {| int count; |} result = check fleetDb->queryRow(
        `SELECT COUNT(*)::int AS count FROM buses WHERE id = ${busId}`
    );
    return result.count > 0;
}

// A bus carries at most one GPS device (gps_devices.bus_id is UNIQUE).
// excludeDeviceId lets a reassignment check "any OTHER device" rather than
// tripping over the device's own current row.
function busHasOtherDevice(string busId, string? excludeDeviceId) returns boolean|error {
    record {| int count; |} result;
    if excludeDeviceId is string {
        result = check fleetDb->queryRow(
            `SELECT COUNT(*)::int AS count FROM gps_devices WHERE bus_id = ${busId} AND id != ${excludeDeviceId}`
        );
    } else {
        result = check fleetDb->queryRow(
            `SELECT COUNT(*)::int AS count FROM gps_devices WHERE bus_id = ${busId}`
        );
    }
    return result.count > 0;
}

function generateDeviceSecret() returns string {
    return uuid:createRandomUuid() + uuid:createRandomUuid();
}

function registerDeviceLogic(NewDevice payload) returns http:Created|ErrorBadRequest|error {
    string busId = payload.busId;
    if busId.trim().length() == 0 {
        return <ErrorBadRequest>{body: {code: 400, message: "busId is required"}};
    }
    boolean busExists = check busExistsById(busId);
    if !busExists {
        return <ErrorBadRequest>{body: {code: 400, message: "busId does not exist"}};
    }
    boolean alreadyAssigned = check busHasOtherDevice(busId, ());
    if alreadyAssigned {
        return <ErrorBadRequest>{body: {code: 400, message: "bus already has a device assigned"}};
    }

    string deviceId = uuid:createRandomUuid();
    string secret = generateDeviceSecret();
    string secretHash = check crypto:hashBcrypt(secret);

    sql:ExecutionResult _ = check fleetDb->execute(
        `INSERT INTO gps_devices (id, bus_id, secret_hash, active, last_update_at)
         VALUES (${deviceId}, ${busId}, ${secretHash}, TRUE, NULL)`
    );

    DeviceCredentials credentials = {id: deviceId, busId: busId, active: true, secret: secret};
    return <http:Created>{body: credentials};
}

function updateDeviceLogic(string deviceId, DeviceUpdate payload) returns Device|ErrorBadRequest|ErrorNotFound|error {
    DeviceRow? current = check findDeviceById(deviceId);
    if current is () {
        return <ErrorNotFound>{body: {code: 404, message: "device not found"}};
    }

    string newBusId = current.busId;
    if payload.hasKey("busId") {
        string? busIdValue = payload?.busId;
        if busIdValue is string {
            newBusId = busIdValue;
        }
    }

    boolean newActive = current.active;
    if payload.hasKey("active") {
        boolean? activeValue = payload?.active;
        if activeValue is boolean {
            newActive = activeValue;
        }
    }

    if newBusId != current.busId {
        boolean busExists = check busExistsById(newBusId);
        if !busExists {
            return <ErrorBadRequest>{body: {code: 400, message: "busId does not exist"}};
        }
        boolean alreadyAssigned = check busHasOtherDevice(newBusId, deviceId);
        if alreadyAssigned {
            return <ErrorBadRequest>{body: {code: 400, message: "bus already has a device assigned"}};
        }
    }

    sql:ExecutionResult _ = check fleetDb->execute(
        `UPDATE gps_devices SET bus_id = ${newBusId}, active = ${newActive} WHERE id = ${deviceId}`
    );

    return rowToDevice({id: deviceId, busId: newBusId, active: newActive, lastUpdateAt: current.lastUpdateAt});
}
