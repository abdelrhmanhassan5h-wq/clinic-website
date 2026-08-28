const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// تخزين مؤقت للحجوزات
const bookings = [];

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.json({
    message: "Mabraf Al-Falaki API is running 🚀",
  });
});

// استقبال حجز جديد
app.post("/api/bookings", (req, res) => {
  const {
    specialty,
    doctor,
    date,
    time,
    name,
    phone,
  } = req.body;

  // التأكد من البيانات
  if (
    !specialty ||
    !doctor ||
    !date ||
    !time ||
    !name ||
    !phone
  ) {
    return res.status(400).json({
      success: false,
      message: "من فضلك أكمل جميع البيانات",
    });
  }

  // التأكد من رقم الهاتف
  if (!/^01[0-9]{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "رقم الهاتف غير صحيح",
    });
  }

  // منع حجز نفس الموعد
  const alreadyBooked = bookings.some(
    (booking) =>
      booking.doctor === doctor &&
      booking.date === date &&
      booking.time === time
  );

  if (alreadyBooked) {
    return res.status(409).json({
      success: false,
      message: "هذا الموعد محجوز بالفعل",
    });
  }

  // إنشاء الحجز
  const newBooking = {
    id: bookings.length + 1,
    specialty,
    doctor,
    date,
    time,
    name,
    phone,
    createdAt: new Date().toISOString(),
  };

  bookings.push(newBooking);

  console.log("New booking:", newBooking);

  res.status(201).json({
    success: true,
    message: "تم تسجيل الحجز بنجاح",
    booking: newBooking,
  });
});

// عرض الحجوزات مؤقتًا
app.get("/api/bookings", (req, res) => {
  res.json({
    success: true,
    bookings,
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});