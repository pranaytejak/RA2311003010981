import express from 'express';

// Import the required reusable logging middleware
// Note: Since Log.js is CommonJS and we are in ESM, we import the default and destructure
import pkg from '../logging_middleware/Log.js';
const { Log } = pkg;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// External API endpoint provided by the requirement
const NOTIFICATIONS_API_URL = 'http://20.207.122.201/evaluation-service/notifications';

// Priority weights defining importance
const PRIORITY_WEIGHTS = {
  'placement': 3,
  'result': 2,
  'event': 1
};

/**
 * Stage 6: Priority Inbox requirement
 * GET /api/inbox?limit=5
 * Displays top 'n' most important unread notifications based on weight and recency.
 */
app.get('/api/inbox', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'Fetching priority inbox notifications');

    const limit = parseInt(req.query.limit, 10) || 10;

    // Fetch notifications from the external evaluation service API
    let notifications = [];
    const response = await fetch(NOTIFICATIONS_API_URL, {
      headers: {
        "Authorization": "AWJeWrbVtExdNCYN"// Replace with your actual token
      }
    }).catch(() => null);

    if (!response || !response.ok) {
      const status = response ? response.status : 'Network Error';
      await Log('backend', 'error', 'service', `Failed to fetch notifications: ${status}. Using mock data.`);

      // Fallback mock data so you can test the sorting logic even if the external API is down/unauthorized
      notifications = [
        { ID: "n1", Type: "event", Message: "Farewell Party 2024", Timestamp: new Date(Date.now() - 86400000).toISOString() }, // 1 day ago
        { ID: "n2", Type: "placement", Message: "CSX Corporation hiring drive", Timestamp: new Date(Date.now() - 3600000).toISOString() }, // 1 hour ago
        { ID: "n3", Type: "result", Message: "Mid-sem results declared", Timestamp: new Date(Date.now() - 7200000).toISOString() }, // 2 hours ago
        { ID: "n4", Type: "event", Message: "Annual Tech-Fest", Timestamp: new Date().toISOString() }, // Now
        { ID: "n5", Type: "placement", Message: "Google Internship Opportunities", Timestamp: new Date(Date.now() - 172800000).toISOString() } // 2 days ago
      ];
    } else {
      notifications = await response.json();
    }

    // Sort notifications based on weight (placement > result > event) and recency (timestamp)
    notifications.sort((a, b) => {
      // Safely extract types, defaulting to 'event' weight if unknown
      const typeA = (a.Type || '').toLowerCase();
      const typeB = (b.Type || '').toLowerCase();

      const weightA = PRIORITY_WEIGHTS[typeA] || 0;
      const weightB = PRIORITY_WEIGHTS[typeB] || 0;

      // Primary Sort: By Weight (Descending order)
      if (weightA !== weightB) {
        return weightB - weightA; // Higher weight comes first
      }

      // Secondary Sort: By Recency (Descending timestamp - newer comes first)
      const timeA = new Date(a.Timestamp || 0).getTime();
      const timeB = new Date(b.Timestamp || 0).getTime();

      return timeB - timeA;
    });

    // Get the top 'n' notifications based on the provided limit
    const priorityInbox = notifications.slice(0, limit);

    await Log('backend', 'info', 'controller', `Successfully retrieved top ${limit} priority notifications`);

    res.json({
      success: true,
      count: priorityInbox.length,
      data: priorityInbox
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await Log('backend', 'error', 'handler', `Error processing priority inbox: ${errorMsg}`);

    res.status(500).json({
      success: false,
      error: 'Internal server error while processing notifications'
    });
  }
});

// Example integration for logging data type mismatch in a backend handler
app.post('/api/validate', async (req, res) => {
  try {
    const { isActive } = req.body;

    // Simulating a data type mismatch check
    if (typeof isActive !== 'boolean') {
      await Log('backend', 'error', 'handler', `received ${typeof isActive}, expected bool`);
      return res.status(400).json({ error: "Invalid data type for isActive, expected boolean" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Example integration for logging a database connection failure
app.get('/api/database-test', async (req, res) => {
  try {
    // Simulating a DB connection failure
    throw new Error('ECONNREFUSED: Database connection failed');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await Log('backend', 'fatal', 'db', `Database layer error: ${errorMsg}`);
    res.status(500).json({ error: 'Database error simulated' });
  }
});

app.listen(PORT, () => {
  console.log(`Notification Priority Inbox Service running on port ${PORT}`);
  // Log service startup
  Log('backend', 'info', 'service', `Notification service started on port ${PORT}`);
});
