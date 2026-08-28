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
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://192.168.1.5:5173",
  "http://192.168.1.5:5174",
  "http://192.168.1.5:5175",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(
    process.env.FRONTEND_URL.replace(/\/$/, "")
  );
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS: Origin not allowed")
      );
    },
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* =================================================
   FILES
================================================= */

const bookingsFile = path.join(
  __dirname,
  "bookings.json"
);

const resultsFile = path.join(
  __dirname,
  "results.json"
);

const reviewsFile = path.join(
  __dirname,
  "reviews.json"
);

const doctorsFile = path.join(
  __dirname,
  "doctors.json"
);

const resultsFolder = path.join(
  __dirname,
  "results"
);

/* =================================================
   DEFAULT DOCTORS
================================================= */

const defaultDoctors = [
  {
    id: 1,
    specialty: "باطنة وقلب",
    name: "د. محمود فتحي",
    workDays: [0, 1, 3, 5],
    unavailableDates: [],
    arrivalTime: "10:00 ص",
    times: [
      "10:00 ص",
      "11:00 ص",
      "12:00 م",
      "1:00 م",
    ],
  },

  {
    id: 2,
    specialty: "باطنة وقلب",
    name: "عبدالرحمن",
    workDays: [0, 1, 2, 3, 4, 5, 6],
    unavailableDates: [],
    arrivalTime: "10:00 ص",
    times: [
      "10:00 ص",
      "11:00 ص",
      "12:00 م",
      "1:00 م",
      "2:00 م",
      "3:00 م",
    ],
  },

  {
    id: 3,
    specialty: "أسنان",
    name: "د. روزا",
    workDays: [0, 1, 2, 4],
    unavailableDates: [],
    arrivalTime: "10:00 ص",
    times: [
      "10:00 ص",
      "11:00 ص",
      "12:00 م",
      "1:00 م",
    ],
  },

  {
    id: 4,
    specialty: "أسنان",
    name: "د. أحمد عطية",
    workDays: [1, 3, 5],
    unavailableDates: [],
    arrivalTime: "2:00 م",
    times: [
      "2:00 م",
      "3:00 م",
      "4:00 م",
      "5:00 م",
    ],
  },

  {
    id: 5,
    specialty: "نساء وتوليد",
    name: "د. هبة علي",
    workDays: [0, 2, 4],
    unavailableDates: [],
    arrivalTime: "10:00 ص",
    times: [
      "10:00 ص",
      "12:00 م",
      "2:00 م",
    ],
  },

  {
    id: 6,
    specialty: "أنف وأذن",
    name: "د. محمد شكري",
    workDays: [1, 3, 5],
    unavailableDates: [],
    arrivalTime: "11:00 ص",
    times: [
      "11:00 ص",
      "1:00 م",
      "3:00 م",
    ],
  },

  {
    id: 7,
    specialty: "علاج طبيعي",
    name: "جهاد أبو المجد",
    workDays: [0, 1, 2, 3, 4],
    unavailableDates: [],
    arrivalTime: "9:00 ص",
    times: [
      "9:00 ص",
      "10:00 ص",
      "11:00 ص",
      "12:00 م",
    ],
  },

  {
    id: 8,
    specialty: "عظام",
    name: "محمود الغندور",
    workDays: [0, 2, 4],
    unavailableDates: [],
    arrivalTime: "4:00 م",
    times: [
      "4:00 م",
      "5:00 م",
      "6:00 م",
      "7:00 م",
    ],
  },

  {
    id: 9,
    specialty: "جلدية",
    name: "د. أحمد",
    workDays: [1, 3, 5],
    unavailableDates: [],
    arrivalTime: "10:00 ص",
    times: [
      "10:00 ص",
      "12:00 م",
      "2:00 م",
    ],
  },
];

/* =================================================
   CREATE FILES
================================================= */

function createFileIfMissing(file, defaultData = []) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(defaultData, null, 2),
      "utf8"
    );
  }
}

createFileIfMissing(bookingsFile);
createFileIfMissing(resultsFile);
createFileIfMissing(reviewsFile);

if (!fs.existsSync(doctorsFile)) {
  fs.writeFileSync(
    doctorsFile,
    JSON.stringify(defaultDoctors, null, 2),
    "utf8"
  );
}

if (!fs.existsSync(resultsFolder)) {
  fs.mkdirSync(resultsFolder, {
    recursive: true,
  });
}

/* =================================================
   JSON HELPERS
================================================= */

function readJson(file) {
  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch (error) {
    console.error("READ JSON ERROR:", error);
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function getBookings() {
  return readJson(bookingsFile);
}

function saveBookings(data) {
  writeJson(bookingsFile, data);
}

function getResults() {
  return readJson(resultsFile);
}

function saveResults(data) {
  writeJson(resultsFile, data);
}

function getReviews() {
  return readJson(reviewsFile);
}

function saveReviews(data) {
  writeJson(reviewsFile, data);
}

/* =================================================
   GET DOCTORS
   AUTO FIX OLD DOCTORS
================================================= */

function getDoctors() {
  const doctors = readJson(doctorsFile);

  let changed = false;

  const fixedDoctors = doctors.map((doctor) => {
    let arrivalTime = String(
      doctor.arrivalTime || ""
    ).trim();

    /*
      لو الطبيب قديم ومفيش له وقت:
      نضع وقت افتراضي ونحفظه.
    */
    if (!arrivalTime) {
      arrivalTime = "10:00 ص";
      changed = true;
    }

    const fixedDoctor = {
      ...doctor,

      workDays: Array.isArray(
        doctor.workDays
      )
        ? doctor.workDays
        : [],

      unavailableDates: Array.isArray(
        doctor.unavailableDates
      )
        ? doctor.unavailableDates
        : [],

      arrivalTime,

      times: Array.isArray(
        doctor.times
      )
        ? doctor.times
        : [],
    };

    return fixedDoctor;
  });

  if (changed) {
    writeJson(
      doctorsFile,
      fixedDoctors
    );

    console.log(
      "✅ تم حفظ أوقات حضور الأطباء تلقائيًا"
    );
  }

  return fixedDoctors;
}

function saveDoctors(data) {
  writeJson(doctorsFile, data);
}

/* =================================================
   ADMIN
================================================= */

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "mabra@666";

const adminTokens = new Set();

function requireAdmin(req, res, next) {
  const authHeader =
    req.headers.authorization || "";

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "غير مصرح لك بالدخول",
    });
  }

  const token = authHeader.replace(
    "Bearer ",
    ""
  );

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "جلسة الدخول غير صالحة",
    });
  }

  next();
}

/* =================================================
   MULTER
================================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resultsFolder);
  },

  filename: function (req, file, cb) {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `result-${Date.now()}-${crypto
        .randomBytes(6)
        .toString("hex")}${extension}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      extension !== ".pdf" ||
      file.mimetype !== "application/pdf"
    ) {
      return cb(
        new Error("يسمح برفع ملفات PDF فقط")
      );
    }

    cb(null, true);
  },
});

/* =================================================
   HOME
================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mabraf Al-Falaki API is running",
    status: "online",
    port: PORT,
  });
});

/* =================================================
   HEALTH
================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    status: "online",
    time: new Date().toISOString(),
  });
});

/* =================================================
   ADMIN LOGIN
================================================= */

app.post("/api/admin/login", (req, res) => {
  const {
    username,
    password,
  } = req.body || {};

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

      /*
        مهم جدًا:
        نقرأ الدكاترة الحاليين في كل متابعة
        علشان نجيب الوقت الحالي مباشرة.
      */
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
      }

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
  "/api/results",
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      results:
        getResults(),
    });
  }
);

/* =================================================
   UPLOAD RESULT
================================================= */

app.post(
  "/api/results/upload",
  requireAdmin,
  upload.single("file"),
  (req, res) => {
    try {
      const patientName =
        String(
          req.body.patientName ||
            ""
        ).trim();

      const phone =
        String(
          req.body.phone ||
            ""
        ).trim();

      if (
        !patientName ||
        !phone
      ) {
        if (req.file) {
          fs.unlinkSync(
            req.file.path
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "اسم المريض ورقم الهاتف مطلوبان",
        });
      }

      if (
        !/^01[0-9]{9}$/.test(
          phone
        )
      ) {
        if (req.file) {
          fs.unlinkSync(
            req.file.path
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "رقم الهاتف غير صحيح",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "من فضلك اختر ملف PDF",
        });
      }

      const results =
        getResults();

      const newResult = {
        id: Date.now(),

        patientName,

        phone,

        fileName:
          req.file.filename,

        originalFileName:
          req.file.originalname,

        fileSize:
          req.file.size,

        createdAt:
          new Date().toISOString(),
      };

      results.push(newResult);

      saveResults(results);

      res.status(201).json({
        success: true,
        message:
          "تم رفع نتيجة التحليل بنجاح",
        result:
          newResult,
      });
    } catch (error) {
      console.error(
        "UPLOAD RESULT ERROR:",
        error
      );

      if (req.file) {
        try {
          if (
            fs.existsSync(
              req.file.path
            )
          ) {
            fs.unlinkSync(
              req.file.path
            );
          }
        } catch {}
      }

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "حدث خطأ أثناء رفع نتيجة التحليل",
      });
    }
  }
);

/* =================================================
   DELETE RESULT
================================================= */

app.delete(
  "/api/results/:id",
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
            "نتيجة التحليل غير موجودة",
        });
      }

      const newResults =
        results.filter(
          (item) =>
            item.id !== id
        );

      const filePath =
        path.join(
          resultsFolder,
          path.basename(
            result.fileName
          )
        );

      if (
        fs.existsSync(
          filePath
        )
      ) {
        fs.unlinkSync(
          filePath
        );
      }

      saveResults(newResults);

      res.json({
        success: true,
        message:
          "تم حذف نتيجة التحليل بنجاح",
      });
    } catch (error) {
      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف نتيجة التحليل",
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
    res.json({
      success: true,
      reviews:
        getReviews(),
    });
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

      doctor.unavailableDates =
        Array.isArray(
          doctor.unavailableDates
        )
          ? doctor.unavailableDates.filter(
              (item) =>
                item !== date
            )
          : [];

      saveDoctors(
        doctors
      );

      res.json({
        success: true,
        message:
          "تم فتح اليوم مرة أخرى",
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

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");
    console.log(
      "================================="
    );
    console.log(
      "MABRAF AL-FALAKI BACKEND"
    );
    console.log(
      "================================="
    );
    console.log(
      `Server running on port ${PORT}`
    );
    console.log(
      "Booking API: ENABLED"
    );
    console.log(
      "Booking Tracking: ENABLED"
    );
    console.log(
      "Doctor Arrival Time: ENABLED"
    );
    console.log(
      "PDF Upload: ENABLED"
    );
    console.log(
      "Reviews API: ENABLED"
    );
    console.log(
      "Doctors Management: ENABLED"
    );
    console.log(
      "================================="
    );
  }
);