Feature: F2 Live location ingestion

  @story-F2.1
  Rule: A GPS device submits its bus's current position and the time it was taken, authenticated with its own ID and secret

    Scenario: A valid device reports a position
      Given a GPS device "DEV-01" is registered, active, and assigned to bus "ABC-123"
      When "DEV-01" submits its ID, secret, position "40.0,-75.0" and the current time
      Then "ABC-123" shows that position as its current position

  @story-F2.2 @negative
  Rule: An update from an unrecognized or inactive device ID is rejected with a visible error

    Scenario: An unrecognized device ID is rejected
      Given no GPS device with ID "DEV-99" is registered
      When a submission arrives with device ID "DEV-99", a secret, a position and a time
      Then the submission is rejected with an error
      And no bus's current position changes

    Scenario: An inactive device's update is rejected
      Given a GPS device "DEV-01" is registered, marked inactive, and assigned to bus "ABC-123"
      When "DEV-01" submits its ID, secret, position "40.0,-75.0" and the current time
      Then the submission is rejected with an error
      And "ABC-123"'s current position is unchanged

  @story-F2.1 @story-F2.2
  Rule: A bus is marked offline when no location update has arrived for more than 2 minutes

    Scenario: A bus with no recent update shows as offline
      Given bus "ABC-123" last reported a position 3 minutes ago
      When Dana the dispatcher views the fleet
      Then "ABC-123" shows as offline at its last known position
