/**
 * Vehicle Maintenance Repository
 * Handles data persistence and database operations
 */

const { Log } = require("../../logging_middleware/Log");

// Simulated in-memory database
const vehiclesDb = new Map();
const tasksDb = new Map();
const recordsDb = new Map();
const alertsDb = new Map();

/**
 * Vehicle Repository - Handles vehicle data operations
 */
class VehicleRepository {
  /**
   * Create a new vehicle
   * @param {Object} vehicle - Vehicle object
   * @returns {Promise<Object>} Created vehicle
   */
  static async createVehicle(vehicle) {
    try {
      if (!vehicle.id || !vehicle.ownerId) {
        await Log("backend", "error", "repository", "Missing required fields: id and ownerId for vehicle");
        throw new Error("Invalid vehicle data: missing id or ownerId");
      }

      vehiclesDb.set(vehicle.id, vehicle);
      await Log("backend", "info", "repository", 
        `Vehicle created: ID=${vehicle.id}, Make=${vehicle.make}`);
      return vehicle;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to create vehicle: ${msg}`);
      throw error;
    }
  }

  /**
   * Get vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object|null>} Vehicle object or null
   */
  static async getVehicleById(vehicleId) {
    try {
      const vehicle = vehiclesDb.get(vehicleId);
      if (!vehicle) {
        await Log("backend", "warn", "repository", `Vehicle not found: ID=${vehicleId}`);
        return null;
      }
      return vehicle;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Database error fetching vehicle: ${msg}`);
      throw error;
    }
  }

  /**
   * Get all vehicles for an owner
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Array>} Array of vehicles
   */
  static async getVehiclesByOwnerId(ownerId) {
    try {
      const vehicles = Array.from(vehiclesDb.values()).filter(v => v.ownerId === ownerId);
      await Log("backend", "debug", "repository", 
        `Retrieved ${vehicles.length} vehicles for owner=${ownerId}`);
      return vehicles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to fetch vehicles by owner: ${msg}`);
      throw error;
    }
  }

  /**
   * Update vehicle mileage
   * @param {string} vehicleId - Vehicle ID
   * @param {number} newMileage - New mileage value
   * @returns {Promise<void>}
   */
  static async updateVehicleMileage(vehicleId, newMileage) {
    try {
      const vehicle = vehiclesDb.get(vehicleId);
      if (!vehicle) {
        await Log("backend", "error", "repository", `Vehicle not found for mileage update: ${vehicleId}`);
        throw new Error("Vehicle not found");
      }

      if (newMileage < vehicle.mileage) {
        await Log("backend", "warn", "repository", 
          `Mileage decrease detected: vehicle=${vehicleId}, old=${vehicle.mileage}, new=${newMileage}`);
        throw new Error("Mileage cannot decrease");
      }

      vehicle.mileage = newMileage;
      vehicle.updatedAt = new Date();
      vehiclesDb.set(vehicleId, vehicle);
      await Log("backend", "info", "repository", 
        `Vehicle mileage updated: ID=${vehicleId}, mileage=${newMileage}km`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to update vehicle mileage: ${msg}`);
      throw error;
    }
  }
}

/**
 * Maintenance Task Repository
 */
class MaintenanceTaskRepository {
  /**
   * Create maintenance task template
   * @param {Object} task - Task object
   * @returns {Promise<Object>} Created task
   */
  static async createTask(task) {
    try {
      if (!task.id || !task.vehicleId) {
        await Log("backend", "error", "repository", "Missing required task fields");
        throw new Error("Invalid task data");
      }

      tasksDb.set(task.id, task);
      await Log("backend", "info", "repository", 
        `Maintenance task created: ID=${task.id}, taskName=${task.taskName}, category=${task.category}`);
      return task;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to create maintenance task: ${msg}`);
      throw error;
    }
  }

  /**
   * Get maintenance tasks for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of tasks
   */
  static async getTasksByVehicleId(vehicleId) {
    try {
      const tasks = Array.from(tasksDb.values()).filter(t => t.vehicleId === vehicleId);
      await Log("backend", "debug", "repository", 
        `Retrieved ${tasks.length} tasks for vehicle=${vehicleId}`);
      return tasks;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to fetch tasks: ${msg}`);
      throw error;
    }
  }
}

/**
 * Maintenance Record Repository
 */
class MaintenanceRecordRepository {
  /**
   * Log a maintenance service record
   * @param {Object} record - Record object
   * @returns {Promise<Object>} Created record
   */
  static async createRecord(record) {
    try {
      if (!record.id || !record.vehicleId || !record.taskId) {
        await Log("backend", "error", "repository", "Missing required maintenance record fields");
        throw new Error("Invalid record data");
      }

      recordsDb.set(record.id, record);
      await Log("backend", "info", "repository", 
        `Maintenance record logged: ID=${record.id}, vehicleId=${record.vehicleId}, cost=${record.cost}`);
      return record;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to create maintenance record: ${msg}`);
      throw error;
    }
  }

  /**
   * Get maintenance history for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of records
   */
  static async getRecordsByVehicleId(vehicleId) {
    try {
      const records = Array.from(recordsDb.values()).filter(r => r.vehicleId === vehicleId);
      await Log("backend", "debug", "repository", 
        `Retrieved ${records.length} records for vehicle=${vehicleId}`);
      return records;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to fetch records: ${msg}`);
      throw error;
    }
  }
}

/**
 * Alert Repository
 */
class AlertRepository {
  /**
   * Create or update maintenance alert
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Created/updated alert
   */
  static async upsertAlert(alert) {
    try {
      if (!alert.id || !alert.vehicleId) {
        await Log("backend", "error", "repository", "Missing required alert fields");
        throw new Error("Invalid alert data");
      }

      alertsDb.set(alert.id, alert);
      await Log("backend", "info", "repository", 
        `Alert created/updated: ID=${alert.id}, type=${alert.alertType}, priority=${alert.priority}`);
      return alert;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to create alert: ${msg}`);
      throw error;
    }
  }

  /**
   * Get active alerts for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of alerts
   */
  static async getActiveAlerts(vehicleId) {
    try {
      const alerts = Array.from(alertsDb.values())
        .filter(a => a.vehicleId === vehicleId && a.status !== "dismissed");
      await Log("backend", "debug", "repository", 
        `Retrieved ${alerts.length} active alerts for vehicle=${vehicleId}`);
      return alerts;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to fetch alerts: ${msg}`);
      throw error;
    }
  }

  /**
   * Update alert status
   * @param {string} alertId - Alert ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  static async updateAlertStatus(alertId, status) {
    try {
      const alert = alertsDb.get(alertId);
      if (!alert) {
        await Log("backend", "error", "repository", `Alert not found: ${alertId}`);
        throw new Error("Alert not found");
      }

      alert.status = status;
      alert.updatedAt = new Date();
      alertsDb.set(alertId, alert);
      await Log("backend", "info", "repository", 
        `Alert status updated: ID=${alertId}, status=${status}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "repository", `Failed to update alert: ${msg}`);
      throw error;
    }
  }
}

module.exports = {
  VehicleRepository,
  MaintenanceTaskRepository,
  MaintenanceRecordRepository,
  AlertRepository
};
