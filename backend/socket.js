const Notification = require("./models/notification.model");

const onlineUsers = {};

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on('join', async (userId) => {
      try {
        console.log("📌 User joined:", userId);
        onlineUsers[userId] = socket.id;
        
        // Join a room with userId for targeted notifications
        socket.join(userId);
        console.log("🏠 User joined room:", userId);
        console.log("📊 Total online users:", Object.keys(onlineUsers).length);

        // Fetch unread notifications from DB:
        const unread = await Notification.find({
          userId: userId,
          isRead: false,
        }).sort({ createdAt: -1 });

        console.log(`📧 Found ${unread.length} unread notifications for user ${userId}`);

        // Send them via socket:
        unread.forEach((notif) => {
          socket.emit("newNotification", notif);
        });
      } catch (error) {
        console.error("❌ Error in socket join:", error);
      }
    });

    socket.on('disconnect', () => {
      console.log("❌ Socket disconnected:", socket.id);
      for (let id in onlineUsers) {
        if (onlineUsers[id] === socket.id) {
          delete onlineUsers[id];
          console.log(`👤 User ${id} removed from online users`);
          break;
        }
      }
    });

    socket.on('error', (error) => {
      console.error("❌ Socket error:", error);
    });
  });
}

module.exports = {
  setupSocket,
  onlineUsers,
};
