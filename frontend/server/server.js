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
    specialty: "Ø¨Ø§Ø·Ù†Ø© ÙˆÙ‚Ù„Ø¨",
    name: "Ø¯. Ù…Ø­Ù…ÙˆØ¯ ÙØªØ­ÙŠ",
    workDays: [0, 1, 3, 5],
    unavailableDates: [],
    arrivalTime: "10:00 Øµ",
    times: [
      "10:00 Øµ",
      "11:00 Øµ",
      "12:00 Ù…",
      "1:00 Ù…",
    ],
  },

  {
    id: 2,
    specialty: "Ø¨Ø§Ø·Ù†Ø© ÙˆÙ‚Ù„Ø¨",
    name: "Ø¹Ø¨Ø¯Ø§Ù„Ø±Ø­Ù…Ù†",
    workDays: [0, 1, 2, 3, 4, 5, 6],
    unavailableDates: [],
    arrivalTime: "10:00 Øµ",
    times: [
      "10:00 Øµ",
      "11:00 Øµ",
      "12:00 Ù…",
      "1:00 Ù…",
      "2:00 Ù…",
      "3:00 Ù…",
    ],
  },

  {
    id: 3,
    specialty: "Ø£Ø³Ù†Ø§Ù†",
    name: "Ø¯. Ø±ÙˆØ²Ø§",
    workDays: [0, 1, 2, 4],
    unavailableDates: [],
    arrivalTime: "10:00 Øµ",
    times: [
      "10:00 Øµ",
      "11:00 Øµ",
      "12:00 Ù…",
      "1:00 Ù…",
    ],
  },

  {
    id: 4,
    specialty: "Ø£Ø³Ù†Ø§Ù†",
    name: "Ø¯. Ø£Ø­Ù…Ø¯ Ø¹Ø·ÙŠØ©",
    workDays: [1, 3, 5],
    unavailableDates: [],
    arrivalTime: "2:00 Ù…",
    times: [
      "2:00 Ù…",
      "3:00 Ù…",
      "4:00 Ù…",
      "5:00 Ù…",
    ],
  },

  {
    id: 5,
    specialty: "Ù†Ø³Ø§Ø¡ ÙˆØªÙˆÙ„ÙŠØ¯",
    name: "Ø¯. Ù‡Ø¨Ø© Ø¹Ù„ÙŠ",
    workDays: [0, 2, 4],
    unavailableDates: [],
    arrivalTime: "10:00 Øµ",
    times: [
      "10:00 Øµ",
      "12:00 Ù…",
      "2:00 Ù…",
    ],
  },

  {
    id: 6,
    specialty: "Ø£Ù†Ù ÙˆØ£Ø°Ù†",
    name: "Ø¯. Ù…Ø­Ù…Ø¯ Ø´ÙƒØ±ÙŠ",
    workDays: [1, 3, 5],
    unavailableDates: [],
    arrivalTime: "11:00 Øµ",
    times: [
      "11:00 Øµ",
      "1:00 Ù…",
      "3:00 Ù…",
    ],
  },

  {
    id: 7,
    specialty: "Ø¹Ù„Ø§Ø¬ Ø·Ø¨ÙŠØ¹ÙŠ",
    name: "Ø¬Ù‡Ø§Ø¯ Ø£Ø¨Ùˆ Ø§Ù„Ù…Ø¬Ø¯",
    workDays: [0, 1, 2, 3, 4],
    unavailableDates: [],
    arrivalTime: "9:00 Øµ",
    times: [
      "9:00 Øµ",
      "10:00 Øµ",
      "11:00 Øµ",
      "12:00 Ù…",
    ],
  },

  {
    id: 8,
    specialty: "Ø¹Ø¸Ø§Ù…",
    name: "Ù…Ø­Ù…ÙˆØ¯ Ø§Ù„ØºÙ†Ø¯ÙˆØ±",
    workDays: [0, 2, 4],
    unavailableDates: [],
    arrivalTime: "4:00 Ù…",
    times: [
      "4:00 Ù…",
      "5:00 Ù…",
      "6:00 Ù…",
      "7:00 Ù…",
    ],
  },

  {
    id: 9,
    specialty: "Ø¬Ù„Ø¯ÙŠØ©",
    name: "Ø¯. Ø£Ø­Ù…Ø¯",
    workDays: [1, 3, 5],
    unavailableDates: [],
    arrivalTime: "10:00 Øµ",
    times: [
      "10:00 Øµ",
      "12:00 Ù…",
      "2:00 Ù…",
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
      Ù„Ùˆ Ø§Ù„Ø·Ø¨ÙŠØ¨ Ù‚Ø¯ÙŠÙ… ÙˆÙ…ÙÙŠØ´ Ù„Ù‡ ÙˆÙ‚Øª:
      Ù†Ø¶Ø¹ ÙˆÙ‚Øª Ø§ÙØªØ±Ø§Ø¶ÙŠ ÙˆÙ†Ø­ÙØ¸Ù‡.
    */
    if (!arrivalTime) {
      arrivalTime = "10:00 Øµ";
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
      "âœ… ØªÙ… Ø­ÙØ¸ Ø£ÙˆÙ‚Ø§Øª Ø­Ø¶ÙˆØ± Ø§Ù„Ø£Ø·Ø¨Ø§Ø¡ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§"
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
      message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ Ø¨Ø§Ù„Ø¯Ø®ÙˆÙ„",
    });
  }

  const token = authHeader.replace(
    "Bearer ",
    ""
  );

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Ø¬Ù„Ø³Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ ØºÙŠØ± ØµØ§Ù„Ø­Ø©",
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
        new Error("ÙŠØ³Ù…Ø­ Ø¨Ø±ÙØ¹ Ù…Ù„ÙØ§Øª PDF ÙÙ‚Ø·")
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
        "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©",
    });
  }

  const token = crypto
    .randomBytes(32)
    .toString("hex");

  adminTokens.add(token);

  res.json({
    success: true,
    message: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­",
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
      message: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬",
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
          "Ù…Ù† ÙØ¶Ù„Ùƒ Ø§ÙƒØªØ¨ Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„ÙƒØ§Ù…Ù„",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Ù…Ù† ÙØ¶Ù„Ùƒ Ø§ÙƒØªØ¨ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ",
      });
    }

    if (!cleanSpecialty) {
      return res.status(400).json({
        success: false,
        message:
          "Ù…Ù† ÙØ¶Ù„Ùƒ Ø§Ø®ØªØ± Ø§Ù„ØªØ®ØµØµ",
      });
    }

    if (!cleanDoctor) {
      return res.status(400).json({
        success: false,
        message:
          "Ù…Ù† ÙØ¶Ù„Ùƒ Ø§Ø®ØªØ± Ø§Ù„Ø·Ø¨ÙŠØ¨",
      });
    }

    if (!cleanDate) {
      return res.status(400).json({
        success: false,
        message:
          "Ù…Ù† ÙØ¶Ù„Ùƒ Ø§Ø®ØªØ± ÙŠÙˆÙ… Ø§Ù„Ø­Ø¬Ø²",
      });
    }

    if (!/^01[0-9]{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 01 ÙˆÙŠÙƒÙˆÙ† 11 Ø±Ù‚Ù…Ù‹Ø§",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return res.status(400).json({
        success: false,
        message:
          "Ø§Ù„ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ­ÙŠØ­",
      });
    }

    const bookingDate = new Date(
      `${cleanDate}T00:00:00`
    );

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "Ø§Ù„ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ­ÙŠØ­",
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
            .replace(/^Ø¯\.\s*/, "")
            .trim() === cleanDoctor
      );
    }

    if (!selectedDoctor) {
      return res.status(404).json({
        success: false,
        message:
          "Ø§Ù„Ø·Ø¨ÙŠØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
      });
    }

    if (
      String(selectedDoctor.specialty || "")
        .trim() !== cleanSpecialty
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Ø§Ù„ØªØ®ØµØµ Ù„Ø§ ÙŠØ·Ø§Ø¨Ù‚ ØªØ®ØµØµ Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø§Ù„Ù…Ø®ØªØ§Ø±",
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
          "Ø§Ù„Ø·Ø¨ÙŠØ¨ Ù„Ø§ ÙŠØ¹Ù…Ù„ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ÙŠÙˆÙ…",
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
          "Ù‡Ø°Ø§ Ø§Ù„ÙŠÙˆÙ… Ù…ØºÙ„Ù‚ Ù„Ù„Ø­Ø¬Ø² Ø¹Ù†Ø¯ Ø§Ù„Ø·Ø¨ÙŠØ¨",
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
          "Ù‡Ø°Ø§ Ø§Ù„Ø±Ù‚Ù… Ù„Ø¯ÙŠÙ‡ Ø­Ø¬Ø² Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ÙŠÙˆÙ…",
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
          "10:00 Øµ"
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

      status: "Ø¬Ø¯ÙŠØ¯",

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
        "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¬Ø² Ø¨Ù†Ø¬Ø§Ø­",

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
        "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¬Ø²",
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
            "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 01 ÙˆÙŠÙƒÙˆÙ† 11 Ø±Ù‚Ù…Ù‹Ø§",
        });
      }

      const bookings = getBookings();

      /*
        Ù…Ù‡Ù… Ø¬Ø¯Ù‹Ø§:
        Ù†Ù‚Ø±Ø£ Ø§Ù„Ø¯ÙƒØ§ØªØ±Ø© Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ† ÙÙŠ ÙƒÙ„ Ù…ØªØ§Ø¨Ø¹Ø©
        Ø¹Ù„Ø´Ø§Ù† Ù†Ø¬ÙŠØ¨ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ø­Ø§Ù„ÙŠ Ù…Ø¨Ø§Ø´Ø±Ø©.
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
                      "Ø¬Ø¯ÙŠØ¯" &&
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
                    "10:00 Øµ"
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
            "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø­Ø¬Ø² Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø±Ù‚Ù…",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø­Ø¬Ø²",
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
            "Ø§Ù„Ø­Ø¬Ø² ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
        });
      }

      if (
        booking.status ===
        "confirmed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Ù‡Ø°Ø§ Ø§Ù„Ø­Ø¬Ø² Ù…Ø¤ÙƒØ¯ Ø¨Ø§Ù„ÙØ¹Ù„",
        });
      }

      if (
        booking.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ£ÙƒÙŠØ¯ Ø­Ø¬Ø² Ù…Ù„ØºÙŠ",
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
              "10:00 Øµ"
          ).trim();
      }

      saveBookings(bookings);

      res.json({
        success: true,
        message:
          "ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¬Ø² Ø¨Ù†Ø¬Ø§Ø­",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¬Ø²",
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
            "Ø§Ù„Ø­Ø¬Ø² ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
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
          "ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø­Ø¬Ø² Ø¨Ù†Ø¬Ø§Ø­",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø­Ø¬Ø²",
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
            "Ø§Ù„Ø­Ø¬Ø² ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
        });
      }

      saveBookings(newBookings);

      res.json({
        success: true,
        message:
          "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø­Ø¬Ø² Ø¨Ù†Ø¬Ø§Ø­",
      });
    } catch (error) {
      console.error(
        "DELETE BOOKING ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„Ø­Ø¬Ø²",
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
            "Ù…Ù† ÙØ¶Ù„Ùƒ Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ",
        });
      }

      if (!/^01[0-9]{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 01 ÙˆÙŠÙƒÙˆÙ† 11 Ø±Ù‚Ù…Ù‹Ø§",
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
            "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªÙŠØ¬Ø© ØªØ­Ø§Ù„ÙŠÙ„ Ù…Ø³Ø¬Ù„Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø±Ù‚Ù…",
        });
      }

      res.json({
        success: true,
        message:
          "ØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù†ØªØ§Ø¦Ø¬",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ù†ØªÙŠØ¬Ø©",
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
            "Ù…Ù„Ù Ø§Ù„Ù†ØªÙŠØ¬Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ÙØªØ­ Ù…Ù„Ù Ø§Ù„Ù†ØªÙŠØ¬Ø©",
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
            "Ø§Ø³Ù… Ø§Ù„Ù…Ø±ÙŠØ¶ ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†",
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
            "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± ØµØ­ÙŠØ­",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Ù…Ù† ÙØ¶Ù„Ùƒ Ø§Ø®ØªØ± Ù…Ù„Ù PDF",
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
          "ØªÙ… Ø±ÙØ¹ Ù†ØªÙŠØ¬Ø© Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø±ÙØ¹ Ù†ØªÙŠØ¬Ø© Ø§Ù„ØªØ­Ù„ÙŠÙ„",
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
            "Ù†ØªÙŠØ¬Ø© Ø§Ù„ØªØ­Ù„ÙŠÙ„ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©",
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
          "ØªÙ… Ø­Ø°Ù Ù†ØªÙŠØ¬Ø© Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­",
      });
    } catch (error) {
      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ù†ØªÙŠØ¬Ø© Ø§Ù„ØªØ­Ù„ÙŠÙ„",
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
            "Ù…Ù† ÙØ¶Ù„Ùƒ Ø£ÙƒÙ…Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙ‚ÙŠÙŠÙ…",
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
            "Ø§Ù„Ø§Ø³Ù… ÙˆØ§Ù„ØªÙ‚ÙŠÙŠÙ… Ù…Ø·Ù„ÙˆØ¨Ø§Ù†",
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
            "Ø§Ù„ØªÙ‚ÙŠÙŠÙ… ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ù…Ù† 1 Ø¥Ù„Ù‰ 5 Ù†Ø¬ÙˆÙ…",
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
          "ØªÙ… Ø¥Ø¶Ø§ÙØ© ØªÙ‚ÙŠÙŠÙ…Ùƒ Ø¨Ù†Ø¬Ø§Ø­",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ø¶Ø§ÙØ© Ø§Ù„ØªÙ‚ÙŠÙŠÙ…",
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
            "Ø§Ù„ØªÙ‚ÙŠÙŠÙ… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
        });
      }

      saveReviews(newReviews);

      res.json({
        success: true,
        message:
          "ØªÙ… Ø­Ø°Ù Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø¨Ù†Ø¬Ø§Ø­",
      });
    } catch (error) {
      console.error(
        "DELETE REVIEW ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„ØªÙ‚ÙŠÙŠÙ…",
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
            "Ø§Ø³Ù… Ø§Ù„Ø·Ø¨ÙŠØ¨ ÙˆØ§Ù„ØªØ®ØµØµ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†",
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
              "10:00 Øµ"
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
          "ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø¨Ù†Ø¬Ø§Ø­",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø·Ø¨ÙŠØ¨",
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
            "Ø§Ù„Ø·Ø¨ÙŠØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
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
          "10:00 Øµ";
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
        "âœ… DOCTOR SAVED:",
        doctor
      );

      return res.json({
        success: true,
        message:
          "ØªÙ… ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø¨Ù†Ø¬Ø§Ø­",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø·Ø¨ÙŠØ¨",
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
            "ØµÙŠØºØ© Ø§Ù„ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ­ÙŠØ­Ø©",
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
            "Ø§Ù„Ø·Ø¨ÙŠØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
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
          "ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ù‡Ø°Ø§ Ø§Ù„ÙŠÙˆÙ… ÙÙ‚Ø·",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ÙŠÙˆÙ…",
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
            "Ø§Ù„Ø·Ø¨ÙŠØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
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
          "ØªÙ… ÙØªØ­ Ø§Ù„ÙŠÙˆÙ… Ù…Ø±Ø© Ø£Ø®Ø±Ù‰",
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
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ÙØªØ­ Ø§Ù„ÙŠÙˆÙ…",
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
            "Ø§Ù„Ø·Ø¨ÙŠØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯",
        });
      }

      saveDoctors(
        newDoctors
      );

      res.json({
        success: true,
        message:
          "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø¨Ù†Ø¬Ø§Ø­",
      });
    } catch (error) {
      console.error(
        "DELETE DOCTOR ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„Ø·Ø¨ÙŠØ¨",
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
            "Ø­Ø¬Ù… Ù…Ù„Ù PDF ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØªØ¬Ø§ÙˆØ² 10MB",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø±ÙØ¹ Ø§Ù„Ù…Ù„Ù",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±",
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

module.exports = app;
