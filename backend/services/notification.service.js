const Notification = require('../models/notification.model');

// Create a new notification
exports.createNotification = async (data) => {
  const notification = new Notification(data);
  return await notification.save();
};

// Get paginated notifications for a specific user
exports.getUserNotifications = async (userId, limit = 50, page = 1) => {
  console.log('🔍 Fetching notifications for userId:', userId);
  
  const total = await Notification.countDocuments({ userId });
  console.log('📊 Total notifications found:', total);

  const notifications = await Notification.find({ userId })
    .populate('senderId', 'name avatarUrl') // optional: adds sender's name/avatar
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  console.log('📋 Notifications fetched:', notifications.length);
  console.log('📋 First notification:', notifications[0]);

  return {
    data: notifications,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

// Get sent notifications by a landlord
exports.getSentNotifications = async (landlordId) => {
  return await Notification.find({ senderId: landlordId })
    .sort({ createdAt: -1 })
    .populate('userId', 'name avatarUrl') // optional: who the message was sent to
    .lean();
};

// Mark a single notification as read
exports.markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );
};

// Mark all notifications for a user as read
exports.markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

// Delete a single notification
exports.deleteNotification = async (id) => {
  return await Notification.findByIdAndDelete(id);
};

// Get a notification by ID (used for security checks)
exports.getNotificationById = async (id) => {
  return await Notification.findById(id);
};
