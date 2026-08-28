import { useEffect, useState } from "react";
import "./Admin.css";

const API = "http://localhost:5000";

const specialties = [
  "باطنة وقلب",
  "أسنان",
  "نساء وتوليد",
  "أنف وأذن",
  "علاج طبيعي",
  "عظام",
  "جلدية",
];

const days = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

const defaultTimes = [
  "9:00 ص",
  "10:00 ص",
  "11:00 ص",
  "12:00 م",
  "1:00 م",
  "2:00 م",
  "3:00 م",
  "4:00 م",
  "5:00 م",
  "6:00 م",
  "7:00 م",
];

/* =================================================
   DATE HELPERS
================================================= */

function getTodayDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatArabicDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Admin() {
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || ""
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [bookings, setBookings] = useState([]);
  const [results, setResults] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [uploadingResult, setUploadingResult] = useState(false);

  const [message, setMessage] = useState("");

  /* =================================================
     DAILY REPORT DATE
  ================================================= */

  const [reportDate, setReportDate] = useState(
    getTodayDate()
  );

  const [todayDate, setTodayDate] = useState(
    getTodayDate()
  );

  /* =========================
     BOOKING SEARCH
  ========================= */

  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchDate, setSearchDate] = useState("");

  /* =========================
     DOCTOR SEARCH
  ========================= */

  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  /* =========================
     LAB RESULT FORM
  ========================= */

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  /* =========================
     DOCTOR FORM
  ========================= */

  const [doctorName, setDoctorName] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState(
    specialties[0]
  );
  const [doctorWorkDays, setDoctorWorkDays] = useState([]);
  const [doctorTimes, setDoctorTimes] = useState([]);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  /* =================================================
     AUTOMATIC NEW DAY AFTER MIDNIGHT
  ================================================= */

  useEffect(() => {
    const checkNewDay = () => {
      const today = getTodayDate();

      setTodayDate((oldToday) => {
        if (oldToday !== today) {
          setReportDate((oldReportDate) => {
            if (oldReportDate === oldToday) {
              return today;
            }

            return oldReportDate;
          });

          return today;
        }

        return oldToday;
      });
    };

    checkNewDay();

    const timer = setInterval(
      checkNewDay,
      1000
    );

    return () => clearInterval(timer);
  }, []);

  /* =================================================
     LOGIN
  ================================================= */

  async function login(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "بيانات الدخول غير صحيحة"
        );
      }

      if (!data.token) {
        throw new Error(
          "السيرفر لم يُرجع رمز الدخول"
        );
      }

      localStorage.setItem(
        "adminToken",
        data.token
      );

      setToken(data.token);
      setMessage(
        "تم تسجيل الدخول بنجاح ✅"
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* =================================================
     LOGOUT
  ================================================= */

  function logout() {
    localStorage.removeItem("adminToken");

    setToken("");
    setBookings([]);
    setResults([]);
    setReviews([]);
    setDoctors([]);

    setUsername("");
    setPassword("");
  }

  /* =================================================
     GET BOOKINGS
  ================================================= */

  async function getBookings() {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "فشل تحميل الحجوزات"
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.bookings)
        ? data.bookings
        : [];

      setBookings(list);
    } catch (error) {
      console.error(
        "GET BOOKINGS ERROR:",
        error
      );

      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* =================================================
     GET RESULTS
  ================================================= */

  async function getResults() {
    if (!token) return;

    try {
      setResultsLoading(true);

      const response = await fetch(
        `${API}/api/results`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل تحميل نتائج التحاليل"
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      setResults(list);
    } catch (error) {
      console.error(
        "GET RESULTS ERROR:",
        error
      );

      setMessage(error.message);
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }

  /* =================================================
     GET REVIEWS
  ================================================= */

  async function getReviews() {
    if (!token) return;

    try {
      setReviewsLoading(true);

      const response = await fetch(
        `${API}/api/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "فشل تحميل التقييمات"
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.reviews)
        ? data.reviews
        : [];

      setReviews(list);
    } catch (error) {
      console.error(
        "GET REVIEWS ERROR:",
        error
      );

      setMessage(error.message);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  /* =================================================
     GET DOCTORS
  ================================================= */

  async function getDoctors() {
    if (!token) return;

    try {
      setDoctorsLoading(true);

      const response = await fetch(
        `${API}/api/doctors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "DOCTORS API RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message || "فشل تحميل الأطباء"
        );
      }

      let doctorsList = [];

      if (Array.isArray(data)) {
        doctorsList = data;
      } else if (Array.isArray(data.doctors)) {
        doctorsList = data.doctors;
      } else if (
        data.doctors &&
        typeof data.doctors === "object"
      ) {
        doctorsList = Object.values(data.doctors);
      }

      const uniqueDoctors = [];
      const usedIds = new Set();
      const usedNames = new Set();

      doctorsList.forEach((doctor) => {
        const id = doctor.id || doctor._id;

        const name = String(
          doctor.name || ""
        )
          .trim()
          .toLowerCase();

        if (id) {
          const idString = String(id);

          if (usedIds.has(idString)) {
            return;
          }

          usedIds.add(idString);
          uniqueDoctors.push(doctor);
          return;
        }

        if (name) {
          if (usedNames.has(name)) {
            return;
          }

          usedNames.add(name);
          uniqueDoctors.push(doctor);
        }
      });

      setDoctors(uniqueDoctors);
    } catch (error) {
      console.error(
        "GET DOCTORS ERROR:",
        error
      );

      setMessage(error.message);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }

  /* =================================================
     LOAD DATA
  ================================================= */

  useEffect(() => {
    if (token) {
      getBookings();
      getResults();
      getReviews();
      getDoctors();
    }
  }, [token]);

  /* =================================================
     CONFIRM BOOKING
  ================================================= */

  async function confirmBooking(id) {
    try {
      const response = await fetch(
        `${API}/api/bookings/${id}/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل تأكيد الحجز"
        );
      }

      setMessage(
        "تم تأكيد الحجز بنجاح ✅"
      );

      getBookings();
    } catch (error) {
      console.error(
        "CONFIRM BOOKING ERROR:",
        error
      );

      setMessage(error.message);
    }
  }

  /* =================================================
     CANCEL BOOKING
  ================================================= */

  async function cancelBooking(id) {
    const ok = window.confirm(
      "هل أنت متأكد من إلغاء هذا الحجز؟"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API}/api/bookings/${id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل إلغاء الحجز"
        );
      }

      setMessage(
        "تم إلغاء الحجز بنجاح"
      );

      getBookings();
    } catch (error) {
      console.error(
        "CANCEL BOOKING ERROR:",
        error
      );

      setMessage(error.message);
    }
  }

  /* =================================================
     DELETE BOOKING
  ================================================= */

  async function deleteBooking(id) {
    const ok = window.confirm(
      "هل تريد حذف الحجز نهائيًا؟"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API}/api/bookings/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل حذف الحجز"
        );
      }

      setMessage(
        "تم حذف الحجز بنجاح"
      );

      getBookings();
    } catch (error) {
      console.error(
        "DELETE BOOKING ERROR:",
        error
      );

      setMessage(error.message);
    }
  }

  /* =================================================
     UPLOAD RESULT
  ================================================= */

  async function uploadResult(e) {
    e.preventDefault();

    setMessage("");

    if (!patientName.trim()) {
      setMessage(
        "من فضلك اكتب اسم المريض"
      );
      return;
    }

    if (!/^01[0-9]{9}$/.test(patientPhone)) {
      setMessage(
        "رقم الهاتف غير صحيح"
      );
      return;
    }

    if (!pdfFile) {
      setMessage(
        "من فضلك اختر ملف PDF"
      );
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      setMessage(
        "يسمح برفع ملفات PDF فقط"
      );
      return;
    }

    if (
      pdfFile.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "حجم الملف يجب ألا يتجاوز 10MB"
      );
      return;
    }

    try {
      setUploadingResult(true);

      const formData = new FormData();

      formData.append(
        "patientName",
        patientName.trim()
      );

      formData.append(
        "phone",
        patientPhone.trim()
      );

      formData.append(
        "file",
        pdfFile
      );

      const response = await fetch(
        `${API}/api/results/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل رفع النتيجة"
        );
      }

      setMessage(
        "تم رفع نتيجة التحليل بنجاح ✅"
      );

      setPatientName("");
      setPatientPhone("");
      setPdfFile(null);

      const fileInput =
        document.getElementById(
          "result-pdf"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      getResults();
    } catch (error) {
      console.error(
        "UPLOAD RESULT ERROR:",
        error
      );

      setMessage(error.message);
    } finally {
      setUploadingResult(false);
    }
  }

  /* =================================================
     DELETE RESULT
  ================================================= */

  async function deleteResult(id) {
    const ok = window.confirm(
      "هل تريد حذف نتيجة التحليل نهائيًا؟"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API}/api/results/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل حذف النتيجة"
        );
      }

      setMessage(
        "تم حذف نتيجة التحليل بنجاح"
      );

      getResults();
    } catch (error) {
      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      setMessage(error.message);
    }
  }

  /* =================================================
     DELETE REVIEW
  ================================================= */

  async function deleteReview(id) {
    const ok = window.confirm(
      "هل تريد حذف هذا التقييم نهائيًا؟"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API}/api/reviews/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل حذف التقييم"
        );
      }

      setMessage(
        "تم حذف التقييم بنجاح ✅"
      );

      getReviews();
    } catch (error) {
      console.error(
        "DELETE REVIEW ERROR:",
        error
      );

      setMessage(error.message);
    }
  }

  /* =================================================
     DOCTORS
  ================================================= */

  function resetDoctorForm() {
    setDoctorName("");
    setDoctorSpecialty(
      specialties[0]
    );
    setDoctorWorkDays([]);
    setDoctorTimes([]);
    setEditingDoctorId(null);
    setSelectedDoctor(null);
  }

  function toggleDoctorDay(day) {
    setDoctorWorkDays((current) => {
      if (current.includes(day)) {
        return current.filter(
          (item) => item !== day
        );
      }

      return [...current, day].sort(
        (a, b) => a - b
      );
    });
  }

  function toggleDoctorTime(time) {
    setDoctorTimes((current) => {
      if (current.includes(time)) {
        return current.filter(
          (item) => item !== time
        );
      }

      return [...current, time];
    });
  }

  function editDoctor(doctor) {
    setEditingDoctorId(
      doctor.id || doctor._id
    );

    setDoctorName(
      doctor.name || ""
    );

    setDoctorSpecialty(
      doctor.specialty ||
        specialties[0]
    );

    setDoctorWorkDays(
      Array.isArray(doctor.workDays)
        ? [...doctor.workDays]
        : []
    );

    setDoctorTimes(
      Array.isArray(doctor.times)
        ? [...doctor.times]
        : []
    );

    setSelectedDoctor(doctor);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selectDoctorForSchedule(doctor) {
    setSelectedDoctor(doctor);

    setDoctorName(
      doctor.name || ""
    );

    setDoctorSpecialty(
      doctor.specialty ||
        specialties[0]
    );

    setDoctorWorkDays(
      Array.isArray(doctor.workDays)
        ? [...doctor.workDays]
        : []
    );

    setDoctorTimes(
      Array.isArray(doctor.times)
        ? [...doctor.times]
        : []
    );

    setEditingDoctorId(
      doctor.id || doctor._id
    );
  }

  async function saveDoctor(e) {
    e.preventDefault();

    setMessage("");

    if (!doctorName.trim()) {
      setMessage(
        "من فضلك اكتب اسم الطبيب"
      );
      return;
    }

    if (!doctorSpecialty) {
      setMessage(
        "من فضلك اختر التخصص"
      );
      return;
    }

    if (doctorWorkDays.length === 0) {
      setMessage(
        "اختر يوم عمل واحد على الأقل"
      );
      return;
    }

    if (doctorTimes.length === 0) {
      setMessage(
        "اختر موعدًا واحدًا على الأقل"
      );
      return;
    }

    try {
      setDoctorSaving(true);

      const body = {
        name: doctorName.trim(),
        specialty: doctorSpecialty,
        workDays: doctorWorkDays,
        times: doctorTimes,
      };

      const url = editingDoctorId
        ? `${API}/api/doctors/${editingDoctorId}`
        : `${API}/api/doctors`;

      const method = editingDoctorId
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "حدث خطأ أثناء حفظ الطبيب"
        );
      }

      setMessage(
        editingDoctorId
          ? "تم تعديل بيانات الطبيب بنجاح ✅"
          : "تم إضافة الطبيب بنجاح ✅"
      );

      resetDoctorForm();
      await getDoctors();
    } catch (error) {
      console.error(
        "SAVE DOCTOR ERROR:",
        error
      );

      setMessage(
        error.message
      );
    } finally {
      setDoctorSaving(false);
    }
  }

  async function saveSelectedDoctorSchedule() {
    if (!selectedDoctor) return;

    if (doctorWorkDays.length === 0) {
      setMessage(
        "لازم تختار يوم عمل واحد على الأقل"
      );
      return;
    }

    if (doctorTimes.length === 0) {
      setMessage(
        "لازم تختار موعد واحد على الأقل"
      );
      return;
    }

    try {
      setDoctorSaving(true);
      setMessage("");

      const doctorId =
        selectedDoctor.id ||
        selectedDoctor._id;

      const response = await fetch(
        `${API}/api/doctors/${doctorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            name:
              selectedDoctor.name,
            specialty:
              selectedDoctor.specialty,
            workDays:
              doctorWorkDays,
            times:
              doctorTimes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل تعديل مواعيد الطبيب"
        );
      }

      const updatedDoctor = {
        ...selectedDoctor,
        workDays: [
          ...doctorWorkDays,
        ],
        times: [
          ...doctorTimes,
        ],
      };

      setSelectedDoctor(
        updatedDoctor
      );

      setMessage(
        "تم تحديث مواعيد الطبيب بنجاح ✅"
      );

      await getDoctors();
    } catch (error) {
      console.error(
        "UPDATE DOCTOR SCHEDULE ERROR:",
        error
      );

      setMessage(
        error.message
      );
    } finally {
      setDoctorSaving(false);
    }
  }

  async function deleteDoctor(id) {
    const ok = window.confirm(
      "هل تريد حذف هذا الطبيب نهائيًا؟"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API}/api/doctors/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "فشل حذف الطبيب"
        );
      }

      setMessage(
        "تم حذف الطبيب بنجاح ✅"
      );

      if (
        editingDoctorId === id ||
        selectedDoctor?.id === id ||
        selectedDoctor?._id === id
      ) {
        resetDoctorForm();
      }

      getDoctors();
    } catch (error) {
      console.error(
        "DELETE DOCTOR ERROR:",
        error
      );

      setMessage(
        error.message
      );
    }
  }

  /* =================================================
     SAFE DATA
  ================================================= */

  const safeBookings = Array.isArray(
    bookings
  )
    ? bookings
    : [];

  const safeResults = Array.isArray(
    results
  )
    ? results
    : [];

  const safeReviews = Array.isArray(
    reviews
  )
    ? reviews
    : [];

  const safeDoctors = Array.isArray(
    doctors
  )
    ? doctors
    : [];

  /* =================================================
     DOCTOR SEARCH
  ================================================= */

  const filteredDoctors =
    safeDoctors.filter((doctor) => {
      const name = String(
        doctor.name || ""
      ).toLowerCase();

      return name.includes(
        doctorSearch
          .trim()
          .toLowerCase()
      );
    });

  /* =================================================
     DAILY REPORT
  ================================================= */

  const reportBookings =
    safeBookings.filter(
      (booking) =>
        String(
          booking.date || ""
        ) === reportDate
    );

  const reportTotal =
    reportBookings.length;

  const reportNew =
    reportBookings.filter(
      (booking) =>
        booking.status === "جديد"
    );

  const reportConfirmed =
    reportBookings.filter(
      (booking) =>
        booking.status === "confirmed"
    );

  const reportCancelled =
    reportBookings.filter(
      (booking) =>
        booking.status === "cancelled"
    );

  const reportSpecialtyCounts =
    specialties.map(
      (specialty) => ({
        name: specialty,

        count:
          reportBookings.filter(
            (booking) =>
              booking.specialty ===
              specialty
          ).length,
      })
    );

  /* =================================================
     ALL SAVED BOOKING DATES
  ================================================= */


  /* =================================================
     OLD SEARCH
  ================================================= */

  const filteredBookings =
    safeBookings.filter(
      (booking) => {
        const name =
          String(
            booking.name || ""
          ).toLowerCase();

        const phone =
          String(
            booking.phone || ""
          );

        const nameMatch =
          name.includes(
            searchName.toLowerCase()
          );

        const phoneMatch =
          phone.includes(
            searchPhone
          );

        const dateMatch =
          searchDate === "" ||
          booking.date === searchDate;

        return (
          nameMatch &&
          phoneMatch &&
          dateMatch
        );
      }
    );

  /* =================================================
     LOGIN
  ================================================= */

  if (!token) {
    return (
      <div className="admin-page">
        <div className="login-card">

          <div className="admin-logo">
            🏥
          </div>

          <h1>
            لوحة الإدارة
          </h1>

          <p>
            تسجيل الدخول لإدارة الحجوزات
          </p>

          <form onSubmit={login}>

            <div className="admin-input">
              <label>
                اسم المستخدم
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="admin"
                autoComplete="username"
              />
            </div>

            <div className="admin-input">
              <label>
                كلمة المرور
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="كلمة المرور"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "جاري الدخول..."
                : "تسجيل الدخول"}
            </button>

          </form>

          {message && (
            <div className="admin-message">
              {message}
            </div>
          )}

        </div>
      </div>
    );
  }

  /* =================================================
     DASHBOARD
  ================================================= */

  return (
    <div className="admin-page">

      <header className="admin-header">

        <div>
          <h1>
            لوحة تحكم مبره الفلكي
          </h1>

          <p>
            إدارة الحجوزات ونتائج التحاليل
            والتقييمات والأطباء
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          تسجيل الخروج
        </button>

      </header>

      <main className="admin-container">

        {/* =================================================
            DAILY REPORT
        ================================================= */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "18px",
            marginBottom: "20px",
            border:
              "1px solid #e5e7eb",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.05)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >

            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                📊 تقرير اليوم
              </h2>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  color:
                    "#64748b",
                  fontWeight:
                    "600",
                }}
              >
                {formatArabicDate(
                  reportDate
                )}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems:
                  "center",
                flexWrap:
                  "wrap",
              }}
            >

              <button
                type="button"
                className="refresh-button"
                onClick={() =>
                  setReportDate(
                    todayDate
                  )
                }
              >
                📌 اليوم
              </button>

              <input
                type="date"
                value={reportDate}
                onChange={(e) =>
                  setReportDate(
                    e.target.value
                  )
                }
                style={{
                  padding:
                    "11px 14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #d1d5db",
                  fontSize:
                    "15px",
                }}
              />

            </div>

          </div>

          <div
            className="stats-grid"
            style={{
              marginTop: "20px",
            }}
          >

            <div className="stat-card">
              <span>
                📋
              </span>

              <strong>
                {reportTotal}
              </strong>

              <p>
                إجمالي حالات اليوم
              </p>
            </div>

            <div className="stat-card new">
              <span>
                🟡
              </span>

              <strong>
                {reportNew.length}
              </strong>

              <p>
                جديد
              </p>
            </div>

            <div className="stat-card confirmed">
              <span>
                🟢
              </span>

              <strong>
                {reportConfirmed.length}
              </strong>

              <p>
                مؤكد
              </p>
            </div>

            <div className="stat-card cancelled">
              <span>
                🔴
              </span>

              <strong>
                {reportCancelled.length}
              </strong>

              <p>
                ملغي
              </p>
            </div>

          </div>

          <div
            style={{
              marginTop:
                "20px",
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap:
                "10px",
            }}
          >

            {reportSpecialtyCounts.map(
              (item) => (
                <div
                  key={
                    item.name
                  }
                  style={{
                    padding:
                      "15px",
                    borderRadius:
                      "12px",
                    background:
                      "#f8fafc",
                    border:
                      "1px solid #e5e7eb",
                    textAlign:
                      "center",
                  }}
                >

                  <strong>
                    {item.name}
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "28px",
                      fontWeight:
                        "800",
                      marginTop:
                        "6px",
                    }}
                  >
                    {item.count}
                  </div>

                  <span>
                    حالة
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* =================================================
            CURRENT GENERAL STATISTICS
        ================================================= */}

        <div className="stats-grid">

          <div className="stat-card">
            <span>📋</span>

            <strong>
              {reportTotal}
            </strong>

            <p>
              إجمالي الحجوزات
            </p>
          </div>

          <div className="stat-card new">
            <span>🟡</span>

            <strong>
              {reportNew.length}
            </strong>

            <p>
              طلبات جديدة
            </p>
          </div>

          <div className="stat-card confirmed">
            <span>🟢</span>

            <strong>
              {reportConfirmed.length}
            </strong>

            <p>
              حجوزات مؤكدة
            </p>
          </div>

          <div className="stat-card cancelled">
            <span>🔴</span>

            <strong>
              {reportCancelled.length}
            </strong>

            <p>
              حجوزات ملغية
            </p>
          </div>

        </div>

        {/* =================================================
            SPECIALTIES
        ================================================= */}

        <div className="specialties-dashboard">

          <div className="dashboard-title">

            <div>
              <h2>
                📊 الحجوزات حسب التخصص
              </h2>

              <p>
                اليوم المحدد في التقرير
              </p>
            </div>

            <div className="top-specialty">

              ⭐ الأكثر طلبًا

              <strong>
                {
                  reportSpecialtyCounts
                    .reduce(
                      (max, item) =>
                        item.count >
                        max.count
                          ? item
                          : max,
                      {
                        name: "لا يوجد",
                        count: 0,
                      }
                    ).name
                }
              </strong>

              <span>
                {
                  reportSpecialtyCounts.reduce(
                    (max, item) =>
                      item.count >
                      max.count
                        ? item
                        : max,
                    {
                      name: "لا يوجد",
                      count: 0,
                    }
                  ).count
                } حالة
              </span>

            </div>

          </div>

          <div className="specialty-stats-grid">

            {reportSpecialtyCounts.map(
              (item) => {

                let icon = "🩺";

                if (
                  item.name ===
                  "أسنان"
                ) {
                  icon = "🦷";
                } else if (
                  item.name ===
                  "نساء وتوليد"
                ) {
                  icon = "👩‍⚕️";
                } else if (
                  item.name ===
                  "باطنة وقلب"
                ) {
                  icon = "❤️";
                } else if (
                  item.name ===
                  "أنف وأذن"
                ) {
                  icon = "👂";
                } else if (
                  item.name ===
                  "علاج طبيعي"
                ) {
                  icon = "💆";
                } else if (
                  item.name ===
                  "عظام"
                ) {
                  icon = "🦴";
                } else if (
                  item.name ===
                  "جلدية"
                ) {
                  icon = "🧴";
                }

                const percentage =
                  reportTotal >
                  0
                    ? Math.round(
                        (item.count /
                          reportTotal) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="specialty-stat-card"
                    key={
                      item.name
                    }
                  >

                    <div className="specialty-icon">
                      {icon}
                    </div>

                    <div className="specialty-info">

                      <h3>
                        {item.name}
                      </h3>

                      <strong>
                        {item.count}
                      </strong>

                      <span>
                        حالة
                      </span>

                    </div>

                    <div className="specialty-progress">

                      <div
                        className="specialty-progress-bar"
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />

                    </div>

                    <small>
                      {percentage}%
                      من حجوزات اليوم
                    </small>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {/* =================================================
            DOCTORS MANAGEMENT
        ================================================= */}

        <div className="results-dashboard">

          <div className="results-dashboard-title">

            <div>
              <h2>
                👨‍⚕️ إدارة الأطباء
              </h2>

              <p>
                إضافة وتعديل وحذف الأطباء ومواعيد العمل
              </p>
            </div>

            <div className="results-count-badge">
              {safeDoctors.length} طبيب
            </div>

          </div>

          <form
            className="result-upload-form"
            onSubmit={saveDoctor}
          >

            <div className="result-input">

              <label>
                اسم الطبيب
              </label>

              <input
                type="text"
                value={doctorName}
                onChange={(e) =>
                  setDoctorName(
                    e.target.value
                  )
                }
                placeholder="مثال: د. محمود فتحي"
              />

            </div>

            <div className="result-input">

              <label>
                التخصص
              </label>

              <select
                value={doctorSpecialty}
                onChange={(e) =>
                  setDoctorSpecialty(
                    e.target.value
                  )
                }
              >

                {specialties.map(
                  (specialty) => (
                    <option
                      key={specialty}
                      value={specialty}
                    >
                      {specialty}
                    </option>
                  )
                )}

              </select>

            </div>

            <div
              className="result-input"
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >

              <label>
                أيام العمل
              </label>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "8px",
                  marginTop:
                    "8px",
                }}
              >

                {days.map(
                  (day) => (
                    <button
                      type="button"
                      key={
                        day.value
                      }
                      onClick={() =>
                        toggleDoctorDay(
                          day.value
                        )
                      }
                      style={{
                        padding:
                          "10px 14px",
                        borderRadius:
                          "10px",
                        border:
                          "1px solid #ddd",
                        cursor:
                          "pointer",
                        background:
                          doctorWorkDays.includes(
                            day.value
                          )
                            ? "#0f766e"
                            : "#fff",
                        color:
                          doctorWorkDays.includes(
                            day.value
                          )
                            ? "#fff"
                            : "#333",
                      }}
                    >
                      {day.label}
                    </button>
                  )
                )}

              </div>

            </div>

            <div
              className="result-input"
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >

              <label>
                مواعيد الطبيب
              </label>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "8px",
                  marginTop:
                    "8px",
                }}
              >

                {defaultTimes.map(
                  (time) => (
                    <button
                      type="button"
                      key={time}
                      onClick={() =>
                        toggleDoctorTime(
                          time
                        )
                      }
                      style={{
                        padding:
                          "9px 13px",
                        borderRadius:
                          "10px",
                        border:
                          "1px solid #ddd",
                        cursor:
                          "pointer",
                        background:
                          doctorTimes.includes(
                            time
                          )
                            ? "#2563eb"
                            : "#fff",
                        color:
                          doctorTimes.includes(
                            time
                          )
                            ? "#fff"
                            : "#333",
                      }}
                    >
                      {time}
                    </button>
                  )
                )}

              </div>

            </div>

            <button
              type="submit"
              className="upload-result-button"
              disabled={
                doctorSaving
              }
            >
              {doctorSaving
                ? "جاري الحفظ..."
                : editingDoctorId
                ? "💾 حفظ تعديل الطبيب"
                : "➕ إضافة الطبيب"}
            </button>

            {editingDoctorId && (
              <button
                type="button"
                className="delete-button"
                onClick={
                  resetDoctorForm
                }
              >
                ✕ إلغاء التعديل
              </button>
            )}

          </form>

          {/* DOCTOR SEARCH */}

          <div
            style={{
              marginTop:
                "20px",
              marginBottom:
                "20px",
              padding:
                "18px",
              background:
                "#f8fafc",
              borderRadius:
                "14px",
              border:
                "1px solid #e5e7eb",
            }}
          >

            <label
              style={{
                display:
                  "block",
                fontWeight:
                  "700",
                marginBottom:
                  "8px",
              }}
            >
              🔎 البحث عن طبيب بالاسم
            </label>

            <input
              type="text"
              value={
                doctorSearch
              }
              onChange={(e) =>
                setDoctorSearch(
                  e.target.value
                )
              }
              placeholder="اكتب اسم الطبيب..."
              style={{
                width:
                  "100%",
                padding:
                  "13px 15px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #d1d5db",
                fontSize:
                  "16px",
                boxSizing:
                  "border-box",
              }}
            />

          </div>

          <div className="results-table-wrapper">

            {doctorsLoading ? (

              <div className="empty">
                جاري تحميل الأطباء...
              </div>

            ) : filteredDoctors.length === 0 ? (

              <div className="empty">
                {doctorSearch
                  ? "لا يوجد طبيب بهذا الاسم"
                  : "لا يوجد أطباء حاليًا"}
              </div>

            ) : (

              <table className="results-table">

                <thead>

                  <tr>
                    <th>#</th>
                    <th>الطبيب</th>
                    <th>التخصص</th>
                    <th>أيام العمل</th>
                    <th>المواعيد</th>
                    <th>الإجراء</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredDoctors.map(
                    (doctor, index) => (

                      <tr
                        key={
                          doctor.id ||
                          doctor._id ||
                          index
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>

                          <button
                            type="button"
                            onClick={() =>
                              selectDoctorForSchedule(
                                doctor
                              )
                            }
                            style={{
                              border:
                                "none",
                              background:
                                "transparent",
                              padding: 0,
                              cursor:
                                "pointer",
                              color:
                                "#2563eb",
                              fontWeight:
                                "800",
                              fontSize:
                                "16px",
                            }}
                          >
                            {
                              doctor.name
                            }
                          </button>

                        </td>

                        <td>
                          {
                            doctor.specialty
                          }
                        </td>

                        <td>

                          {Array.isArray(
                            doctor.workDays
                          )
                            ? doctor.workDays
                                .map(
                                  (
                                    dayNumber
                                  ) =>
                                    days.find(
                                      (
                                        day
                                      ) =>
                                        day.value ===
                                        dayNumber
                                    )?.label
                                )
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " - "
                                )
                            : "غير محدد"}

                        </td>

                        <td>

                          {Array.isArray(
                            doctor.times
                          )
                            ? doctor.times.join(
                                " - "
                              )
                            : "غير محدد"}

                        </td>

                        <td>

                          <div className="actions">

                            <button
                              className="confirm-button"
                              onClick={() =>
                                editDoctor(
                                  doctor
                                )
                              }
                            >
                              ✏ تعديل
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteDoctor(
                                  doctor.id ||
                                    doctor._id
                                )
                              }
                            >
                              🗑 حذف
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

          {selectedDoctor && (

            <div
              style={{
                marginTop:
                  "25px",
                padding:
                  "25px",
                borderRadius:
                  "18px",
                background:
                  "#ffffff",
                border:
                  "1px solid #e5e7eb",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.06)",
              }}
            >

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "15px",
                  flexWrap:
                    "wrap",
                  marginBottom:
                    "20px",
                }}
              >

                <div>

                  <h2
                    style={{
                      margin:
                        0,
                    }}
                  >
                    📅 مواعيد{" "}
                    {
                      selectedDoctor.name
                    }
                  </h2>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      color:
                        "#64748b",
                    }}
                  >
                    {
                      selectedDoctor.specialty
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(
                      null
                    );

                    setEditingDoctorId(
                      null
                    );
                  }}
                  className="delete-button"
                >
                  ✕ إغلاق
                </button>

              </div>

              <div
                style={{
                  marginBottom:
                    "25px",
                }}
              >

                <h3>
                  🗓 أيام العمل
                </h3>

                <div
                  style={{
                    display:
                      "flex",
                    flexWrap:
                      "wrap",
                    gap:
                      "10px",
                  }}
                >

                  {days.map(
                    (day) => {

                      const active =
                        doctorWorkDays.includes(
                          day.value
                        );

                      return (
                        <button
                          key={
                            day.value
                          }
                          type="button"
                          onClick={() =>
                            toggleDoctorDay(
                              day.value
                            )
                          }
                          style={{
                            padding:
                              "12px 18px",
                            borderRadius:
                              "12px",
                            border:
                              "1px solid #ddd",
                            cursor:
                              "pointer",
                            background:
                              active
                                ? "#0f766e"
                                : "#fff",
                            color:
                              active
                                ? "#fff"
                                : "#333",
                            fontWeight:
                              "700",
                          }}
                        >
                          {active
                            ? "✓ "
                            : ""}
                          {
                            day.label
                          }
                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              <div>

                <h3>
                  ⏰ مواعيد الحجز
                </h3>

                <div
                  style={{
                    display:
                      "flex",
                    flexWrap:
                      "wrap",
                    gap:
                      "10px",
                  }}
                >

                  {defaultTimes.map(
                    (time) => {

                      const active =
                        doctorTimes.includes(
                          time
                        );

                      return (
                        <button
                          key={
                            time
                          }
                          type="button"
                          onClick={() =>
                            toggleDoctorTime(
                              time
                            )
                          }
                          style={{
                            padding:
                              "10px 16px",
                            borderRadius:
                              "10px",
                            border:
                              "1px solid #ddd",
                            cursor:
                              "pointer",
                            background:
                              active
                                ? "#2563eb"
                                : "#fff",
                            color:
                              active
                                ? "#fff"
                                : "#333",
                            fontWeight:
                              "600",
                          }}
                        >
                          {active
                            ? "✓ "
                            : ""}
                          {time}
                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              <button
                type="button"
                className="upload-result-button"
                disabled={
                  doctorSaving
                }
                onClick={
                  saveSelectedDoctorSchedule
                }
                style={{
                  marginTop:
                    "25px",
                }}
              >
                {doctorSaving
                  ? "جاري الحفظ..."
                  : "💾 حفظ مواعيد الطبيب"}
              </button>

            </div>

          )}

        </div>

        {/* =================================================
            LAB RESULTS
        ================================================= */}

        <div className="results-dashboard">

          <div className="results-dashboard-title">

            <div>

              <h2>
                🧪 نتائج التحاليل
              </h2>

              <p>
                رفع وإدارة نتائج تحاليل المرضى
              </p>

            </div>

            <div className="results-count-badge">
              {safeResults.length} نتيجة
            </div>

          </div>

          <form
            className="result-upload-form"
            onSubmit={
              uploadResult
            }
          >

            <div className="result-input">

              <label>
                اسم المريض
              </label>

              <input
                type="text"
                value={
                  patientName
                }
                onChange={(e) =>
                  setPatientName(
                    e.target.value
                  )
                }
                placeholder="اكتب اسم المريض"
              />

            </div>

            <div className="result-input">

              <label>
                رقم الهاتف
              </label>

              <input
                type="tel"
                value={
                  patientPhone
                }
                onChange={(e) =>
                  setPatientPhone(
                    e.target.value
                  )
                }
                placeholder="01xxxxxxxxx"
                maxLength={
                  11
                }
                dir="ltr"
              />

            </div>

            <div className="result-input">

              <label>
                ملف التحليل PDF
              </label>

              <input
                id="result-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(
                  e
                ) =>
                  setPdfFile(
                    e.target
                      .files[0] ||
                    null
                  )
                }
              />

            </div>

            <button
              type="submit"
              className="upload-result-button"
              disabled={
                uploadingResult
              }
            >
              {uploadingResult
                ? "جاري الرفع..."
                : "📤 رفع النتيجة"}
            </button>

          </form>

          <div className="results-table-wrapper">

            {resultsLoading ? (

              <div className="empty">
                جاري تحميل نتائج التحاليل...
              </div>

            ) : safeResults.length === 0 ? (

              <div className="empty">
                لا توجد نتائج تحاليل حاليًا
              </div>

            ) : (

              <table className="results-table">

                <thead>

                  <tr>
                    <th>#</th>
                    <th>اسم المريض</th>
                    <th>رقم الهاتف</th>
                    <th>الملف</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراء</th>
                  </tr>

                </thead>

                <tbody>

                  {safeResults.map(
                    (result, index) => (

                      <tr
                        key={
                          result.id ||
                          result._id ||
                          index
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <strong>
                            {
                              result.patientName
                            }
                          </strong>
                        </td>

                        <td dir="ltr">
                          {result.phone}
                        </td>

                        <td>

                          <a
                            href={`${API}/api/results/file/${encodeURIComponent(
                              result.fileName ||
                                ""
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="open-pdf-button"
                          >
                            📄 فتح PDF
                          </a>

                        </td>

                        <td>
                          {result.createdAt
                            ? new Date(
                                result.createdAt
                              ).toLocaleDateString(
                                "ar-EG"
                              )
                            : "-"}
                        </td>

                        <td>

                          <button
                            className="delete-result-button"
                            onClick={() =>
                              deleteResult(
                                result.id ||
                                  result._id
                              )
                            }
                          >
                            🗑 حذف
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>

        {/* =================================================
            REVIEWS
        ================================================= */}

        <div className="reviews-dashboard">

          <div className="reviews-dashboard-title">

            <div>

              <h2>
                ⭐ تقييمات العملاء
              </h2>

              <p>
                مشاهدة وإدارة تقييمات المرضى والعملاء
              </p>

            </div>

            <div className="reviews-count-badge">
              {safeReviews.length} تقييم
            </div>

          </div>

          {reviewsLoading ? (

            <div className="empty">
              جاري تحميل التقييمات...
            </div>

          ) : safeReviews.length === 0 ? (

            <div className="empty">
              لا توجد تقييمات حاليًا
            </div>

          ) : (

            <div className="reviews-admin-list">

              {safeReviews.map(
                (review, index) => {

                  const rating =
                    Number(
                      review.rating
                    );

                  const safeRating =
                    Math.max(
                      0,
                      Math.min(
                        5,
                        Number.isFinite(
                          rating
                        )
                          ? rating
                          : 0
                      )
                    );

                  return (
                    <div
                      className="admin-review-card"
                      key={
                        review.id ||
                        review._id ||
                        index
                      }
                    >

                      <div className="admin-review-header">

                        <div className="admin-review-user">

                          <div className="admin-review-avatar">
                            👤
                          </div>

                          <div>

                            <h3>
                              {
                                review.name
                              }
                            </h3>

                            <small>
                              {review.createdAt
                                ? new Date(
                                    review.createdAt
                                  ).toLocaleDateString(
                                    "ar-EG"
                                  )
                                : ""}
                            </small>

                          </div>

                        </div>

                        <button
                          className="delete-review-button"
                          onClick={() =>
                            deleteReview(
                              review.id ||
                                review._id
                            )
                          }
                        >
                          🗑 حذف
                        </button>

                      </div>

                      <div className="admin-review-rating">

                        {"★".repeat(
                          Math.floor(
                            safeRating
                          )
                        )}

                        {"☆".repeat(
                          5 -
                            Math.floor(
                              safeRating
                            )
                        )}

                        <span>
                          {safeRating}/5
                        </span>

                      </div>

                      <div className="admin-review-text">
                        {
                          review.text
                        }
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* =================================================
            BOOKINGS
        ================================================= */}

        <div className="bookings-card">

          <div className="bookings-title">

            <div>

              <h2>
                الحجوزات
              </h2>

              <p>
                {formatArabicDate(
                  reportDate
                )}
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={
                getBookings
              }
            >
              🔄 تحديث
            </button>

          </div>

          <div className="booking-filters">

            <div className="filter-box">

              <label>
                🔎 البحث بالاسم
              </label>

              <input
                type="text"
                value={
                  searchName
                }
                onChange={(e) =>
                  setSearchName(
                    e.target.value
                  )
                }
                placeholder="اكتب اسم المريض"
              />

            </div>

            <div className="filter-box">

              <label>
                📱 رقم الهاتف
              </label>

              <input
                type="text"
                value={
                  searchPhone
                }
                onChange={(e) =>
                  setSearchPhone(
                    e.target.value
                  )
                }
                placeholder="01xxxxxxxxx"
                maxLength={
                  11
                }
                dir="ltr"
              />

            </div>

            <div className="filter-box">

              <label>
                📅 البحث بتاريخ
              </label>

              <input
                type="date"
                value={
                  searchDate
                }
                onChange={(e) =>
                  setSearchDate(
                    e.target.value
                  )
                }
              />

            </div>

            <button
              type="button"
              className="clear-filters"
              onClick={() => {
                setSearchName("");
                setSearchPhone("");
                setSearchDate(
                  reportDate
                );
              }}
            >
              ✕ مسح البحث
            </button>

          </div>

          <div className="results-count">

            عرض{" "}
            <strong>
              {reportBookings.filter(
                (booking) => {
                  const name =
                    String(
                      booking.name || ""
                    ).toLowerCase();

                  const phone =
                    String(
                      booking.phone || ""
                    );

                  return (
                    name.includes(
                      searchName.toLowerCase()
                    ) &&
                    phone.includes(
                      searchPhone
                    )
                  );
                }
              ).length}
            </strong>{" "}
            من أصل{" "}
            <strong>
              {reportTotal}
            </strong>{" "}
            حجز في اليوم المحدد

          </div>

          {loading ? (

            <div className="empty">
              جاري تحميل الحجوزات...
            </div>

          ) : reportBookings.length ===
            0 ? (

            <div className="empty">
              لا توجد حجوزات في هذا اليوم
            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>رقم الدور</th>
                    <th>المريض</th>
                    <th>الهاتف</th>
                    <th>التخصص</th>
                    <th>الطبيب</th>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>

                </thead>

                <tbody>

                  {reportBookings
                    .filter(
                      (booking) => {
                        const name =
                          String(
                            booking.name ||
                              ""
                          ).toLowerCase();

                        const phone =
                          String(
                            booking.phone ||
                              ""
                          );

                        return (
                          name.includes(
                            searchName.toLowerCase()
                          ) &&
                          phone.includes(
                            searchPhone
                          )
                        );
                      }
                    )
                    .map(
                      (
                        booking,
                        index
                      ) => (

                        <tr
                          key={
                            booking.id ||
                            booking._id ||
                            index
                          }
                        >

                          <td>

                            <strong>
                              #
                              {
                                booking.queueNumber
                              }
                            </strong>

                          </td>

                          <td>
                            {
                              booking.name
                            }
                          </td>

                          <td dir="ltr">
                            {
                              booking.phone
                            }
                          </td>

                          <td>
                            {
                              booking.specialty
                            }
                          </td>

                          <td>
                            {
                              booking.doctor
                            }
                          </td>

                          <td>
                            {
                              booking.date
                            }
                          </td>

                          <td>
                            {booking.time ||
                              "—"}
                          </td>

                          <td>

                            {booking.status ===
                              "جديد" && (
                              <span className="status new-status">
                                جديد
                              </span>
                            )}

                            {booking.status ===
                              "confirmed" && (
                              <span className="status confirmed-status">
                                مؤكد
                              </span>
                            )}

                            {booking.status ===
                              "cancelled" && (
                              <span className="status cancelled-status">
                                ملغي
                              </span>
                            )}

                          </td>

                          <td>

                            <div className="actions">

                              {booking.status ===
                                "جديد" && (

                                <button
                                  className="confirm-button"
                                  onClick={() =>
                                    confirmBooking(
                                      booking.id ||
                                        booking._id
                                    )
                                  }
                                >
                                  ✓ تأكيد
                                </button>

                              )}

                              {booking.status !==
                                "cancelled" && (

                                <button
                                  className="cancel-button"
                                  onClick={() =>
                                    cancelBooking(
                                      booking.id ||
                                        booking._id
                                    )
                                  }
                                >
                                  ✕ إلغاء
                                </button>

                              )}

                              <button
                                className="delete-button"
                                onClick={() =>
                                  deleteBooking(
                                    booking.id ||
                                      booking._id
                                  )
                                }
                              >
                                🗑 حذف
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

export default Admin;