# Vehicle Maintenance Scheduler

Hey there! Welcome to the Vehicle Maintenance Scheduler. This is a backend system designed to help you keep track of vehicle maintenance tasks. It's written entirely in JavaScript and includes a handy logging middleware that hooks right into an evaluation service API.

## What is this project all about?

Keeping track of vehicle maintenance can be a headache, so we built this to make it easier. Here's what it handles:
- **Vehicle Registration**: Add and manage all your vehicles in one place.
- **Maintenance Task Management**: Set up custom maintenance routines based on time or mileage.
- **Service Logging**: Keep a detailed history of services, including how much you spent and what mileage the vehicle was at.
- **Alert Generation**: Get automated alerts when maintenance is due or overdue.
- **Dashboard Metrics**: View real-time stats and cost breakdowns.
- **Centralized Logging**: Everything the system does is logged and sent to an evaluation service for easy monitoring.

## How is it built?

Here's a quick look at the project structure:

```
vehicle_maintenance_scheduler/
├── logging_middleware/
│   └── Log.js                 # Our custom logging tool
├── vehicle_maintenance_scheduler/
│   ├── models/
│   │   ├── Domain.js          # Core data models
│   │   ├── Repository.js      # Handles data saving and fetching
│   │   └── Service.js         # The brains behind the business logic
│   ├── handlers/
│   │   └── Controller.js      # Processes incoming HTTP requests
│   └── routes/
│       └── Routes.js          # Defines all our API endpoints
└── notification_system_design.md
```

## The Main Pieces

### 1. Logging Middleware (`Log.js`)

This is a reusable function we use to log events across the application. It makes sure our logs are formatted correctly before sending them off to the API.

**How it looks:**
```javascript
async function Log(stack, level, package_, message) { 
  // Validation and API integration happens here
}
```

**What you need to pass in:**
- `stack`: Where is this coming from? Usually "backend" or "frontend".
- `level`: How serious is this? Pick from "debug", "info", "warn", "error", or "fatal".
- `package`: Which part of the app is logging this? For example: "controller", "db", "service", etc.
- `message`: What actually happened?

We send these logs directly to: `http://20.207.122.201/evaluation-service/logs`

### 2. Domain Models (`Domain.js`)

This is where we define the shape of our data. You'll find definitions for things like:
- **Vehicle**: Keeps track of the vehicle's details and current mileage.
- **MaintenanceTask**: The blueprint for a maintenance job and when it should happen.
- **MaintenanceRecord**: A log of a completed service.
- **MaintenanceAlert**: Notifications for upcoming or overdue tasks.
- **MaintenanceMetrics**: Data we use to power the dashboard.

### 3. Repository Layer (`Repository.js`)

This layer is strictly in charge of talking to our database. It handles creating, reading, updating, and deleting records for vehicles, tasks, alerts, and more.

**A quick example of adding a vehicle:**
```javascript
const vehicle = await VehicleRepository.createVehicle({
  id: "VEH-123",
  ownerId: "owner-1",
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  licensePlate: "ABC-1234",
  mileage: 45000,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 4. Service Layer (`Service.js`)

This is where the actual logic lives. If you need to register a vehicle, calculate when the next oil change is due, or figure out dashboard metrics, this is the place.

**Logging a service:**
```javascript
const { record, alertUpdated } = await MaintenanceService.logMaintenanceService({
  vehicleId: "VEH-123",
  taskId: "TSK-1",
  mileage: 50000,
  cost: 500,
  servicedBy: "AutoCare Center",
  notes: "Changed the oil and swapped the filter."
});
```

### 5. Controller Layer (`Controller.js`)

Controllers handle incoming web requests. They make sure the data looks right, deal with any errors that pop up, and send a clean JSON response back to the user.

**Catching bad data:**
```javascript
if (typeof year !== "number" || year < 1900) {
  await Log("backend", "error", "controller", 
    `Oops, the year needs to be a number from 1900 or later. We got a ${typeof year} instead.`);
  return {
    status: 400,
    body: { error: "Year must be a number >= 1900" }
  };
}
```

### 6. Routes (`Routes.js`)

These are the actual URLs you can hit in our API. For example:
- `POST /api/vehicles/register` - Adds a new vehicle
- `POST /api/vehicles/:vehicleId/tasks` - Sets up a new maintenance task
- `POST /api/vehicles/:vehicleId/service` - Logs a completed service
- `GET /api/vehicles/:vehicleId/alerts` - Fetches alerts for a specific vehicle
- `GET /api/metrics/:ownerId` - Grabs all the stats for a user

## How to use it

### Registering a Vehicle

```javascript
const result = await MaintenanceController.registerVehicle({
  body: {
    ownerId: "owner-123",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    licensePlate: "ABC-1234",
    currentMileage: 45000
  }
});
```

### Checking Dashboard Metrics

```javascript
const result = await MaintenanceController.getMetrics("owner-123");

// You'll get back something like this:
// {
//   totalVehicles: 3,
//   totalMaintenanceTasks: 12,
//   overdueMaintenance: 2,
//   upcomingMaintenance: 5,
//   totalSpentThisMonth: 2500,
//   averageCostPerVehicle: 833.33
// }
```

## How the Alert System Works

We automatically generate alerts to let you know when maintenance is coming up. We look at:
1. **Mileage**: Has the vehicle driven past the interval limit since the last service?
2. **Time**: Has it been too many months since the last service?

We then rank the alerts:
- **High (Overdue)**: You've passed the mileage or time limit.
- **Medium (Upcoming)**: You're getting close (within 7 days or 500km).
- **Low**: Just a heads up for the future.

## Error Handling

We try to handle errors gracefully so the app doesn't just crash:
1. **Validation Errors**: We catch bad inputs in the controller and tell you exactly what went wrong.
2. **Logic Errors**: The service layer catches issues like trying to update a vehicle that doesn't exist.
3. **Database Errors**: Our repository layer handles connection drops or failed queries.
4. All of these errors get sent over to our centralized evaluation API, making debugging super simple.

## Running the App

Since it's built entirely in JavaScript, getting things up and running is very straightforward.

```bash
# Run the application
node vehicle_maintenance_scheduler/handlers/Controller.js
```

## Wrapping Up

This setup gives you a solid, scalable foundation for tracking vehicle maintenance. It separates the database code from the business logic, catches and logs errors automatically, and is ready to be hooked up to a real database like PostgreSQL or MongoDB when you need to scale!
