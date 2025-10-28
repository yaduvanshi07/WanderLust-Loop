const User = require("../models/user");
const Listing = require("../models/listing");
const listingPerformanceTracker = require("./listingPerformanceTracker");

class HostNotificationService {
    constructor() {
        this.notificationQueue = [];
        this.processedNotifications = new Set();
    }

    async checkAndNotifyLowPerformingListings() {
        try {
            // Minimal log to indicate cycle
            console.log('Checking low-performing listings...');
            
            // Get listings with performance score below 40
            const lowPerformers = await listingPerformanceTracker.getLowPerformingListings(40, 30);
            
            for (const { listing, performance, owner } of lowPerformers) {
                const notificationKey = `low_performance_${listing._id}_${new Date().toISOString().split('T')[0]}`;
                
                // Avoid duplicate notifications for the same day
                if (this.processedNotifications.has(notificationKey)) {
                    continue;
                }

                // Create notification for the host
                const notification = {
                    type: 'listing_performance',
                    listingId: listing._id,
                    listingTitle: listing.title,
                    hostId: owner,
                    performance: performance,
                    recommendations: performance.recommendations,
                    timestamp: new Date(),
                    priority: performance.metrics.performanceScore < 20 ? 'high' : 'medium'
                };

                this.notificationQueue.push(notification);
                this.processedNotifications.add(notificationKey);
            }

            // Process notifications
            await this.processNotifications();
            
        } catch (error) {
            console.error('Error checking low performing listings:', error);
        }
    }

    async processNotifications() {
        for (const notification of this.notificationQueue) {
            try {
                await this.sendHostNotification(notification);
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        }
        
        // Clear processed notifications
        this.notificationQueue = [];
    }

    async sendHostNotification(notification) {
        try {
            const host = await User.findById(notification.hostId);
            if (!host) {
                console.log(`Host not found for notification: ${notification.hostId}`);
                return;
            }

            // Minimal terminal output per requirement: only host and score
            console.log(`Notify host: ${host.username} | Score: ${notification.performance.metrics.performanceScore}`);

            // In a real implementation, you would:
            // 1. Store notification in database
            // 2. Send email to host
            // 3. Send push notification if mobile app exists
            // 4. Update host dashboard with notification

        } catch (error) {
            console.error('Error sending host notification:', error);
        }
    }

    createNotificationMessage(notification) {
        const { performance, listingTitle } = notification;
        const score = performance.metrics.performanceScore;
        const status = performance.status;

        let message = `Your listing "${listingTitle}" is not attracting enough users. `;
        
        if (score < 20) {
            message += `Performance is critical (${score}/100). `;
        } else if (score < 40) {
            message += `Performance is poor (${score}/100). `;
        }

        message += `Here are some recommendations to improve your listing's visibility and appeal:`;

        return message;
    }

    async getHostNotifications(hostId, limit = 10) {
        try {
            // Get all listings owned by this host
            const hostListings = await Listing.find({ owner: hostId });
            const listingIds = hostListings.map(l => l._id);

            // Get performance data for each listing
            const notifications = [];
            for (const listing of hostListings) {
                const performance = await listingPerformanceTracker.getListingPerformance(listing._id, 30);
                if (performance && performance.metrics.performanceScore < 50) {
                    notifications.push({
                        listingId: listing._id,
                        listingTitle: listing.title,
                        performance: performance,
                        timestamp: performance.lastUpdated
                    });
                }
            }

            return notifications.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        } catch (error) {
            console.error('Error getting host notifications:', error);
            return [];
        }
    }

    async schedulePerformanceCheck() {
        // Run performance check every 6 hours
        setInterval(async () => {
            await this.checkAndNotifyLowPerformingListings();
        }, 6 * 60 * 60 * 1000);

        // Run initial check
        await this.checkAndNotifyLowPerformingListings();
    }

    // Method to manually trigger performance check (for testing)
    async triggerPerformanceCheck() {
        await this.checkAndNotifyLowPerformingListings();
    }
}

module.exports = new HostNotificationService();
