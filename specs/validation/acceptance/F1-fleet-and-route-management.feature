Feature: F1 Fleet & route management

  @story-F1.1
  Rule: A fleet admin registers a bus

    Scenario: Registering a new bus
      Given no bus with license plate "ABC-123" is registered
      When Priya the fleet admin registers a bus with license plate "ABC-123"
      Then "ABC-123" appears in the list of registered buses

  @story-F1.2
  Rule: A fleet admin registers a GPS device, which is issued its own credentials

    Scenario: Registering a device and assigning it to a bus
      Given a bus with license plate "ABC-123" is registered
      When Priya the fleet admin registers a GPS device and assigns it to "ABC-123"
      Then the device is issued an ID and a secret
      And the device appears assigned to "ABC-123"

  @story-F1.3
  Rule: A fleet admin reassigns a GPS device to a different bus

    Scenario: Moving a device between buses
      Given a GPS device "DEV-01" is assigned to bus "ABC-123"
      And a bus with license plate "XYZ-789" is registered
      When Priya the fleet admin reassigns "DEV-01" to "XYZ-789"
      Then "DEV-01" appears assigned to "XYZ-789"
      And "DEV-01" no longer appears assigned to "ABC-123"

  @story-F1.4
  Rule: A fleet admin marks a bus or a GPS device active or inactive

    Scenario: Deactivating a bus
      Given a bus with license plate "ABC-123" is registered and active
      When Priya the fleet admin marks "ABC-123" inactive
      Then "ABC-123" appears inactive in the list of registered buses

    Scenario: Deactivating a GPS device
      Given a GPS device "DEV-01" is registered and active
      When Priya the fleet admin marks "DEV-01" inactive
      Then "DEV-01" appears inactive in the list of registered devices

  @story-F1.5
  Rule: A fleet admin defines a route as an ordered sequence of named, located stops

    Scenario: Defining a route with its stops in order
      When Priya the fleet admin defines route "Route 4" with stops "Main St & 1st", "Main St & 5th", "Central Station" in that order
      Then "Route 4" appears with its 3 stops in that order

  @story-F1.6
  Rule: A fleet admin assigns a bus to a route, and that assignment can change

    Scenario: Assigning a bus to a route
      Given a bus with license plate "ABC-123" is registered
      And a route "Route 4" is defined
      When Priya the fleet admin assigns "ABC-123" to "Route 4"
      Then "ABC-123" appears assigned to "Route 4"

    Scenario: Reassigning a bus to a different route replaces the previous assignment
      Given a bus with license plate "ABC-123" is assigned to route "Route 4"
      And a route "Route 2" is defined
      When Priya the fleet admin assigns "ABC-123" to "Route 2"
      Then "ABC-123" appears assigned to "Route 2"
      And "ABC-123" no longer appears assigned to "Route 4"
