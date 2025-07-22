const BookingRequest = require("../models/booking-request.model");
const Unit = require("../models/unit.model");
const notificationService = require('../services/notification.service');

exports.createBookingRequest = async (req, res) => {
  try {
    console.log("=== BOOKING REQUEST DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("User:", req.user);
    console.log("=============================");

    // التحقق من وجود البيانات
    if (!req.body) {
      return res.status(400).json({ 
        error: "Request body is missing",
        debug: "req.body is null or undefined"
      });
    }

    const { unitId, message } = req.body;
    
    // التحقق من unitId
    if (!unitId) {
      return res.status(400).json({ 
        error: "unitId is required",
        received: { unitId, message },
        bodyKeys: Object.keys(req.body)
      });
    }

    // التحقق من المستخدم
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // إنشاء طلب الحجز
    const newRequest = new BookingRequest({
      tenantId: req.user._id,
      unitId,
      message: message || ""
    });

    await newRequest.save();
    
    // Fetch unit to get ownerId and name
    const unit = await Unit.findById(unitId);
    if (unit && unit.ownerId) {
      // Send notification to landlord
      const notification = await notificationService.createNotification({
        userId: unit.ownerId,
        senderId: req.user._id,
        type: 'BOOKING_REQUEST',
        title: `لديك طلب ايجار جديد للوحده ${unit.name}`,
        message: `لديك طلب ايجار جديد للوحده ${unit.name}`,
        link: '/dashboard/booking-requests',
        isRead: false
      });
      // Emit notification via socket.io
      const io = req.app.get('io');
      if (io) {
        console.log('📡 Emitting newNotification to landlord:', unit.ownerId.toString());
        // Populate senderId before emitting
        const populatedNotification = await notification.populate('senderId', 'name avatarUrl');
        io.to(unit.ownerId.toString()).emit('newNotification', populatedNotification);
        console.log('✅ Booking notification emitted successfully');
      } else {
        console.error('❌ Socket.io instance not available');
      }
    }
    
    console.log("Booking request created successfully:", newRequest._id);
    
    res.status(201).json({ 
      message: "Booking request sent successfully.",
      requestId: newRequest._id
    });
  } catch (err) {
    console.error("Booking request error:", err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getLandlordBookings = async (req, res) => {
  try {
    console.log("=== GET LANDLORD BOOKINGS DEBUG ===");
    console.log("User ID:", req.user._id);
    console.log("User role:", req.user.role);
    console.log("================================");

    // التحقق من أن المستخدم مالك
    if (req.user.role !== 'landlord') {
      return res.status(403).json({ 
        error: "Access denied. Only landlords can view booking requests." 
      });
    }

    // جلب جميع طلبات الحجز المعلقة
    const bookings = await BookingRequest.find({ status: "pending" })
      .populate("tenantId", "name email phone")
      .populate("unitId", "name ownerId")
      .lean();

    // console.log("All pending bookings:", bookings.length);
    // console.log("Sample booking:", bookings[0]);
    // console.log("Sample booking unitId:", bookings[0]?.unitId);
    // console.log("Sample booking tenantId:", bookings[0]?.tenantId);

    // فلترة الطلبات للمالك الحالي فقط
    const landlordBookings = bookings.filter((booking) => {
      if (!booking.unitId || !booking.unitId.ownerId) {
        console.log("Booking without unitId or ownerId:", booking);
        return false;
      }
      
      const isOwner = String(booking.unitId.ownerId) === String(req.user._id);
      console.log(`Booking ${booking._id}: ownerId=${booking.unitId.ownerId}, user=${req.user._id}, isOwner=${isOwner}`);
      return isOwner;
    });

    // console.log("Filtered bookings for landlord:", landlordBookings.length);

    res.json({ 
      status: "success", 
      data: { 
        requests: landlordBookings 
      } 
    });
  } catch (err) {
    console.error("Get landlord bookings error:", err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
