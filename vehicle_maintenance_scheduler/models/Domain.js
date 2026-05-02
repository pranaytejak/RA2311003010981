/**
 * Vehicle Maintenance Scheduler - Domain Models
 * Defines the core entities for vehicle maintenance tracking
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} id - Unique vehicle identifier
 * @property {string} ownerId - Owner identifier
 * @property {string} make - Vehicle make (e.g., "Toyota")
 * @property {string} model - Vehicle model (e.g., "Corolla")
 * @property {number} year - Manufacturing year
 * @property {string} licensePlate - Vehicle license plate
 * @property {number} mileage - Current mileage in km
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} MaintenanceTask
 * @property {string} id - Task identifier
 * @property {string} vehicleId - Associated vehicle ID
 * @property {string} taskName - Task name (e.g., "Oil Change")
 * @property {string} description - Task description
 * @property {"routine"|"preventive"|"repair"} category - Task category
 * @property {Object} requiredInterval - Maintenance interval
 * @property {"distance"|"time"} requiredInterval.type - Interval type
 * @property {number} requiredInterval.value - Interval value
 * @property {number} estimatedCost - Estimated cost
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} MaintenanceRecord
 * @property {string} id - Record identifier
 * @property {string} vehicleId - Vehicle ID
 * @property {string} taskId - Task ID
 * @property {Date} completedDate - Service completion date
 * @property {number} mileageAtService - Vehicle mileage at service
 * @property {number} cost - Service cost
 * @property {string} servicedBy - Service center/mechanic name
 * @property {string} notes - Service notes
 * @property {Date} [nextDueDate] - Next service due date
 * @property {number} [nextDueMileage] - Next service due mileage
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} MaintenanceAlert
 * @property {string} id - Alert identifier
 * @property {string} vehicleId - Vehicle ID
 * @property {string} taskId - Task ID
 * @property {"overdue"|"upcoming"|"critical"} alertType - Alert type
 * @property {number} currentMileage - Current vehicle mileage
 * @property {Date} dueDate - Due date for maintenance
 * @property {number} dueMileage - Due mileage for maintenance
 * @property {"low"|"medium"|"high"} priority - Alert priority
 * @property {"pending"|"notified"|"acknowledged"|"dismissed"} status - Alert status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} MaintenanceMetrics
 * @property {number} totalVehicles - Total registered vehicles
 * @property {number} totalMaintenanceTasks - Total maintenance tasks
 * @property {number} overdueMaintenance - Number of overdue tasks
 * @property {number} upcomingMaintenance - Number of upcoming tasks
 * @property {number} totalSpentThisMonth - Total spent this month
 * @property {number} averageCostPerVehicle - Average cost per vehicle
 */

module.exports = {
  // Domain models are defined via JSDoc above
  // This file serves as documentation for the data structures
};
