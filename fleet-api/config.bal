// Every platform-injected environment variable this service reads, in one
// place. Names are copied verbatim from design.json's `envBindings` — never
// renamed, never invented.

import ballerina/os;

// fleet-db (platform-resource, postgres-cnpg)
configurable string fleetDbHost = os:getEnv("FLEET_DB_HOST");
configurable string fleetDbPort = os:getEnv("FLEET_DB_PORT");
configurable string fleetDbUser = os:getEnv("FLEET_DB_USER");
configurable string fleetDbPassword = os:getEnv("FLEET_DB_PASSWORD");
configurable string fleetDbName = os:getEnv("FLEET_DB_DBNAME");

// user-auth (platform-resource, thunder-app) is not read here: the gateway
// terminates authentication and verifies tokens against it. This service
// verifies only the gateway's own signed assertion — see gateway_assertion.bal
// and its GATEWAY_ASSERTION_CERTIFICATE / _ISSUER / _HEADER trio.
