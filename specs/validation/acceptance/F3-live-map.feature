Feature: F3 Live map

  @story-F3.1
  Rule: A rider sees every bus on a live map, with its current position and route

    Scenario: A rider views the live map
      Given bus "ABC-123" is on route "Route 4" reporting position "40.0,-75.0"
      When Riya the rider opens the live map
      Then "ABC-123" appears on the map at "40.0,-75.0" running "Route 4"

  @story-F3.2
  Rule: A dispatcher sees every bus on the fleet, with device ID and last-update time in addition to position and route

    Scenario: A dispatcher views the fleet map
      Given bus "ABC-123" is on route "Route 4", reporting position "40.0,-75.0" through device "DEV-01"
      When Dana the dispatcher opens the fleet map
      Then "ABC-123" appears on the map at "40.0,-75.0" running "Route 4"
      And "ABC-123" shows device "DEV-01" and its last-update time

  @story-F3.1 @story-F3.2
  Rule: An offline bus stays on the map, marked offline, at its last known position

    Scenario: Riya sees an offline bus rather than a vanished one
      Given bus "ABC-123" last reported position "40.0,-75.0" 3 minutes ago
      When Riya the rider opens the live map
      Then "ABC-123" appears on the map at "40.0,-75.0" marked offline

    Scenario: Dana sees an offline bus rather than a vanished one
      Given bus "ABC-123" last reported position "40.0,-75.0" 3 minutes ago
      When Dana the dispatcher opens the fleet map
      Then "ABC-123" appears on the map at "40.0,-75.0" marked offline
