import { useEffect, useState } from "react";
import "./App.css";
import Admin from "./Admin";

const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : `http://${window.location.hostname}:5000`;

const MAP_URL =
  "https://maps.app.goo.gl/6qNoTLpeqAiuvaZN8";

const dayNames = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/* =================================================
   GET NEXT 3 WORKING DAYS
================================================= */
 function getNextDoctorDays(
  workDays = [],
  unavailableDates = []
) {
  const days = [];
  const today = new Date();

  /* تنظيف أيام العمل ومنع التكرار */
  const uniqueWorkDays = [
    ...new Set(
      (Array.isArray(workDays) ? workDays : [])
        .map(Number)
        .filter(
          (day) =>
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6
        )
    ),
  ];

  /* تنظيف الأيام المغلقة */
  const unavailable = new Set(
    Array.isArray(unavailableDates)
      ? unavailableDates.map((item) =>
          String(item).trim()
        )
      : []
  );

  if (uniqueWorkDays.length === 0) {
    return [];
  }

  /* كل يوم عمل يظهر مرة واحدة فقط */
  const usedWorkDays = new Set();

  for (
    let i = 1;
    i <= 30 &&
    days.length < uniqueWorkDays.length;
    i++
  ) {
    const date = new Date(today);

    date.setDate(
      today.getDate() + i
    );

    const dayNumber = date.getDay();

    const dateString = [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0"),
    ].join("-");

    if (
      uniqueWorkDays.includes(dayNumber) &&
      !unavailable.has(dateString) &&
      !usedWorkDays.has(dayNumber)
    ) {
      usedWorkDays.add(dayNumber);

      days.push({
        date: dateString,
        dayNumber,
        dayName: dayNames[dayNumber],
      });
    }
  }

  /*
    ترتيب الأيام حسب ظهورها في الأسبوع
    مع الحفاظ على الأيام المختارة فقط
  */
  days.sort(
    (a, b) =>
      uniqueWorkDays.indexOf(a.dayNumber) -
      uniqueWorkDays.indexOf(b.dayNumber)
  );

  return days;
}


function App() {
  const [page, setPage] =
    useState("home");

  /* =================================================
     ADMIN ROUTE
  ================================================= */

  const currentPath =
    window.location.pathname;

  if (
    currentPath === "/admin" ||
    currentPath === "/admin/"
  ) {
    return <Admin />;
  }

  /* =================================================
     DOCTORS
  ================================================= */

  const [doctors, setDoctors] =
    useState([]);

  const [
    loadingDoctors,
    setLoadingDoctors,
  ] = useState(false);

  const loadDoctors =
    async () => {
      try {
        setLoadingDoctors(
          true
        );

        const response =
          await fetch(
            `${API}/api/doctors`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "فشل تحميل الأطباء"
          );
        }

        setDoctors(
          data.doctors || []
        );
      } catch (error) {
        console.error(
          "LOAD DOCTORS ERROR:",
          error
        );
      } finally {
        setLoadingDoctors(
          false
        );
      }
    };

  useEffect(() => {
    loadDoctors();

    const interval =
      setInterval(() => {
        loadDoctors();
      }, 5000);

    return () =>
      clearInterval(
        interval
      );
  }, []);

  /* =================================================
     BOOKING
     DAY ONLY
  ================================================= */

  const [form, setForm] =
    useState({
      name: "",
      phone: "",
      specialty: "",
      doctor: "",
      date: "",
    });

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /* =================================================
     BOOKING TRACKING
  ================================================= */

  const [
    trackingPhone,
    setTrackingPhone,
  ] = useState("");

  const [
    trackedBookings,
    setTrackedBookings,
  ] = useState([]);

  const [
    trackingMessage,
    setTrackingMessage,
  ] = useState("");

  const [
    trackingLoading,
    setTrackingLoading,
  ] = useState(false);

  /* =================================================
     LAB RESULTS
  ================================================= */

  const [
    resultPhone,
    setResultPhone,
  ] = useState("");

  const [results, setResults] =
    useState([]);

  const [
    resultMessage,
    setResultMessage,
  ] = useState("");

  const [
    searchingResults,
    setSearchingResults,
  ] = useState(false);

  /* =================================================
     SUPPORT
  ================================================= */

  const [
    supportName,
    setSupportName,
  ] = useState("");

  const [
    supportPhone,
    setSupportPhone,
  ] = useState("");

  const [
    supportMessage,
    setSupportMessage,
  ] = useState("");

  /* =================================================
     REVIEWS
  ================================================= */

  const [
    reviewName,
    setReviewName,
  ] = useState("");

  const [
    reviewRating,
    setReviewRating,
  ] = useState(5);

  const [
    reviewText,
    setReviewText,
  ] = useState("");

  const [
    reviews,
    setReviews,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          "mabraf_reviews"
        );

      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 1,
              name:
                "أحمد محمد",
              rating: 5,
              text:
                "خدمة ممتازة وسرعة في الحجز.",
            },
            {
              id: 2,
              name:
                "محمد علي",
              rating: 5,
              text:
                "المعاملة محترمة والنتائج سهلة الوصول.",
            },
          ];
    } catch {
      return [];
    }
  });

  /* =================================================
     SPECIALTIES
  ================================================= */

  const specialties = [
    ...new Set(
      doctors.map(
        (doctor) =>
          doctor.specialty
      )
    ),
  ];

  /* =================================================
     SELECTED DOCTOR
  ================================================= */

  const selectedDoctor =
    doctors.find(
      (doctor) =>
        doctor.specialty ===
          form.specialty &&
        doctor.name ===
          form.doctor
    ) || null;

  /* =================================================
     NEXT 3 DAYS
  ================================================= */

  const doctorAvailableDays =
    selectedDoctor
      ? getNextDoctorDays(
          selectedDoctor.workDays ||
            [],
          selectedDoctor.unavailableDates ||
            []
        )
      : [];

  /* =================================================
     SELECT SPECIALTY
  ================================================= */

  const selectSpecialty = (
    specialty
  ) => {
    setForm({
      name: form.name,
      phone: form.phone,
      specialty,
      doctor: "",
      date: "",
    });

    setMessage("");
  };

  /* =================================================
     SELECT DOCTOR
  ================================================= */

  const selectDoctor = (
    doctor
  ) => {
    setForm({
      ...form,
      doctor,
      date: "",
    });

    setMessage("");
  };

  /* =================================================
     SELECT DAY
  ================================================= */

  const selectDay = (
    date
  ) => {
    setForm({
      ...form,
      date,
    });

    setMessage("");
  };

  /* =================================================
     INPUT
  ================================================= */

  const handleInput = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setMessage("");
  };

  /* =================================================
     BOOKING
  ================================================= */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setMessage("");

      if (
        !form.name ||
        !form.phone ||
        !form.specialty ||
        !form.doctor ||
        !form.date
      ) {
        setMessage(
          "من فضلك أكمل جميع البيانات"
        );
        return;
      }

      if (
        !/^01[0125][0-9]{8}$/.test(
          form.phone
        )
      ) {
        setMessage(
          "رقم الهاتف المصري غير صحيح"
        );
        return;
      }

      try {
        setLoading(true);

        const bookingData = {
          name: form.name,
          phone: form.phone,
          specialty:
            form.specialty,
          doctor:
            form.doctor,
          date: form.date,
        };

        const response =
          await fetch(
            `${API}/api/bookings`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  bookingData
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "حدث خطأ أثناء الحجز"
          );
        }

        const queueNumber =
          data.booking
            ?.queueNumber ||
          data.queueNumber;

        const doctorArrivalTime =
          data.booking
            ?.doctorArrivalTime ||
          data.doctorArrivalTime ||
          "";

        setMessage(
          `تم الحجز بنجاح ✅${
            queueNumber
              ? `\n🎟️ رقم الدور: ${queueNumber}`
              : ""
          }${
            doctorArrivalTime
              ? `\n🕙 الدكتور سيحضر الساعة: ${doctorArrivalTime}`
              : ""
          }`
        );

        setForm({
          name: "",
          phone: "",
          specialty:
            form.specialty,
          doctor:
            form.doctor,
          date:
            form.date,
        });
      } catch (error) {
        console.error(
          "BOOKING ERROR:",
          error
        );

        setMessage(
          error.message ||
            "حدث خطأ في الاتصال بالسيرفر"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =================================================
     TRACK BOOKING
  ================================================= */

  const trackBooking =
    async (e) => {
      e.preventDefault();

      setTrackingMessage("");
      setTrackedBookings([]);

      if (
        !/^01[0125][0-9]{8}$/.test(
          trackingPhone
        )
      ) {
        setTrackingMessage(
          "من فضلك أدخل رقم هاتف مصري صحيح مكون من 11 رقمًا"
        );
        return;
      }

      try {
        setTrackingLoading(
          true
        );

        const response =
          await fetch(
            `${API}/api/bookings/track?phone=${encodeURIComponent(
              trackingPhone
            )}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "لا يوجد حجز بهذا الرقم"
          );
        }

        setTrackedBookings(
          Array.isArray(
            data.bookings
          )
            ? data.bookings
            : []
        );

        if (
          !data.bookings ||
          data.bookings.length ===
            0
        ) {
          setTrackingMessage(
            "لا يوجد حجز بهذا الرقم"
          );
        } else {
          setTrackingMessage(
            "تم العثور على الحجز ✅"
          );
        }
      } catch (error) {
        console.error(
          "TRACK BOOKING ERROR:",
          error
        );

        setTrackingMessage(
          error.message ||
            "حدث خطأ أثناء متابعة الحجز"
        );

        setTrackedBookings([]);
      } finally {
        setTrackingLoading(
          false
        );
      }
    };

  /* =================================================
     SEARCH RESULTS
  ================================================= */

  const searchResults =
    async (e) => {
      e.preventDefault();

      setResultMessage("");
      setResults([]);

      if (
        !/^01[0125][0-9]{8}$/.test(
          resultPhone
        )
      ) {
        setResultMessage(
          "من فضلك أدخل رقم هاتف مصري صحيح مكون من 11 رقمًا"
        );

        return;
      }

      try {
        setSearchingResults(
          true
        );

        const response =
          await fetch(
            `${API}/api/results/search?phone=${encodeURIComponent(
              resultPhone
            )}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "لم يتم العثور على نتيجة"
          );
        }

        setResults(
          data.results || []
        );

        setResultMessage(
          `تم العثور على ${
            data.results
              ?.length || 0
          } نتيجة`
        );
      } catch (error) {
        console.error(
          error
        );

        setResultMessage(
          error.message ||
            "حدث خطأ أثناء البحث"
        );
      } finally {
        setSearchingResults(
          false
        );
      }
    };

  /* =================================================
     OPEN PDF
  ================================================= */

  const openResult = (
    fileName
  ) => {
    window.open(
      `${API}/api/results/file/${encodeURIComponent(
        fileName
      )}`,
      "_blank"
    );
  };

  /* =================================================
     SUPPORT
  ================================================= */

  const sendSupport = (
    e
  ) => {
    e.preventDefault();

    if (
      !supportName ||
      !supportPhone ||
      !supportMessage
    ) {
      alert(
        "من فضلك أكمل بيانات التواصل"
      );
      return;
    }

    if (
      !/^01[0125][0-9]{8}$/.test(
        supportPhone
      )
    ) {
      alert(
        "رقم الهاتف غير صحيح"
      );
      return;
    }

    const text =
      `السلام عليكم، أنا ${supportName}\n` +
      `رقم الهاتف: ${supportPhone}\n` +
      `الرسالة: ${supportMessage}`;

    const whatsappNumber =
      "201062261548";

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        text
      )}`,
      "_blank"
    );
  };

  /* =================================================
     ADD REVIEW
  ================================================= */

  const addReview =
    async (e) => {
      e.preventDefault();

      if (
        !reviewName.trim() ||
        !reviewText.trim()
      ) {
        alert(
          "من فضلك اكتب اسمك والتقييم"
        );
        return;
      }

      try {
        const newReview = {
          name:
            reviewName.trim(),
          rating:
            Number(
              reviewRating
            ),
          text:
            reviewText.trim(),
        };

        const response =
          await fetch(
            `${API}/api/reviews`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  newReview
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "فشل إضافة التقييم"
          );
        }

        const savedReview =
          data.review || {
            id: Date.now(),
            ...newReview,
          };

        setReviews(
          (prev) => {
            const updatedReviews =
              [
                savedReview,
                ...prev,
              ];

            localStorage.setItem(
              "mabraf_reviews",
              JSON.stringify(
                updatedReviews
              )
            );

            return updatedReviews;
          }
        );

        setReviewName("");
        setReviewRating(5);
        setReviewText("");

        alert(
          "تم إضافة تقييمك بنجاح ⭐"
        );
      } catch (error) {
        console.error(
          "Add Review Error:",
          error
        );

        alert(
          error.message ||
            "حدث خطأ أثناء إضافة التقييم"
        );
      }
    };

  /* =================================================
     HOME
  ================================================= */

  if (
    page === "home"
  ) {
    return (
      <div className="app">

        <header className="header">
          <h1>
            مبره الفلكي التخصصي
          </h1>

          <p>
            خدماتك الطبية بسهولة وسرعة
          </p>
        </header>

        <main className="container">

          <div className="booking-card">

            <h2>
              مرحبًا بك 👋
            </h2>

            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              اختر الخدمة التي تريدها
            </p>

            <div className="cards-grid">

              <button
                type="button"
                className="selection-card"
                onClick={() =>
                  setPage(
                    "booking"
                  )
                }
              >
                <span className="card-icon">
                  🩺
                </span>

                <span>
                  حجز موعد
                </span>
              </button>

              <button
                type="button"
                className="selection-card"
                onClick={() =>
                  setPage(
                    "track"
                  )
                }
              >
                <span className="card-icon">
                  🎟️
                </span>

                <span>
                  متابعة الحجز
                </span>
              </button>

              <button
                type="button"
                className="selection-card"
                onClick={() =>
                  setPage(
                    "results"
                  )
                }
              >
                <span className="card-icon">
                  🧪
                </span>

                <span>
                  نتائج التحاليل
                </span>
              </button>

              <button
                type="button"
                className="selection-card"
                onClick={() =>
                  setPage(
                    "support"
                  )
                }
              >
                <span className="card-icon">
                  🎧
                </span>

                <span>
                  الدعم الفني
                </span>
              </button>

              <button
                type="button"
                className="selection-card"
                onClick={() =>
                  setPage(
                    "location"
                  )
                }
              >
                <span className="card-icon">
                  📍
                </span>

                <span>
                  موقعنا
                </span>
              </button>

              <button
                type="button"
                className="selection-card"
                onClick={() =>
                  setPage(
                    "reviews"
                  )
                }
              >
                <span className="card-icon">
                  ⭐
                </span>

                <span>
                  تقييمات المرضى
                </span>
              </button>

              <button
                type="button"
                className="selection-card"
                onClick={() => {
                  window.location.href =
                    "/admin";
                }}
              >
                <span className="card-icon">
                  🔐
                </span>

                <span>
                  لوحة الإدارة
                </span>
              </button>

            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =================================================
     TRACK PAGE
  ================================================= */

  if (
    page === "track"
  ) {
    return (
      <div className="app">

        <header className="header">
          <h1>
            مبره الفلكي التخصصي
          </h1>

          <p>
            متابعة الحجز والدور
          </p>
        </header>

        <main className="container">

          <div className="booking-card">

            <button
              type="button"
              onClick={() =>
                setPage("home")
              }
              style={{
                marginBottom:
                  "20px",
              }}
            >
              ← الرئيسية
            </button>

            <h2>
              🎟️ متابعة الحجز
            </h2>

            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              أدخل رقم الهاتف لمعرفة رقم دورك ومتابعة الحجز.
            </p>

            <form
              onSubmit={
                trackBooking
              }
            >

              <div className="input-group">

                <label>
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  value={
                    trackingPhone
                  }
                  onChange={(e) =>
                    setTrackingPhone(
                      e.target.value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  maxLength="11"
                  dir="ltr"
                />

              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={
                  trackingLoading
                }
              >
                {trackingLoading
                  ? "جاري البحث..."
                  : "🔎 متابعة الحجز"}
              </button>

            </form>

            {trackingMessage && (
              <div className="message">
                {trackingMessage}
              </div>
            )}

            {trackedBookings.length >
              0 && (
              <div
                className="selection-section"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                {trackedBookings.map(
                  (
                    booking
                  ) => {

                    const doctorArrivalTime =
                      booking.doctorArrivalTime ||
                      booking.arrivalTime ||
                      "";

                    const currentPosition =
                      Number(
                        booking.currentPosition
                      ) ||
                      1;

                    const queueNumber =
                      Number(
                        booking.queueNumber
                      ) ||
                      currentPosition;

                    const waiting =
                      Math.max(
                        0,
                        Number(
                          booking.beforeCount
                        ) ||
                          0
                      );

                    return (
                      <div
                        key={
                          booking.id
                        }
                        className="selection-card"
                        style={{
                          cursor:
                            "default",
                          marginBottom:
                            "15px",
                        }}
                      >

                        <strong
                          style={{
                            fontSize:
                              "20px",
                          }}
                        >
                          👤{" "}
                          {
                            booking.name
                          }
                        </strong>

                        <span>
                          👨‍⚕️ الطبيب:{" "}
                          {
                            booking.doctor
                          }
                        </span>

                        <span>
                          📅 اليوم:{" "}
                          {
                            booking.date
                          }
                        </span>

                        <span>
                          🎟️ رقم دورك:{" "}
                          <strong>
                            #
                            {
                              queueNumber
                            }
                          </strong>
                        </span>

                        <span>
                          👥 قبلك حاليًا:{" "}
                          <strong>
                            {
                              waiting
                            }
                          </strong>
                        </span>

                        <span>
                          📍 دورك الحالي:{" "}
                          <strong>
                            #
                            {
                              currentPosition
                            }
                          </strong>
                        </span>

                        <div
                          style={{
                            marginTop:
                              "15px",
                            padding:
                              "15px",
                            borderRadius:
                              "12px",
                            background:
                              "#eef8ff",
                            textAlign:
                              "center",
                            fontWeight:
                              "700",
                          }}
                        >
                          🕙 الدكتور سيحضر الساعة:{" "}
                          <span>
                            {doctorArrivalTime ||
                              "لم يتم تحديد الوقت"}
                          </span>
                        </div>

                        {booking.status ===
                          "confirmed" && (
                          <div
                            style={{
                              marginTop:
                                "12px",
                              padding:
                                "12px",
                              borderRadius:
                                "10px",
                              background:
                                "#ecfdf5",
                              color:
                                "#047857",
                              textAlign:
                                "center",
                              fontWeight:
                                "700",
                            }}
                          >
                            ✅ تم تأكيد حجزك  
                          </div>
                        )}

                        {booking.status ===
                          "جديد" && (
                          <div
                            style={{
                              marginTop:
                                "12px",
                              padding:
                                "12px",
                              borderRadius:
                                "10px",
                              background:
                                "#fffbeb",
                              color:
                                "#92400e",
                              textAlign:
                                "center",
                                fontWeight:
                                "700",
                            }}
                          >
                                   🟡 الحجز في انتظار تأكيد 
                   </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>
        </main>
      </div>
    );
  }

  /* =================================================
     RESULTS PAGE
  ================================================= */

  if (
    page === "results"
  ) {
    return (
      <div className="app">

        <header className="header">
          <h1>
            مبره الفلكي التخصصي
          </h1>

          <p>
            نتائج التحاليل الطبية
          </p>
        </header>

        <main className="container">

          <div className="booking-card">

            <button
              type="button"
              onClick={() =>
                setPage("home")
              }
            >
              ← الرئيسية
            </button>

            <h2>
              🧪 نتائج التحاليل
            </h2>

            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              أدخل رقم الهاتف المسجل في المعمل
            </p>

            <form
              onSubmit={
                searchResults
              }
            >

              <div className="input-group">

                <label>
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  value={
                    resultPhone
                  }
                  onChange={(e) =>
                    setResultPhone(
                      e.target.value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  maxLength="11"
                />

              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={
                  searchingResults
                }
              >
                {searchingResults
                  ? "جاري البحث..."
                  : "🔍 البحث عن النتيجة"}
              </button>

            </form>

            {resultMessage && (
              <div className="message">
                {resultMessage}
              </div>
            )}

            {results.length >
              0 && (
              <div className="selection-section">

                <h3>
                  النتائج الموجودة
                </h3>

                {results.map(
                  (result) => (
                    <div
                      key={
                        result.id
                      }
                      className="selection-card"
                      style={{
                        marginBottom:
                          "15px",
                        cursor:
                          "default",
                      }}
                    >

                      <strong>
                        🧪{" "}
                        {
                          result.patientName
                        }
                      </strong>

                      <span>
                        📄{" "}
                        {
                          result.originalFileName
                        }
                      </span>

                      <span>
                        📅{" "}
                        {new Date(
                          result.createdAt
                        ).toLocaleDateString(
                          "ar-EG"
                        )}
                      </span>

                      <button
                        type="button"
                        className="submit-button"
                        onClick={() =>
                          openResult(
                            result.fileName
                          )
                        }
                      >
                        📄 عرض نتيجة التحليل
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        </main>
      </div>
    );
  }

  /* =================================================
     SUPPORT PAGE
  ================================================= */

  if (
    page === "support"
  ) {
    return (
      <div className="app">

        <header className="header">
          <h1>
            مبره الفلكي التخصصي
          </h1>

          <p>
            الدعم الفني وخدمة العملاء
          </p>
        </header>

        <main className="container">

          <div className="booking-card">

            <button
              type="button"
              onClick={() =>
                setPage("home")
              }
            >
              ← الرئيسية
            </button>

            <h2>
              🎧 الدعم الفني
            </h2>

            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              لو عندك مشكلة أو استفسار، ابعتلنا وهنساعدك.
            </p>

            <form
              onSubmit={
                sendSupport
              }
            >

              <div className="input-group">
                <label>
                  الاسم
                </label>

                <input
                  type="text"
                  value={
                    supportName
                  }
                  onChange={(e) =>
                    setSupportName(
                      e.target.value
                    )
                  }
                  placeholder="اكتب اسمك"
                />
              </div>

              <div className="input-group">
                <label>
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  value={
                    supportPhone
                  }
                  onChange={(e) =>
                    setSupportPhone(
                      e.target.value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  maxLength="11"
                />
              </div>

              <div className="input-group">
                <label>
                  المشكلة أو الاستفسار
                </label>

                <textarea
                  value={
                    supportMessage
                  }
                  onChange={(e) =>
                    setSupportMessage(
                      e.target.value
                    )
                  }
                  placeholder="اكتب رسالتك هنا..."
                  rows="5"
                />
              </div>

              <button
                type="submit"
                className="submit-button"
              >
                💬 تواصل عبر واتساب
              </button>

            </form>

          </div>
        </main>
      </div>
    );
  }

  /* =================================================
     LOCATION PAGE
  ================================================= */

  if (
    page === "location"
  ) {
    return (
      <div className="app">

        <header className="header">
          <h1>
            مبره الفلكي التخصصي
          </h1>

          <p>
            موقعنا
          </p>
        </header>

        <main className="container">

          <div className="booking-card">

            <button
              type="button"
              onClick={() =>
                setPage("home")
              }
            >
              ← الرئيسية
            </button>

            <h2>
              📍 موقع مبرة الفلكي
            </h2>

            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              يمكنك معرفة موقعنا وفتح الاتجاهات من خلال Google Maps
            </p>

            <div
              style={{
                width:
                  "100%",
                height:
                  "350px",
                borderRadius:
                  "15px",
                overflow:
                  "hidden",
                marginTop:
                  "20px",
              }}
            >
              <iframe
                title="موقع مبرة الفلكي"
                src="https://www.google.com/maps?q=31.2406503,30.0039572&z=16&output=embed"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                }}
                loading="lazy"
                allowFullScreen
              />
            </div>

            <button
              type="button"
              className="submit-button"
              onClick={() =>
                window.open(
                  MAP_URL,
                  "_blank"
                )
              }
            >
              📍 فتح الموقع على Google Maps
            </button>

          </div>
        </main>
      </div>
    );
  }

  /* =================================================
     REVIEWS PAGE
  ================================================= */

  if (
    page === "reviews"
  ) {
    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce(
              (
                total,
                review
              ) =>
                total +
                Number(
                  review.rating
                ),
              0
            ) /
            reviews.length
          ).toFixed(1)
        : "0";

    return (
      <div className="app">

        <header className="header">
          <h1>
            مبره الفلكي التخصصي
          </h1>

          <p>
            آراء وتقييمات المرضى
          </p>
        </header>

        <main className="container">

          <div className="booking-card">

            <button
              type="button"
              onClick={() =>
                setPage("home")
              }
            >
              ← الرئيسية
            </button>

            <h2>
              ⭐ تقييمات المرضى
            </h2>

            <div
              style={{
                textAlign:
                  "center",
                margin:
                  "20px 0",
              }}
            >
              <h3>
                ⭐ {averageRating}
              </h3>

              <p>
                بناءً على{" "}
                {reviews.length}{" "}
                تقييم
              </p>
            </div>

            <div className="selection-section">

              <h3>
                اكتب تقييمك
              </h3>

              <form
                onSubmit={
                  addReview
                }
              >

                <div className="input-group">

                  <label>
                    الاسم
                  </label>

                  <input
                    type="text"
                    value={
                      reviewName
                    }
                    onChange={(e) =>
                      setReviewName(
                        e.target.value
                      )
                    }
                    placeholder="اسمك"
                  />

                </div>

                <div className="input-group">

                  <label>
                    التقييم
                  </label>

                  <select
                    value={
                      reviewRating
                    }
                    onChange={(e) =>
                      setReviewRating(
                        e.target.value
                      )
                    }
                  >

                    <option value="5">
                      ⭐⭐⭐⭐⭐ ممتاز
                    </option>

                    <option value="4">
                      ⭐⭐⭐⭐ جيد جدًا
                    </option>

                    <option value="3">
                      ⭐⭐⭐ جيد
                    </option>

                    <option value="2">
                      ⭐⭐ مقبول
                    </option>

                    <option value="1">
                      ⭐ سيئ
                    </option>

                  </select>

                </div>

                <div className="input-group">

                  <label>
                    رأيك
                  </label>

                  <textarea
                    value={
                      reviewText
                    }
                    onChange={(e) =>
                      setReviewText(
                        e.target.value
                      )
                    }
                    placeholder="اكتب رأيك عن الخدمة..."
                    rows="4"
                  />

                </div>

                <button
                  type="submit"
                  className="submit-button"
                >
                  ⭐ إرسال التقييم
                </button>

              </form>

            </div>

            <div className="selection-section">

              <h3>
                آراء المرضى
              </h3>

              {reviews.length ===
                0 && (
                <p
                  style={{
                    textAlign:
                      "center",
                  }}
                >
                  لا توجد تقييمات حتى الآن.
                </p>
              )}

              {reviews.map(
                (review) => (
                  <div
                    key={
                      review.id
                    }
                    className="selection-card"
                    style={{
                      marginBottom:
                        "15px",
                      cursor:
                        "default",
                    }}
                  >

                    <strong>
                      {
                        review.name
                      }
                    </strong>

                    <div>
                      {"⭐".repeat(
                        Number(
                          review.rating
                        )
                      )}
                    </div>

                    <p>
                      {
                        review.text
                      }
                    </p>

                  </div>
                )
              )}

            </div>

          </div>
        </main>
      </div>
    );
  }

  /* =================================================
     BOOKING PAGE
  ================================================= */

  return (
    <div className="app">

      <header className="header">

        <h1>
          مبره الفلكي التخصصي
        </h1>

        <p>
          احجز يومك بسهولة وسرعة
        </p>

      </header>

      <main className="container">

        <div className="booking-card">

          <button
            type="button"
            onClick={() =>
              setPage("home")
            }
            style={{
              marginBottom:
                "20px",
            }}
          >
            ← الرئيسية
          </button>

          <h2>
            حجز موعد
          </h2>

          {loadingDoctors && (
            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              جاري تحميل بيانات الأطباء...
            </p>
          )}

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* NAME */}

            <div className="input-group">

              <label>
                الاسم
              </label>

              <input
                type="text"
                name="name"
                value={
                  form.name
                }
                onChange={
                  handleInput
                }
                placeholder="اكتب اسمك"
              />

            </div>

            {/* PHONE */}

            <div className="input-group">

              <label>
                رقم الهاتف
              </label>

              <input
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleInput
                }
                placeholder="01xxxxxxxxx"
                maxLength="11"
              />

            </div>

            {/* SPECIALTIES */}

            <div className="selection-section">

              <h3>
                اختر التخصص
              </h3>

              <div className="cards-grid">

                {specialties.map(
                  (specialty) => (
                    <button
                      type="button"
                      key={
                        specialty
                      }
                      className={`selection-card ${
                        form.specialty ===
                        specialty
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        selectSpecialty(
                          specialty
                        )
                      }
                    >
                      <span className="card-icon">
                        🩺
                      </span>

                      <span>
                        {
                          specialty
                        }
                      </span>
                    </button>
                  )
                )}

              </div>
            </div>

            {/* DOCTORS */}

            {form.specialty && (
              <div className="selection-section">

                <h3>
                  اختر الطبيب
                </h3>

                <div className="cards-grid">

                  {doctors
                    .filter(
                      (doctor) =>
                        doctor.specialty ===
                        form.specialty
                    )
                    .map(
                      (
                        doctor
                      ) => (
                        <button
                          type="button"
                          key={
                            doctor.id ||
                            doctor._id ||
                            doctor.name
                          }
                          className={`selection-card doctor-card ${
                            form.doctor ===
                            doctor.name
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            selectDoctor(
                              doctor.name
                            )
                          }
                        >

                          <span className="doctor-icon">
                            👨‍⚕️
                          </span>

                          <span>
                            {
                              doctor.name
                            }
                          </span>

                        </button>
                      )
                    )}

                </div>
              </div>
            )}

            {/* DAYS */}

            {selectedDoctor && (
              <div className="selection-section">

                <h3>
                  اختر يوم الحجز
                </h3>

                {doctorAvailableDays.length ===
                  0 && (
                  <p
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    لا توجد أيام عمل متاحة لهذا الطبيب حاليًا.
                  </p>
                )}

                <div className="days-grid">

                  {doctorAvailableDays.map(
                    (day) => (
                      <button
                        type="button"
                        key={
                          day.date
                        }
                        className={`day-card ${
                          form.date ===
                          day.date
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          selectDay(
                            day.date
                          )
                        }
                      >

                        <span>
                          {
                            day.dayName
                          }
                        </span>

                      </button>
                    )
                  )}

                </div>
              </div>
            )}

            {/* SELECTED DAY */}

            {form.date && (
              <div
                style={{
                  textAlign:
                    "center",
                  margin:
                    "20px 0",
                  padding:
                    "15px",
                  borderRadius:
                    "12px",
                  background:
                    "#eef8ff",
                  fontWeight:
                    "bold",
                }}
              >
                اليوم المختار:{" "}
                {
                  doctorAvailableDays.find(
                    (day) =>
                      day.date ===
                      form.date
                  )?.dayName
                }
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="submit-button"
              disabled={
                loading
              }
            >
              {loading
                ? "جاري الحجز..."
                : "✅ تأكيد الحجز"}
            </button>

          </form>

          {message && (
            <div
              className="message"
              style={{
                whiteSpace:
                  "pre-line",
              }}
            >
              {message}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;