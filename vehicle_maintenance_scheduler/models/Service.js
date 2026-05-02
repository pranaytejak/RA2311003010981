/**
 * Vehicle Maintenance Service
 * Contains business logic for maintenance scheduling and alerts
 */

const { Log } = require("../../logging_middleware/Log");
const {
  VehicleRepository,
  MaintenanceTaskRepository,
  MaintenanceRecordRepository,
  AlertRepository
} = require("./Repository");

/**
 * Maintenance Service - Business logic layer
 */
class MaintenanceService {
  /**
   * Register a new vehicle in the system
   * @param {string} ownerId - Owner ID
   * @param {string} make - Vehicle make
   * @param {string} model - Vehicle model
   * @param {number} year - Manufacturing year
   * @param {string} licensePlate - License plate
   * @param {number} currentMileage - Current mileage
   * @returns {Promise<Object>} Created vehicle
   */
  static async registerVehicle(ownerId, make, model, year, licensePlate, currentMileage) {
    try {
      if (!ownerId || !make || !model || year < 1900) {
        await Log("backend", "error", "service", 
          "Invalid vehicle registration data: missing or invalid fields");
        throw new Error("Invalid vehicle data");
      }

      const vehicle = {
        id: `VEH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ownerId,
        make,
        model,
        year,
        licensePlate,
        mileage: currentMileage,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await VehicleRepository.createVehicle(vehicle);
      await Log("backend", "info", "service", 
        `Vehicle registered successfully: ${make} ${model} (${year}) - License: ${licensePlate}`);

      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "service", `Vehicle registration failed: ${msg}`);
      throw error;
    }
  }

  /**
   * Add a maintenance task template for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {string} taskName - Task name
   * @param {string} category - Task category
   * @param {string} intervalType - Interval type (distance/time)
   * @param {number} intervalValue - Interval value
   * @param {number} estimatedCost - Estimated cost
   * @param {string} description - Task description
   * @returns {Promise<Object>} Created task
   */
  static async addMaintenanceTask(vehicleId, taskName, category, intervalType, intervalValue, estimatedCost, description) {
    try {
      const vehicle = await VehicleRepository.getVehicleById(vehicleId);
      if (!vehicle) {
        await Log("backend", "error", "service", `Vehicle not found: ${vehicleId}`);
        throw new Error("Vehicle not found");
      }

      if (intervalValue <= 0) {
        await Log("backend", "warn", "service", 
          `Invalid interval value: ${intervalValue}. Must be positive`);
        throw new Error("Interval value must be positive");
      }

      const task = {
        id: `TSK-${vehicleId}-${Date.now()}`,
        vehicleId,
        taskName,
        description,
        category,
        requiredInterval: {
          type: intervalType,
          value: intervalValue
        },
        estimatedCost,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await MaintenanceTaskRepository.createTask(task);
      await Log("backend", "info", "service", 
        `Maintenance task added: ${taskName} (${category}) for vehicle ${vehicleId}`);

      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "service", `Failed to add maintenance task: ${msg}`);
      throw error;
    }
  }

  /**
   * Log a completed maintenance service
   * @param {string} vehicleId - Vehicle ID
   * @param {string} taskId - Task ID
   * @param {number} mileage - Mileage at service
   * @param {number} cost - Service cost
   * @param {string} servicedBy - Service center name
   * @param {string} notes - Service notes
   * @returns {Promise<Object>} Result with record and alert status
   */
  static async logMaintenanceService(vehicleId, taskId, mileage, cost, servicedBy, notes) {
    try {
      const vehicle = await VehicleRepository.getVehicleById(vehicleId);
      if (!vehicle) {
        await Log("backend", "error", "service", `Vehicle not found: ${vehicleId}`);
        throw new Error("Vehicle not found");
      }

      // Validate mileage
      if (mileage < vehicle.mileage) {
        await Log("backend", "error", "service", 
          `Invalid mileage: received ${mileage}, vehicle current mileage is ${vehicle.mileage}`);
        throw new Error("Service mileage cannot be less than current vehicle mileage");
      }

      if (cost < 0) {
        await Log("backend", "warn", "service", `Negative cost detected: ${cost}`);
        throw new Error("Cost cannot be negative");
      }

      // Update vehicle mileage
      await VehicleRepository.updateVehicleMileage(vehicleId, mileage);

      // Create maintenance record
      const record = {
        id: `REC-${vehicleId}-${Date.now()}`,
        vehicleId,
        taskId,
        completedDate: new Date(),
        mileageAtService: mileage,
        cost,
        servicedBy,
        notes,
        createdAt: new Date()
      };

      await MaintenanceRecordRepository.createRecord(record);
      await Log("backend", "info", "service", 
        `Maintenance service logged: vehicle=${vehicleId}, cost=${cost}, mileage=${mileage}km`);

      // Clear related alerts
      const alerts = await AlertRepository.getActiveAlerts(vehicleId);
      let alertUpdated = false;

      for (const alert of alerts) {
        if (alert.taskId === taskId) {
          await AlertRepository.updateAlertStatus(alert.id, "acknowledged");
          alertUpdated = true;
        }
      }

      return { record, alertUpdated };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "service", `Failed to log maintenance service: ${msg}`);
      throw error;
    }
  }

  /**
   * Check and generate maintenance alerts
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of generated alerts
   */
  static async generateMaintenanceAlerts(vehicleId) {
    try {
      const vehicle = await VehicleRepository.getVehicleById(vehicleId);
      if (!vehicle) {
        await Log("backend", "error", "service", `Vehicle not found: ${vehicleId}`);
        throw new Error("Vehicle not found");
      }

      const tasks = await MaintenanceTaskRepository.getTasksByVehicleId(vehicleId);
      const records = await MaintenanceRecordRepository.getRecordsByVehicleId(vehicleId);
      const createdAlerts = [];

      for (const task of tasks) {
        const lastRecord = records
          .filter(r => r.taskId === task.id)
          .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime())[0];

        let nextDue = null;

        if (task.requiredInterval.type === "distance") {
          const nextMileage = (lastRecord?.mileageAtService || 0) + task.requiredInterval.value;
          nextDue = {
            mileage: nextMileage,
            date: new Date(lastRecord?.completedDate || new Date())
          };
        } else {
          const nextDate = new Date(lastRecord?.completedDate || new Date());
          nextDate.setMonth(nextDate.getMonth() + task.requiredInterval.value);
          nextDue = {
            mileage: (lastRecord?.mileageAtService || 0),
            date: nextDate
          };
        }

        if (!nextDue) continue;

        let alertType = "upcoming";
        let priority = "low";

        const daysUntilDue = Math.ceil(
          (nextDue.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (vehicle.mileage > nextDue.mileage || daysUntilDue < 0) {
          alertType = "overdue";
          priority = "high";
        } else if (daysUntilDue <= 7 || vehicle.mileage > nextDue.mileage - 500) {
          alertType = "upcoming";
          priority = "medium";
        }

        const alert = {
          id: `ALT-${vehicleId}-${task.id}-${Date.now()}`,
          vehicleId,
          taskId: task.id,
          alertType,
          currentMileage: vehicle.mileage,
          dueDate: nextDue.date,
          dueMileage: nextDue.mileage,
          priority,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await AlertRepository.upsertAlert(alert);
        createdAlerts.push(alert);

        await Log("backend", "info", "service", 
          `Alert generated: vehicle=${vehicleId}, task=${task.taskName}, type=${alertType}, priority=${priority}`);
      }

      return createdAlerts;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "service", `Failed to generate alerts: ${msg}`);
      throw error;
    }
  }

  /**
   * Get maintenance metrics for dashboard
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Object>} Maintenance metrics
   */
  static async getMaintenanceMetrics(ownerId) {
    try {
      const vehicles = await VehicleRepository.getVehiclesByOwnerId(ownerId);
      let totalTasks = 0;
      let overdue = 0;
      let upcoming = 0;
      let totalCost = 0;

      for (const vehicle of vehicles) {
        const tasks = await MaintenanceTaskRepository.getTasksByVehicleId(vehicle.id);
        totalTasks += tasks.length;

        const alerts = await AlertRepository.getActiveAlerts(vehicle.id);
        overdue += alerts.filter(a => a.alertType === "overdue").length;
        upcoming += alerts.filter(a => a.alertType === "upcoming").length;

        const records = await MaintenanceRecordRepository.getRecordsByVehicleId(vehicle.id);
        const thisMonth = records.filter(r => {
          const recordDate = r.completedDate;
          const now = new Date();
          return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
        });
        totalCost += thisMonth.reduce((sum, r) => sum + r.cost, 0);
      }

      const metrics = {
        totalVehicles: vehicles.length,
        totalMaintenanceTasks: totalTasks,
        overdueMaintenance: overdue,
        upcomingMaintenance: upcoming,
        totalSpentThisMonth: totalCost,
        averageCostPerVehicle: vehicles.length > 0 ? totalCost / vehicles.length : 0
      };

      await Log("backend", "debug", "service", 
        `Metrics calculated: owner=${ownerId}, vehicles=${vehicles.length}, overdue=${overdue}`);

      return metrics;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await Log("backend", "error", "service", `Failed to calculate metrics: ${msg}`);
      throw error;
    }
  }
}

module.exports = MaintenanceService;
