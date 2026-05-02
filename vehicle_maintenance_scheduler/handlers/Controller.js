/**
 * Vehicle Maintenance Controllers
 * Handles HTTP requests and responses
 */

const { Log } = require("../../logging_middleware/Log");
const MaintenanceService = require("../models/Service");

/**
 * Maintenance Controller - HTTP request handlers
 */
class MaintenanceController {
  /**
   * POST /api/vehicles/register
   * Register a new vehicle
   * @param {Object} req - Request object
   * @returns {Promise<Object>} Response object
   */
  static async registerVehicle(req) {
    try {
      const { ownerId, make, model, year, licensePlate, currentMileage } = req.body;

      // Type validation
      if (typeof ownerId !== "string") {
        await Log("backend", "error", "controller", 
          `Invalid ownerId type: received ${typeof ownerId}, expected string`);
        return {
          status: 400,
          body: { error: "ownerId must be a string" }
        };
      }

      if (typeof make !== "string") {
        await Log("backend", "error", "controller", 
          `Invalid make type: received ${typeof make}, expected string`);
        return {
          status: 400,
          body: { error: "make must be a string" }
        };
      }

      if (typeof year !== "number" || year < 1900) {
        await Log("backend", "error", "controller", 
          `Invalid year type: received ${typeof year}, expected number >= 1900`);
        return {
          status: 400,
          body: { error: "year must be a number >= 1900" }
        };
      }

      if (typeof currentMileage !== "number" || currentMileage < 0) {
        await Log("backend", "error", "controller", 
          `Invalid currentMileage type: received ${typeof currentMileage}, expected non-negative number`);
        return {
          status: 400,
          body: { error: "currentMileage must be a non-negative number" }
        };
      }

      const vehicle = await MaintenanceService.registerVehicle(
        ownerId, make, model, year, licensePlate, currentMileage
      );

      await Log("backend", "info", "controller", 
        `Vehicle registration handler: successfully registered ${make} ${model}`);

      return {
        status: 201,
        body: {
          success: true,
          message: "Vehicle registered successfully",
          data: vehicle
        }
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "controller", `Vehicle registration handler error: ${msg}`);

      return {
        status: 500,
        body: {
          success: false,
          error: "Failed to register vehicle",
          details: msg
        }
      };
    }
  }

  /**
   * POST /api/vehicles/:vehicleId/tasks
   * Add a maintenance task
   * @param {Object} req - Request object
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Response object
   */
  static async addMaintenanceTask(req, vehicleId) {
    try {
      const { taskName, category, intervalType, intervalValue, estimatedCost, description } = req.body;

      if (typeof taskName !== "string" || !taskName) {
        await Log("backend", "error", "controller", 
          `Invalid taskName: received ${typeof taskName}, expected non-empty string`);
        return { status: 400, body: { error: "taskName must be a non-empty string" } };
      }

      if (!["routine", "preventive", "repair"].includes(category)) {
        await Log("backend", "error", "controller", 
          `Invalid category: received ${category}, expected routine|preventive|repair`);
        return { status: 400, body: { error: "Invalid category" } };
      }

      if (!["distance", "time"].includes(intervalType)) {
        await Log("backend", "error", "controller", 
          `Invalid intervalType: received ${intervalType}, expected distance|time`);
        return { status: 400, body: { error: "Invalid intervalType" } };
      }

      if (typeof intervalValue !== "number" || intervalValue <= 0) {
        await Log("backend", "error", "controller", 
          `Invalid intervalValue: received ${intervalValue}, expected positive number`);
        return { status: 400, body: { error: "intervalValue must be a positive number" } };
      }

      const task = await MaintenanceService.addMaintenanceTask(
        vehicleId, taskName, category, intervalType, intervalValue, estimatedCost, description
      );

      await Log("backend", "info", "controller", 
        `Add maintenance task handler: created ${taskName} for vehicle ${vehicleId}`);

      return {
        status: 201,
        body: {
          success: true,
          message: "Maintenance task added",
          data: task
        }
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "controller", `Add maintenance task handler error: ${msg}`);

      return {
        status: 500,
        body: {
          success: false,
          error: "Failed to add maintenance task",
          details: msg
        }
      };
    }
  }

  /**
   * POST /api/vehicles/:vehicleId/service
   * Log a completed maintenance service
   * @param {Object} req - Request object
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Response object
   */
  static async logMaintenanceService(req, vehicleId) {
    try {
      const { taskId, mileage, cost, servicedBy, notes } = req.body;

      if (typeof taskId !== "string") {
        await Log("backend", "error", "controller", 
          `Invalid taskId type: received ${typeof taskId}, expected string`);
        return { status: 400, body: { error: "taskId must be a string" } };
      }

      if (typeof mileage !== "number" || mileage < 0) {
        await Log("backend", "error", "controller", 
          `Invalid mileage type: received ${typeof mileage}, expected non-negative number`);
        return { status: 400, body: { error: "mileage must be a non-negative number" } };
      }

      if (typeof cost !== "number" || cost < 0) {
        await Log("backend", "error", "controller", 
          `Invalid cost type: received ${typeof cost}, expected non-negative number`);
        return { status: 400, body: { error: "cost must be a non-negative number" } };
      }

      const { record, alertUpdated } = await MaintenanceService.logMaintenanceService(
        vehicleId, taskId, mileage, cost, servicedBy, notes
      );

      await Log("backend", "info", "controller", 
        `Log maintenance service handler: recorded service at ${mileage}km for vehicle ${vehicleId}`);

      return {
        status: 201,
        body: {
          success: true,
          message: "Maintenance service logged",
          data: { record, alertUpdated }
        }
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "controller", `Log maintenance service handler error: ${msg}`);

      return {
        status: 500,
        body: {
          success: false,
          error: "Failed to log maintenance service",
          details: msg
        }
      };
    }
  }

  /**
   * GET /api/vehicles/:vehicleId/alerts
   * Get maintenance alerts for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Response object
   */
  static async getMaintenanceAlerts(vehicleId) {
    try {
      const alerts = await MaintenanceService.generateMaintenanceAlerts(vehicleId);

      await Log("backend", "debug", "controller", 
        `Get maintenance alerts handler: retrieved ${alerts.length} alerts for vehicle ${vehicleId}`);

      return {
        status: 200,
        body: {
          success: true,
          data: alerts,
          count: alerts.length
        }
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "controller", `Get maintenance alerts handler error: ${msg}`);

      return {
        status: 500,
        body: {
          success: false,
          error: "Failed to retrieve alerts",
          details: msg
        }
      };
    }
  }

  /**
   * GET /api/metrics/:ownerId
   * Get maintenance metrics for dashboard
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Object>} Response object
   */
  static async getMetrics(ownerId) {
    try {
      if (typeof ownerId !== "string" || !ownerId) {
        await Log("backend", "error", "controller", 
          `Invalid ownerId: received ${typeof ownerId}, expected non-empty string`);
        return { status: 400, body: { error: "ownerId must be a non-empty string" } };
      }

      const metrics = await MaintenanceService.getMaintenanceMetrics(ownerId);

      await Log("backend", "info", "controller", 
        `Get metrics handler: retrieved metrics for owner ${ownerId}, vehicles=${metrics.totalVehicles}`);

      return {
        status: 200,
        body: {
          success: true,
          data: metrics
        }
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "controller", `Get metrics handler error: ${msg}`);

      return {
        status: 500,
        body: {
          success: false,
          error: "Failed to retrieve metrics",
          details: msg
        }
      };
    }
  }
}

module.exports = MaintenanceController;
