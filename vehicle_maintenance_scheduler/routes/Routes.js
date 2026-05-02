/**
 * Vehicle Maintenance Routes
 * Defines API endpoints for the vehicle maintenance scheduler
 */

const { Log } = require("../../logging_middleware/Log");
const MaintenanceController = require("./Controller");

/**
 * Route definitions for vehicle maintenance system
 */
const maintenanceRoutes = {
  // Vehicle Management
  "POST /api/vehicles/register": MaintenanceController.registerVehicle,

  // Maintenance Tasks
  "POST /api/vehicles/:vehicleId/tasks": MaintenanceController.addMaintenanceTask,

  // Service Logging
  "POST /api/vehicles/:vehicleId/service": MaintenanceController.logMaintenanceService,

  // Alerts & Notifications
  "GET /api/vehicles/:vehicleId/alerts": MaintenanceController.getMaintenanceAlerts,

  // Metrics & Dashboard
  "GET /api/metrics/:ownerId": MaintenanceController.getMetrics
};

/**
 * API Usage Documentation
 */
const apiDocumentation = {
  baseUrl: "http://localhost:3000/api",

  endpoints: [
    {
      method: "POST",
      path: "/api/vehicles/register",
      description: "Register a new vehicle",
      requestBody: {
        ownerId: "owner-123",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        licensePlate: "ABC-1234",
        currentMileage: 45000
      },
      responseExample: {
        status: 201,
        body: {
          success: true,
          message: "Vehicle registered successfully",
          data: {
            id: "VEH-1714662000000-abc123",
            ownerId: "owner-123",
            make: "Toyota",
            model: "Corolla",
            year: 2020,
            licensePlate: "ABC-1234",
            mileage: 45000,
            createdAt: "2024-05-02T10:20:00Z",
            updatedAt: "2024-05-02T10:20:00Z"
          }
        }
      }
    },
    {
      method: "POST",
      path: "/api/vehicles/:vehicleId/tasks",
      description: "Add a maintenance task template",
      requestBody: {
        taskName: "Oil Change",
        category: "routine",
        intervalType: "distance",
        intervalValue: 5000,
        estimatedCost: 500,
        description: "Regular engine oil and filter change"
      },
      responseExample: {
        status: 201,
        body: {
          success: true,
          message: "Maintenance task added",
          data: {
            id: "TSK-VEH-1714662000000-1714662000000",
            vehicleId: "VEH-1714662000000-abc123",
            taskName: "Oil Change",
            category: "routine",
            requiredInterval: {
              type: "distance",
              value: 5000
            },
            estimatedCost: 500,
            createdAt: "2024-05-02T10:30:00Z",
            updatedAt: "2024-05-02T10:30:00Z"
          }
        }
      }
    },
    {
      method: "POST",
      path: "/api/vehicles/:vehicleId/service",
      description: "Log a completed maintenance service",
      requestBody: {
        taskId: "TSK-VEH-1714662000000-1714662000000",
        mileage: 50000,
        cost: 500,
        servicedBy: "AutoCare Center",
        notes: "Oil changed, filter replaced. Vehicle running smoothly."
      },
      responseExample: {
        status: 201,
        body: {
          success: true,
          message: "Maintenance service logged",
          data: {
            record: {
              id: "REC-VEH-1714662000000-1714662001000",
              vehicleId: "VEH-1714662000000-abc123",
              taskId: "TSK-VEH-1714662000000-1714662000000",
              completedDate: "2024-05-02T10:40:00Z",
              mileageAtService: 50000,
              cost: 500,
              servicedBy: "AutoCare Center",
              notes: "Oil changed, filter replaced. Vehicle running smoothly.",
              createdAt: "2024-05-02T10:40:00Z"
            },
            alertUpdated: true
          }
        }
      }
    },
    {
      method: "GET",
      path: "/api/vehicles/:vehicleId/alerts",
      description: "Get active maintenance alerts",
      responseExample: {
        status: 200,
        body: {
          success: true,
          data: [
            {
              id: "ALT-VEH-1714662000000-TSK-1714662000000",
              vehicleId: "VEH-1714662000000-abc123",
              taskId: "TSK-VEH-1714662000000-1714662000000",
              alertType: "upcoming",
              currentMileage: 50000,
              dueDate: "2024-05-15T00:00:00Z",
              dueMileage: 55000,
              priority: "medium",
              status: "pending",
              createdAt: "2024-05-02T10:50:00Z"
            }
          ],
          count: 1
        }
      }
    },
    {
      method: "GET",
      path: "/api/metrics/:ownerId",
      description: "Get maintenance metrics for dashboard",
      responseExample: {
        status: 200,
        body: {
          success: true,
          data: {
            totalVehicles: 3,
            totalMaintenanceTasks: 12,
            overdueMaintenance: 2,
            upcomingMaintenance: 5,
            totalSpentThisMonth: 2500,
            averageCostPerVehicle: 833.33
          }
        }
      }
    }
  ]
};

/**
 * Middleware: Log route access
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @param {Object} [query] - Query parameters
 * @returns {Promise<void>}
 */
async function logRouteAccess(method, path, query) {
  try {
    const pathPattern = path.replace(/:[a-zA-Z]+/g, "*");
    await Log("backend", "debug", "route", 
      `API request: ${method} ${pathPattern}`);
  } catch (error) {
    console.error("Failed to log route access:", error);
  }
}

/**
 * Express.js Integration Example
 * 
 * const express = require('express');
 * const MaintenanceController = require('./handlers/Controller');
 * const { logRouteAccess } = require('./routes/Routes');
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * // Register routes
 * app.post('/api/vehicles/register', async (req, res) => {
 *   await logRouteAccess('POST', '/api/vehicles/register');
 *   const result = await MaintenanceController.registerVehicle(req);
 *   res.status(result.status).json(result.body);
 * });
 * 
 * app.post('/api/vehicles/:vehicleId/tasks', async (req, res) => {
 *   await logRouteAccess('POST', '/api/vehicles/:vehicleId/tasks');
 *   const result = await MaintenanceController.addMaintenanceTask(req, req.params.vehicleId);
 *   res.status(result.status).json(result.body);
 * });
 * 
 * app.post('/api/vehicles/:vehicleId/service', async (req, res) => {
 *   await logRouteAccess('POST', '/api/vehicles/:vehicleId/service');
 *   const result = await MaintenanceController.logMaintenanceService(req, req.params.vehicleId);
 *   res.status(result.status).json(result.body);
 * });
 * 
 * app.get('/api/vehicles/:vehicleId/alerts', async (req, res) => {
 *   await logRouteAccess('GET', '/api/vehicles/:vehicleId/alerts');
 *   const result = await MaintenanceController.getMaintenanceAlerts(req.params.vehicleId);
 *   res.status(result.status).json(result.body);
 * });
 * 
 * app.get('/api/metrics/:ownerId', async (req, res) => {
 *   await logRouteAccess('GET', '/api/metrics/:ownerId');
 *   const result = await MaintenanceController.getMetrics(req.params.ownerId);
 *   res.status(result.status).json(result.body);
 * });
 * 
 * app.listen(3000, () => console.log('Server running on port 3000'));
 */

module.exports = {
  maintenanceRoutes,
  apiDocumentation,
  logRouteAccess
};
