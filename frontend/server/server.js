require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;

/* =================================================
   CORS
================================================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://clinic-website-seven-phi.vercel.app",
  "https://clinic-website-n52n-dq85dt68d-abdelrhmanhassan5h-wq.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =================================================
   PATHS
================================================= */

const DATA_DIR = path.join(__dirname);

const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const DOCTORS_FILE = path.join(DATA_DIR, "doctors.json");

const PDF_DIR = path.join(DATA_DIR, "pdfs");

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/* =================================================
   HELPERS
================================================= */

function ensureFile(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify(defaultValue, null, 2),
      "utf8"
    );
  }
}

ensureFile(BOOKINGS_FILE, []);
ensureFile(RESULTS_FILE, []);
ensureFile(REVIEWS_FILE, []);
ensureFile(DOCTORS_FILE, []);

function readJSON(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(fallback, null, 2),
        "utf8"
      );

      return fallback;
    }

    const content = fs.readFileSync(filePath, "utf8");

    if (!content.trim()) {
      return fallback;
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("READ JSON ERROR:", error);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function generateId(prefix = "") {
  return (
    prefix +
    Date.now().toString(36) +
    crypto.randomBytes(4).toString("hex")
  );
}

function normalizePhone(phone) {
  return String(phone || "")
    .trim()
    .replace(/\s+/g, "");
}

function isValidPhone(phone) {
  return /^01[0-9]{9}$/.test(normalizePhone(phone));
}

function cleanText(value) {
  return String(value || "").trim();
}

/* =================================================
   ADMIN AUTH
================================================= */

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "mabra@666";

const adminTokens = new Set();

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.substring(7);

  if (!adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  req.adminToken = token;

  next();
}

/* =================================================
   HEALTH
================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Clinic API is running",
    status: "online",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    time: new Date().toISOString(),
  });
});

/* =================================================
   ADMIN LOGIN
================================================= */

app.post("/api/admin/login", (req, res) => {
  try {
    const username = cleanText(req.body.username);
    const password = String(req.body.password || "");

    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "اسم المستخدم أو كلمة المرور غير صحيحة",
      });
    }

    const token = generateToken();

    adminTokens.add(token);

    return res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تسجيل الدخول",
    });
  }
});

app.post(
  "/api/admin/logout",
  requireAdmin,
  (req, res) => {
    adminTokens.delete(req.adminToken);

    return res.json({
      success: true,
      message: "تم تسجيل الخروج",
    });
  }
);

/* =================================================
   BOOKINGS
================================================= */

app.get("/api/bookings", requireAdmin, (req, res) => {
  try {
    const bookings = readJSON(BOOKINGS_FILE, []);

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الحجوزات",
    });
  }
});

/* =================================================
   CREATE BOOKING
================================================= */

app.post("/api/bookings", (req, res) => {
  try {
    const {
      name,
      patientName,
      phone,
      specialty,
      doctor,
      doctorId,
      date,
      time,
      appointmentDate,
      appointmentTime,
      notes,
    } = req.body;

    const finalName = cleanText(
      patientName || name
    );

    const finalPhone = normalizePhone(phone);

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: "من فضلك اكتب اسم المريض",
      });
    }

    if (!isValidPhone(finalPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم",
      });
    }

    if (!cleanText(specialty)) {
      return res.status(400).json({
        success: false,
        message: "من فضلك اختر التخصص",
      });
    }

    if (!cleanText(doctor)) {
      return res.status(400).json({
        success: false,
        message: "من فضلك اختر الطبيب",
      });
    }

    const bookings = readJSON(BOOKINGS_FILE, []);

    const finalDate = cleanText(
      appointmentDate || date
    );

    const finalTime = cleanText(
      appointmentTime || time
    );

    const booking = {
      id: generateId("booking_"),
      patientName: finalName,
      name: finalName,
      phone: finalPhone,
      specialty: cleanText(specialty),
      doctor: cleanText(doctor),
      doctorId: doctorId || null,
      date: finalDate,
      time: finalTime,
      appointmentDate: finalDate,
      appointmentTime: finalTime,
      notes: cleanText(notes),
      status: "requested",
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      cancelledAt: null,
    };

    bookings.push(booking);

    writeJSON(BOOKINGS_FILE, bookings);

    return res.status(201).json({
      success: true,
      message: "تم الحجز بنجاح",
      booking,
    });
  } catch (error) {
    console.error("CREATE BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء الحجز",
    });
  }
});

/* =================================================
   TRACK BOOKING
================================================= */

app.get("/api/bookings/track/:id", (req, res) => {
  try {
    const bookings = readJSON(BOOKINGS_FILE, []);

    const booking = bookings.find(
      (item) => String(item.id) === String(req.params.id)
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "الحجز غير موجود",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("TRACK BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث عن الحجز",
    });
  }
});

/* =================================================
   CONFIRM BOOKING
================================================= */

app.put(
  "/api/bookings/:id/confirm",
  requireAdmin,
  (req, res) => {
    try {
      const bookings = readJSON(BOOKINGS_FILE, []);

      const index = bookings.findIndex(
        (item) =>
          String(item.id) === String(req.params.id)
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "الحجز غير موجود",
        });
      }

      bookings[index].status = "confirmed";
      bookings[index].confirmedAt =
        new Date().toISOString();

      writeJSON(BOOKINGS_FILE, bookings);

      return res.json({
        success: true,
        message: "تم تأكيد الحجز",
        booking: bookings[index],
      });
    } catch (error) {
      console.error("CONFIRM BOOKING ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء تأكيد الحجز",
      });
    }
  }
);

/* =================================================
   CANCEL BOOKING
================================================= */

app.put(
  "/api/bookings/:id/cancel",
  requireAdmin,
  (req, res) => {
    try {
      const bookings = readJSON(BOOKINGS_FILE, []);

      const index = bookings.findIndex(
        (item) =>
          String(item.id) === String(req.params.id)
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "الحجز غير موجود",
        });
      }

      bookings[index].status = "cancelled";
      bookings[index].cancelledAt =
        new Date().toISOString();

      writeJSON(BOOKINGS_FILE, bookings);

      return res.json({
        success: true,
        message: "تم إلغاء الحجز",
        booking: bookings[index],
      });
    } catch (error) {
      console.error("CANCEL BOOKING ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء إلغاء الحجز",
      });
    }
  }
);

/* =================================================
   DELETE BOOKING
================================================= */

app.delete(
  "/api/bookings/:id",
  requireAdmin,
  (req, res) => {
    try {
      const bookings = readJSON(BOOKINGS_FILE, []);

      const index = bookings.findIndex(
        (item) =>
          String(item.id) === String(req.params.id)
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "الحجز غير موجود",
        });
      }

      const deletedBooking = bookings[index];

      bookings.splice(index, 1);

      writeJSON(BOOKINGS_FILE, bookings);

      return res.json({
        success: true,
        message: "تم حذف الحجز",
        booking: deletedBooking,
      });
    } catch (error) {
      console.error("DELETE BOOKING ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء حذف الحجز",
      });
    }
  }
);

/* =================================================
   RESULTS SEARCH
================================================= */

app.get("/api/results/search", (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "من فضلك اكتب رقم الهاتف",
      });
    }

    const results = readJSON(RESULTS_FILE, []);

    const patientResults = results.filter(
      (item) =>
        normalizePhone(item.phone) === phone
    );

    return res.json({
      success: true,
      results: patientResults,
    });
  } catch (error) {
    console.error(
      "SEARCH RESULTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث عن النتائج",
    });
  }
});

/* =================================================
   RESULT PDF
================================================= */

app.get("/api/results/:id/pdf", (req, res) => {
  try {
    const results = readJSON(RESULTS_FILE, []);

    const result = results.find(
      (item) =>
        String(item.id) === String(req.params.id)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "النتيجة غير موجودة",
      });
    }

    if (!result.fileName) {
      return res.status(404).json({
        success: false,
        message: "ملف النتيجة غير موجود",
      });
    }

    const filePath = path.join(
      PDF_DIR,
      result.fileName
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "ملف PDF غير موجود",
      });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("RESULT PDF ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء فتح النتيجة",
    });
  }
});

/* =================================================
   ADMIN RESULTS
================================================= */

app.get(
  "/api/admin/results",
  requireAdmin,
  (req, res) => {
    try {
      const results = readJSON(RESULTS_FILE, []);

      return res.json({
        success: true,
        results,
      });
    } catch (error) {
      console.error("GET ADMIN RESULTS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء جلب النتائج",
      });
    }
  }
);

/* =================================================
   MULTER
================================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PDF_DIR);
  },

  filename: function (req, file, cb) {
    const extension =
      path.extname(file.originalname) || ".pdf";

    const fileName =
      generateId("result_") + extension;

    cb(null, fileName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    const extension =
      path.extname(file.originalname).toLowerCase();

    if (
      extension !== ".pdf" &&
      file.mimetype !== "application/pdf"
    ) {
      return cb(
        new Error("PDF files only")
      );
    }

    cb(null, true);
  },
});

/* =================================================
   UPLOAD RESULT
================================================= */

app.post(
  "/api/admin/results/upload",
  requireAdmin,
  upload.single("file"),
  (req, res) => {
    try {
      const {
        patientName,
        name,
        phone,
        title,
        description,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "من فضلك اختر ملف PDF",
        });
      }

      const finalPatientName = cleanText(
        patientName || name
      );

      const finalPhone = normalizePhone(phone);

      if (!finalPatientName) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          success: false,
          message: "من فضلك اكتب اسم المريض",
        });
      }

      if (!isValidPhone(finalPhone)) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          success: false,
          message:
            "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم",
        });
      }

      const results = readJSON(RESULTS_FILE, []);

      const result = {
        id: generateId("result_"),
        patientName: finalPatientName,
        name: finalPatientName,
        phone: finalPhone,
        title: cleanText(title),
        description: cleanText(description),
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        createdAt: new Date().toISOString(),
      };

      results.push(result);

      writeJSON(RESULTS_FILE, results);

      return res.status(201).json({
        success: true,
        message: "تم رفع النتيجة بنجاح",
        result,
      });
    } catch (error) {
      console.error(
        "UPLOAD RESULT ERROR:",
        error
      );

      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (deleteError) {
          console.error(
            "DELETE UPLOAD ERROR:",
            deleteError
          );
        }
      }

      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء رفع النتيجة",
      });
    }
  }
);

/* =================================================
   DELETE RESULT
================================================= */

app.delete(
  "/api/admin/results/:id",
  requireAdmin,
  (req, res) => {
    try {
      const results = readJSON(RESULTS_FILE, []);

      const index = results.findIndex(
        (item) =>
          String(item.id) === String(req.params.id)
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "النتيجة غير موجودة",
        });
      }

      const deletedResult = results[index];

      if (deletedResult.fileName) {
        const filePath = path.join(
          PDF_DIR,
          deletedResult.fileName
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      results.splice(index, 1);

      writeJSON(RESULTS_FILE, results);

      return res.json({
        success: true,
        message: "تم حذف النتيجة",
        result: deletedResult,
      });
    } catch (error) {
      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء حذف النتيجة",
      });
    }
  }
);
  if (
    username !== ADMIN_USERNAME ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message:
        "اسم المستخدم أو كلمة المرور غير صحيحة",
    });
  }

  const token = crypto
    .randomBytes(32)
    .toString("hex");

  adminTokens.add(token);

  res.json({
    success: true,
    message: "تم تسجيل الدخول بنجاح",
    token,
  });
});

/* =================================================
   ADMIN LOGOUT
================================================= */

app.post(
  "/api/admin/logout",
  requireAdmin,
  (req, res) => {
    const token =
      req.headers.authorization.replace(
        "Bearer ",
        ""
      );

    adminTokens.delete(token);

    res.json({
      success: true,
      message: "تم تسجيل الخروج",
    });
  }
);

/* =================================================
   CREATE BOOKING
   DAY ONLY
================================================= */

app.post("/api/bookings", (req, res) => {
  try {
    const booking = req.body || {};

    console.log("");
    console.log("=================================");
    console.log("NEW BOOKING REQUEST");
    console.log("BOOKING DATA:", booking);
    console.log("=================================");

    const bookings = getBookings();

    const cleanName = String(
      booking.name || ""
    ).trim();

    const cleanPhone = String(
      booking.phone || ""
    ).trim();

    const cleanSpecialty = String(
      booking.specialty || ""
    ).trim();

    const cleanDoctor = String(
      booking.doctor || ""
    ).trim();

    const cleanDate = String(
      booking.date || ""
    ).trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message:
          "من فضلك اكتب الاسم بالكامل",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message:
          "من فضلك اكتب رقم الهاتف",
      });
    }

    if (!cleanSpecialty) {
      return res.status(400).json({
        success: false,
        message:
          "من فضلك اختر التخصص",
      });
    }

    if (!cleanDoctor) {
      return res.status(400).json({
        success: false,
        message:
          "من فضلك اختر الطبيب",
      });
    }

    if (!cleanDate) {
      return res.status(400).json({
        success: false,
        message:
          "من فضلك اختر يوم الحجز",
      });
    }

    if (!/^01[0-9]{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقمًا",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return res.status(400).json({
        success: false,
        message:
          "التاريخ غير صحيح",
      });
    }

    const bookingDate = new Date(
      `${cleanDate}T00:00:00`
    );

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "التاريخ غير صحيح",
      });
    }

    const doctors = getDoctors();

    let selectedDoctor = doctors.find(
      (doctor) =>
        String(doctor.name || "").trim() ===
        cleanDoctor
    );

    if (!selectedDoctor) {
      selectedDoctor = doctors.find(
        (doctor) =>
          String(doctor.name || "")
            .replace(/^د\.\s*/, "")
            .trim() === cleanDoctor
      );
    }

    if (!selectedDoctor) {
      return res.status(404).json({
        success: false,
        message:
          "الطبيب غير موجود في قاعدة البيانات",
      });
    }

    if (
      String(selectedDoctor.specialty || "")
        .trim() !== cleanSpecialty
    ) {
      return res.status(400).json({
        success: false,
        message:
          "التخصص لا يطابق تخصص الطبيب المختار",
      });
    }

    const doctorWorkDays =
      Array.isArray(selectedDoctor.workDays)
        ? [
            ...new Set(
              selectedDoctor.workDays
                .map(Number)
                .filter(
                  (day) =>
                    Number.isInteger(day) &&
                    day >= 0 &&
                    day <= 6
                )
            ),
          ]
        : [];

    const day =
      bookingDate.getDay();

    if (!doctorWorkDays.includes(day)) {
      return res.status(409).json({
        success: false,
        message:
          "الطبيب لا يعمل في هذا اليوم",
      });
    }

    const unavailableDates =
      Array.isArray(
        selectedDoctor.unavailableDates
      )
        ? selectedDoctor.unavailableDates.map(
            (item) => String(item).trim()
          )
        : [];

    if (
      unavailableDates.includes(cleanDate)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "هذا اليوم مغلق للحجز عند الطبيب",
      });
    }

    const phoneAlreadyBooked =
      bookings.some(
        (item) =>
          String(item.phone || "").trim() ===
            cleanPhone &&
          String(item.date || "").trim() ===
            cleanDate &&
          item.status !== "cancelled"
      );

    if (phoneAlreadyBooked) {
      return res.status(409).json({
        success: false,
        message:
          "هذا الرقم لديه حجز بالفعل في هذا اليوم",
      });
    }

    const todayBookings =
      bookings.filter(
        (item) =>
          String(item.doctor || "").trim() ===
            String(
              selectedDoctor.name || ""
            ).trim() &&
          String(item.date || "").trim() ===
            cleanDate &&
          item.status !== "cancelled"
      );

    const queueNumber =
      todayBookings.length + 1;

    const doctorArrivalTime =
      String(
        selectedDoctor.arrivalTime ||
          "10:00 ص"
      ).trim();

    const newBooking = {
      id: Date.now(),

      name: cleanName,

      phone: cleanPhone,

      specialty: cleanSpecialty,

      doctor: selectedDoctor.name,

      date: cleanDate,

      time: "",

      queueNumber,

      doctorArrivalTime,

      status: "جديد",

      createdAt:
        new Date().toISOString(),
    };

    bookings.push(newBooking);

    saveBookings(bookings);

    console.log(
      "NEW BOOKING SAVED:",
      newBooking
    );

    return res.status(201).json({
      success: true,
      message:
        "تم تسجيل الحجز بنجاح",

      booking: newBooking,

      queueNumber,

      doctorArrivalTime,
    });
  } catch (error) {
    console.error(
      "CREATE BOOKING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "حدث خطأ أثناء تسجيل الحجز",
    });
  }
});

/* =================================================
   GET BOOKINGS - ADMIN
================================================= */

app.get(
  "/api/bookings",
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      bookings: getBookings(),
    });
  }
);

/* =================================================
   BOOKING TRACKING
================================================= */

app.get(
  "/api/bookings/track",
  (req, res) => {
    try {
      const phone = String(
        req.query.phone || ""
      ).trim();

      if (!/^01[0-9]{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقمًا",
        });
      }

      const bookings = getBookings();

      const doctors = getDoctors();

      const patientBookings =
        bookings
          .filter(
            (booking) =>
              String(
                booking.phone || ""
              ).trim() === phone &&
              booking.status !==
                "cancelled"
          )
          .map(
            (booking) => {
              const beforeBookings =
                bookings.filter(
                  (item) =>
                    String(
                      item.doctor || ""
                    ).trim() ===
                      String(
                        booking.doctor || ""
                      ).trim() &&
                    String(
                      item.date || ""
                    ).trim() ===
                      String(
                        booking.date || ""
                      ).trim() &&
                    item.status ===
                      "جديد" &&
                    Number(
                      item.queueNumber
                    ) <
                      Number(
                        booking.queueNumber
                      )
                );

              const beforeCount =
                beforeBookings.length;

              const currentPosition =
                beforeCount + 1;

              const doctor =
                doctors.find(
                  (item) =>
                    String(
                      item.name || ""
                    ).trim() ===
                      String(
                        booking.doctor || ""
                      ).trim()
                );

              const doctorArrivalTime =
                String(
                  doctor?.arrivalTime ||
                    booking.doctorArrivalTime ||
                    "10:00 ص"
                ).trim();

              return {
                ...booking,

                currentPosition,

                beforeCount,

                doctorArrivalTime,
              };
            }
          );

      if (
        patientBookings.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "لا يوجد حجز بهذا الرقم",
        });
      }

      return res.json({
        success: true,
        bookings:
          patientBookings,
      });
    } catch (error) {
      console.error(
        "TRACK BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء متابعة الحجز",
      });
    }
  }
);

/* =================================================
   CONFIRM BOOKING
================================================= */

app.post(
  "/api/bookings/:id/confirm",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const bookings =
        getBookings();

      const booking =
        bookings.find(
          (item) =>
            item.id === id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "الحجز غير موجود",
        });
               if (
        booking.status ===
        "confirmed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "هذا الحجز مؤكد بالفعل",
        });
      }

      if (
        booking.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "لا يمكن تأكيد حجز ملغي",
        });
      }

      booking.status =
        "confirmed";

      booking.confirmedAt =
        new Date().toISOString();

      const doctor =
        getDoctors().find(
          (item) =>
            String(
              item.name || ""
            ).trim() ===
              String(
                booking.doctor || ""
              ).trim()
        );

      if (doctor) {
        booking.doctorArrivalTime =
          String(
            doctor.arrivalTime ||
              booking.doctorArrivalTime ||
              "10:00 ص"
          ).trim();
      }

      saveBookings(bookings);

      res.json({
        success: true,
        message:
          "تم تأكيد الحجز بنجاح",
        booking,
      });
    } catch (error) {
      console.error(
        "CONFIRM ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تأكيد الحجز",
      });
    }
  }
);

/* =================================================
   CANCEL BOOKING
================================================= */

app.post(
  "/api/bookings/:id/cancel",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const bookings =
        getBookings();

      const booking =
        bookings.find(
          (item) =>
            item.id === id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "الحجز غير موجود",
        });
      }

      booking.status =
        "cancelled";

      booking.cancelledAt =
        new Date().toISOString();

      saveBookings(bookings);

      res.json({
        success: true,
        message:
          "تم إلغاء الحجز بنجاح",
        booking,
      });
    } catch (error) {
      console.error(
        "CANCEL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إلغاء الحجز",
      });
    }
  }
);

/* =================================================
   DELETE BOOKING
================================================= */

app.delete(
  "/api/bookings/:id",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const bookings =
        getBookings();

      const newBookings =
        bookings.filter(
          (booking) =>
            booking.id !== id
        );

      if (
        newBookings.length ===
        bookings.length
      ) {
        return res.status(404).json({
          success: false,
          message:
            "الحجز غير موجود",
        });
      }

      saveBookings(newBookings);

      res.json({
        success: true,
        message:
          "تم حذف الحجز بنجاح",
      });
    } catch (error) {
      console.error(
        "DELETE BOOKING ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف الحجز",
      });
    }
  }
);

/* =================================================
   RESULTS SEARCH
================================================= */

app.get(
  "/api/results/search",
  (req, res) => {
    try {
      const phone = String(
        req.query.phone || ""
      ).trim();

      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "من فضلك أدخل رقم الهاتف",
        });
      }

      if (!/^01[0-9]{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقمًا",
        });
      }

      const results =
        getResults();

      const patientResults =
        results.filter(
          (result) =>
            result.phone === phone
        );

      if (!patientResults.length) {
        return res.status(404).json({
          success: false,
          message:
            "لا توجد نتيجة تحاليل مسجلة لهذا الرقم",
        });
      }

      res.json({
        success: true,
        message:
          "تم العثور على النتائج",
        results:
          patientResults,
      });
    } catch (error) {
      console.error(
        "SEARCH RESULTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء البحث عن النتيجة",
      });
    }
  }
);

/* =================================================
   OPEN RESULT PDF
================================================= */

app.get(
  "/api/results/file/:fileName",
  (req, res) => {
    try {
      const fileName =
        path.basename(
          req.params.fileName
        );

      const filePath =
        path.join(
          resultsFolder,
          fileName
        );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message:
            "ملف النتيجة غير موجود",
        });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error(
        "RESULT FILE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء فتح ملف النتيجة",
      });
    }
  }
);

/* =================================================
   GET RESULTS ADMIN
================================================= */

app.get(
  "/api/admin/results",
  requireAdmin,
  (req, res) => {
    try {
      const results =
        getResults();

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      console.error(
        "GET RESULTS ADMIN ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء جلب النتائج",
      });
    }
  }
);

/* =================================================
   UPLOAD RESULT
================================================= */

app.post(
  "/api/admin/results",
  requireAdmin,
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "من فضلك اختر ملف PDF",
        });
      }

      const patientName =
        String(
          req.body.patientName ||
            req.body.name ||
            ""
        ).trim();

      const phone =
        String(
          req.body.phone || ""
        ).trim();

      const title =
        String(
          req.body.title ||
            "نتيجة تحليل"
        ).trim();

      if (!patientName) {
        fs.unlinkSync(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "من فضلك أدخل اسم المريض",
        });
      }

      if (!/^01[0-9]{9}$/.test(phone)) {
        fs.unlinkSync(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقمًا",
        });
      }

      const results =
        getResults();

      const result = {
        id: Date.now(),

        patientName,

        name: patientName,

        phone,

        title,

        fileName:
          req.file.filename,

        originalName:
          req.file.originalname,

        createdAt:
          new Date().toISOString(),
      };

      results.push(result);

      saveResults(results);

      res.status(201).json({
        success: true,
        message:
          "تم رفع النتيجة بنجاح",
        result,
      });
    } catch (error) {
      console.error(
        "UPLOAD RESULT ERROR:",
        error
      );

      if (
        req.file &&
        req.file.path &&
        fs.existsSync(
          req.file.path
        )
      ) {
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch (deleteError) {
          console.error(
            "DELETE UPLOADED FILE ERROR:",
            deleteError
          );
        }
      }

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء رفع النتيجة",
      });
    }
  }
);

/* =================================================
   DELETE RESULT
================================================= */

app.delete(
  "/api/admin/results/:id",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const results =
        getResults();

      const result =
        results.find(
          (item) =>
            item.id === id
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "النتيجة غير موجودة",
        });
      }

      if (result.fileName) {
        const filePath =
          path.join(
            resultsFolder,
            path.basename(
              result.fileName
            )
          );

        if (
          fs.existsSync(filePath)
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      }

      const newResults =
        results.filter(
          (item) =>
            item.id !== id
        );

      saveResults(newResults);

      res.json({
        success: true,
        message:
          "تم حذف النتيجة بنجاح",
      });
    } catch (error) {
      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف النتيجة",
      });
    }
  }
);

/* =================================================
   REVIEWS
================================================= */

app.get(
  "/api/reviews",
  (req, res) => {
    try {
      const reviews =
        getReviews();

      res.json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error(
        "GET REVIEWS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء جلب التقييمات",
      });
    }
  }
);

app.post(
  "/api/reviews",
  (req, res) => {
    try {
      const name =
        String(
          req.body.name || ""
        ).trim();

      const rating =
        Number(
          req.body.rating
        );

      const comment =
        String(
          req.body.comment || ""
        ).trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "من فضلك اكتب اسمك",
        });
      }

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "التقييم يجب أن يكون من 1 إلى 5",
        });
      }

      if (!comment) {
        return res.status(400).json({
          success: false,
          message:
            "من فضلك اكتب تعليقك",
        });
      }

      const reviews =
        getReviews();

      const review = {
        id: Date.now(),

        name,

        rating,

        comment,

        createdAt:
          new Date().toISOString(),
      };

      reviews.push(review);

      saveReviews(reviews);

      res.status(201).json({
        success: true,
        message:
          "تم إرسال تقييمك بنجاح",
        review,
      });
    } catch (error) {
      console.error(
        "CREATE REVIEW ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إرسال التقييم",
      });
    }
  }
);
app.post(
  "/api/reviews",
  (req, res) => {
    try {
      const {
        name,
        rating,
        text,
      } = req.body || {};

      if (
        !name ||
        !text ||
        rating === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "من فضلك أكمل بيانات التقييم",
        });
      }

      const cleanName =
        String(name).trim();

      const cleanText =
        String(text).trim();

      const numericRating =
        Number(rating);

      if (
        !cleanName ||
        !cleanText
      ) {
        return res.status(400).json({
          success: false,
          message:
            "الاسم والتقييم مطلوبان",
        });
      }

      if (
        !Number.isInteger(
          numericRating
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "التقييم يجب أن يكون من 1 إلى 5 نجوم",
        });
      }

      const reviews =
        getReviews();

      const newReview = {
        id: Date.now(),
        name: cleanName,
        rating: numericRating,
        text: cleanText,
        createdAt:
          new Date().toISOString(),
      };

      reviews.unshift(
        newReview
      );

      saveReviews(reviews);

      res.status(201).json({
        success: true,
        message:
          "تم إضافة تقييمك بنجاح",
        review:
          newReview,
      });
    } catch (error) {
      console.error(
        "ADD REVIEW ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إضافة التقييم",
      });
    }
  }
);

app.delete(
  "/api/reviews/:id",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const reviews =
        getReviews();

      const newReviews =
        reviews.filter(
          (item) =>
            item.id !== id
        );

      if (
        newReviews.length ===
        reviews.length
      ) {
        return res.status(404).json({
          success: false,
          message:
            "التقييم غير موجود",
        });
      }

      saveReviews(newReviews);

      res.json({
        success: true,
        message:
          "تم حذف التقييم بنجاح",
      });
    } catch (error) {
      console.error(
        "DELETE REVIEW ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف التقييم",
      });
    }
  }
);

/* =================================================
   GET DOCTORS
================================================= */

app.get(
  "/api/doctors",
  (req, res) => {
    res.json({
      success: true,
      doctors:
        getDoctors(),
    });
  }
);

/* =================================================
   ADD DOCTOR
================================================= */

app.post(
  "/api/doctors",
  requireAdmin,
  (req, res) => {
    try {
      const {
        name,
        specialty,
        workDays,
        times,
        arrivalTime,
        unavailableDates,
      } = req.body || {};

      if (!name || !specialty) {
        return res.status(400).json({
          success: false,
          message:
            "اسم الطبيب والتخصص مطلوبان",
        });
      }

      const doctors =
        getDoctors();

      const newDoctor = {
        id: Date.now(),

        name:
          String(name).trim(),

        specialty:
          String(specialty).trim(),

        arrivalTime:
          String(
            arrivalTime ||
              "10:00 ص"
          ).trim(),

        workDays:
          Array.isArray(workDays)
            ? [
                ...new Set(
                  workDays.map(Number)
                ),
              ].filter(
                (day) =>
                  Number.isInteger(day) &&
                  day >= 0 &&
                  day <= 6
              )
            : [],

        unavailableDates:
          Array.isArray(
            unavailableDates
          )
            ? [
                ...new Set(
                  unavailableDates.map(
                    String
                  )
                ),
              ]
            : [],

        times:
          Array.isArray(times)
            ? [
                ...new Set(
                  times.map(String)
                ),
              ]
            : [],
      };

      doctors.push(
        newDoctor
      );

      saveDoctors(
        doctors
      );

      res.status(201).json({
        success: true,
        message:
          "تم إضافة الطبيب بنجاح",
        doctor:
          newDoctor,
      });
    } catch (error) {
      console.error(
        "ADD DOCTOR ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إضافة الطبيب",
      });
    }
  }
);

/* =================================================
   UPDATE DOCTOR
   ARRIVAL TIME IS SAVED HERE
================================================= */

app.put(
  "/api/doctors/:id",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const doctors =
        getDoctors();

      const doctor =
        doctors.find(
          (item) =>
            item.id === id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            "الطبيب غير موجود",
        });
      }

      const body =
        req.body || {};

      console.log(
        "UPDATE DOCTOR BODY:",
        body
      );

      if (
        body.name !==
        undefined
      ) {
        doctor.name =
          String(
            body.name
          ).trim();
      }

      if (
        body.specialty !==
        undefined
      ) {
        doctor.specialty =
          String(
            body.specialty
          ).trim();
      }

      if (
        Array.isArray(
          body.workDays
        )
      ) {
        doctor.workDays =
          [
            ...new Set(
              body.workDays.map(
                Number
              )
            ),
          ].filter(
            (day) =>
              Number.isInteger(
                day
              ) &&
              day >= 0 &&
              day <= 6
          );
      }

      if (
        body.arrivalTime !==
        undefined
      ) {
        const cleanArrivalTime =
          String(
            body.arrivalTime
          ).trim();

        if (
          cleanArrivalTime
        ) {
          doctor.arrivalTime =
            cleanArrivalTime;
        }
      }

      if (!doctor.arrivalTime) {
        doctor.arrivalTime =
          "10:00 ص";
      }

      if (
        Array.isArray(
          body.times
        )
      ) {
        doctor.times =
          [
            ...new Set(
              body.times.map(
                String
              )
            ),
          ];
      }

      if (
        Array.isArray(
          body.unavailableDates
        )
      ) {
        doctor.unavailableDates =
          [
            ...new Set(
              body.unavailableDates.map(
                String
              )
            ),
          ];
      }

      saveDoctors(
        doctors
      );

      res.json({
        success: true,
        message:
          "تم تحديث بيانات الطبيب بنجاح",
        doctor,
      });
    } catch (error) {
      console.error(
        "UPDATE DOCTOR ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تحديث الطبيب",
      });
    }
  }
);
      if (
        Array.isArray(
          body.unavailableDates
        )
      ) {
        doctor.unavailableDates =
          [
            ...new Set(
              body.unavailableDates
                .map(
                  (date) =>
                    String(
                      date
                    ).trim()
                )
                .filter(
                  (date) =>
                    /^\d{4}-\d{2}-\d{2}$/.test(
                      date
                    )
                )
            ),
          ];
      }

      saveDoctors(
        doctors
      );

      console.log(
        "✅ DOCTOR SAVED:",
        doctor
      );

      return res.json({
        success: true,
        message:
          "تم تعديل بيانات الطبيب بنجاح",
        doctor,
      });
    } catch (error) {
      console.error(
        "UPDATE DOCTOR ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تعديل الطبيب",
      });
    }
  }
);

/* =================================================
   UNAVAILABLE DATE
================================================= */

app.post(
  "/api/doctors/:id/unavailable-date",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const date =
        String(
          req.body.date || ""
        ).trim();

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          date
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "صيغة التاريخ غير صحيحة",
        });
      }

      const doctors =
        getDoctors();

      const doctor =
        doctors.find(
          (item) =>
            item.id === id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            "الطبيب غير موجود",
        });
      }

      if (
        !Array.isArray(
          doctor.unavailableDates
        )
      ) {
        doctor.unavailableDates =
          [];
      }

      if (
        !doctor.unavailableDates.includes(
          date
        )
      ) {
        doctor.unavailableDates.push(
          date
        );
      }

      saveDoctors(
        doctors
      );

      res.json({
        success: true,
        message:
          "تم إغلاق هذا اليوم فقط",
        doctor,
      });
    } catch (error) {
      console.error(
        "ADD UNAVAILABLE DATE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إغلاق اليوم",
      });
    }
  }
);

/* =================================================
   REMOVE UNAVAILABLE DATE
================================================= */

app.delete(
  "/api/doctors/:id/unavailable-date/:date",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const date =
        String(
          req.params.date
        ).trim();

      const doctors =
        getDoctors();

      const doctor =
        doctors.find(
          (item) =>
            item.id === id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            "الطبيب غير موجود",
        });
      }

      if (
        !Array.isArray(
          doctor.unavailableDates
        )
      ) {
        doctor.unavailableDates =
          [];
      }

      doctor.unavailableDates =
        doctor.unavailableDates.filter(
          (item) =>
            item !== date
        );

      saveDoctors(
        doctors
      );

      res.json({
        success: true,
        message:
          "تم فتح هذا اليوم",
        doctor,
      });
    } catch (error) {
      console.error(
        "REMOVE UNAVAILABLE DATE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء فتح اليوم",
      });
    }
  }
);

/* =================================================
   DELETE DOCTOR
================================================= */

app.delete(
  "/api/doctors/:id",
  requireAdmin,
  (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const doctors =
        getDoctors();

      const newDoctors =
        doctors.filter(
          (doctor) =>
            doctor.id !== id
        );

      if (
        newDoctors.length ===
        doctors.length
      ) {
        return res.status(404).json({
          success: false,
          message:
            "الطبيب غير موجود",
        });
      }

      saveDoctors(
        newDoctors
      );

      res.json({
        success: true,
        message:
          "تم حذف الطبيب بنجاح",
      });
    } catch (error) {
      console.error(
        "DELETE DOCTOR ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف الطبيب",
      });
    }
  }
);

/* =================================================
   404
================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API endpoint not found",
      path:
        req.originalUrl,
    });
  }
);

/* =================================================
   ERROR HANDLER
================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "حجم ملف PDF يجب ألا يتجاوز 10MB",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "حدث خطأ أثناء رفع الملف",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "حدث خطأ في السيرفر",
    });
  }
);

/* =================================================
   START
================================================= */

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
