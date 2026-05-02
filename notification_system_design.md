# Notification System Design

## 1. Shortcomings with Synchronous Email Dispatch for 200 Students
When the system attempts to send 200 emails synchronously within the same HTTP request cycle (e.g., during a result declaration or placement drive notification), it faces severe shortcomings:
- **Timeouts and Latency**: Email providers (like SendGrid or AWS SES) and SMTP protocols have inherent network latency. Multiplying this latency by 200 can easily exceed standard HTTP request timeouts, leading to connection drops or 504 Gateway Timeouts even if some emails were successfully sent.
- **Partial Failures & Inconsistency**: If the dispatch process crashes or fails at student 105, the first 104 receive the email, but the remaining 96 do not. Re-running the task without complex tracking might result in duplicate emails for the first 104 students.
- **Resource Exhaustion**: Keeping HTTP connections open while waiting for synchronous I/O operations exhausts server connection pools and memory, reducing the overall throughput of the application.

## 2. Should DB Saves and Email Sending Happen Together?
**No, they should not happen synchronously.**
Saving the notification record in the database should be completely decoupled from the actual dispatch of the email.
- **Database Save**: This should be a quick, synchronous operation within the API request. Once saved to the DB, the API should respond immediately to the client with a `200 OK` or `201 Created` status indicating that the notification is queued for delivery.
- **Email Dispatch**: The actual email sending should be offloaded to a message broker (e.g., RabbitMQ, Kafka, or Redis with BullMQ) and handled asynchronously by background worker processes.

## 3. Redesigning for Reliability and Speed
To ensure maximum reliability and speed, the system must adopt an Event-Driven, Asynchronous Architecture:
1. **Message Queue / Broker**: When a notification is generated, the backend saves it to the database and publishes a lightweight event payload (e.g., `NOTIFICATION_CREATED` with the notification ID) to a message queue.
2. **Background Workers**: Dedicated worker services, which scale independently of the main API, consume these events from the queue and handle the actual email dispatch.
3. **Retry Mechanism & Dead Letter Queues (DLQ)**: If an email fails to send due to a transient error (e.g., third-party provider downtime), the worker automatically retries it with exponential backoff. If it fails permanently (e.g., hard bounce, invalid address), it is routed to a DLQ for manual inspection or automated reporting, ensuring no notification is silently dropped.
4. **Batch Processing**: For sending to 200 students, the queue can process emails in optimized batches, respecting API rate limits of the email provider, significantly reducing processing time.
