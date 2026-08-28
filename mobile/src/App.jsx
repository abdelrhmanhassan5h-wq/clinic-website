import { useState } from "react";
import "./App.css";

const doctors = {
  "باطنة وقلب": [
    {
      name: "د. محمود فتحي",
      workDays: [0, 1, 3, 5],
      times: ["10:00 ص", "11:00 ص", "12:00 م", "1:00 م"],
    },
  ],

  "أسنان": [
    {
      name: "د. روزا",
      workDays: [0, 1, 2, 4],
      times: ["10:00 ص", "11:00 ص", "12:00 م", "1:00 م"],
    },
    {
      name: "د. أحمد عطية",
      workDays: [1, 3, 5],
      times: ["2:00 م", "3:00 م", "4:00 م", "5:00 م"],
    },
  ],

  "نساء وتوليد": [
    {
      name: "د. هبة علي",
      workDays: [0, 2, 4],
      times: ["10:00 ص", "12:00 م", "2:00 م"],
    },
  ],

  "أنف وأذن": [
    {
      name: "د. محمد شكري",
      workDays: [1, 3, 5],
      times: ["11:00 ص", "1:00 م", "3:00 م"],
    },
  ],

  "علاج طبيعي": [
    {
      name: "جهاد أبو المجد",
      workDays: [0, 1, 2, 3, 4],
      times: ["9:00 ص", "10:00 ص", "11:00 ص", "12:00 م"],
    },
  ],

  "عظام": [
    {
      name: "محمود الغندور",
      workDays: [0, 2, 4],
      times: ["4:00 م", "5:00 م", "6:00 م", "7:00 م"],
    },
  ],

  "جلدية": [
    {
      name: "د. أحمد",
      workDays: [1, 3, 5],
      times: ["10:00 ص", "12:00 م", "2:00 م"],
    },
  ],
};

const dayNames = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function getNextDays() {
  const days = [];
  const today = new Date();

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() + i);

    days.push({
      date: date.toISOString().split("T")[0],
      dayNumber: date.getDay(),
      dayName: dayNames[date.getDay()],
      dayDate: date.getDate(),
      month: date.getMonth() + 1,
    });
  }

  return days;
}

function App() {
  const [page, setPage] = useState("home");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialty: "",
    doctor: "",
    date: "",
    time: "",
  });

  const [occupiedTimes, setOccupiedTimes] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [resultPhone, setResultPhone] = useState("");
  const [results, setResults] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const [resultLoading, setResultLoading] = useState(false);

  const availableDays = getNextDays();

  const selectedDoctor =
    form.specialty && form.doctor
      ? doctors[form.specialty]?.find(
          (doctor) => doctor.name === form.doctor
        )
      : null;

  const doctorDays = selectedDoctor
    ? availableDays.filter((day) =>
        selectedDoctor.workDays.includes(day.dayNumber)
      )
    : [];

  const selectSpecialty = (specialty) => {
    setForm({
      ...form,
      specialty,
      doctor: "",
      date: "",
      time: "",
    });

    setOccupiedTimes([]);
    setMessage("");
  };

  const selectDoctor = (doctor) => {
    setForm({
      ...form,
      doctor,
      date: "",
      time: "",
    });

    setOccupiedTimes([]);
    setMessage("");
  };

  const selectDate = async (date) => {
    setForm({
      ...form,
      date,
      time: "",
    });

    setMessage("");

    if (!form.doctor) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/occupied?doctor=${encodeURIComponent(
          form.doctor
        )}&date=${encodeURIComponent(date)}`
      );

      const data = await response.json();

      setOccupiedTimes(data.occupiedTimes || []);
    } catch {
      setOccupiedTimes([]);
    }
  };

  const selectTime = (time) => {
    if (occupiedTimes.includes(time)) {
      setMessage("هذا الموعد محجوز بالفعل");
      return;
    }

    setForm({
      ...form,
      time,
    });

    setMessage("");
  };

  const handleInput = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setMessage("");
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    setMessage("");

    if (
      !form.name ||
      !form.phone ||
      !form.specialty ||
      !form.doctor ||
      !form.date ||
      !form.time
    ) {
      setMessage("من فضلك أكمل جميع بيانات الحجز");
      return;
    }

    if (!/^01[0125][0-9]{8}$/.test(form.phone)) {
      setMessage("رقم الهاتف المصري غير صحيح");
      return;
    }

    if (occupiedTimes.includes(form.time)) {
      setMessage("هذا الموعد محجوز بالفعل");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "حدث خطأ أثناء الحجز"
        );
      }

      setMessage(
        `تم الحجز بنجاح ✅ ${
          data.booking?.queueNumber
            ? `رقم الدور: ${data.booking.queueNumber}`
            : ""
        }`
      );

      setOccupiedTimes((prev) => [
        ...prev,
        form.time,
      ]);

      setForm({
        name: "",
        phone: "",
        specialty: form.specialty,
        doctor: form.doctor,
        date: form.date,
        time: "",
      });
    } catch (error) {
      setMessage(
        error.message ||
          "حدث خطأ في الاتصال بالسيرفر"
      );
    } finally {
      setLoading(false);
    }
  };

  const searchResults = async (e) => {
    e.preventDefault();

    setResultMessage("");
    setResults([]);

    if (!/^01[0125][0-9]{8}$/.test(resultPhone)) {
      setResultMessage("رقم الهاتف المصري غير صحيح");
      return;
    }

    try {
      setResultLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/results/search?phone=${encodeURIComponent(
          resultPhone
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "لا توجد نتائج"
        );
      }

      setResults(data.results || []);

      if (!data.results?.length) {
        setResultMessage("لا توجد نتائج لهذا الرقم");
      }
    } catch (error) {
      setResultMessage(
        error.message || "حدث خطأ أثناء البحث"
      );
    } finally {
      setResultLoading(false);
    }
  };

  return (
    <div className="mobile-app" dir="rtl">

      {/* HEADER */}

      <header className="mobile-header">
        <div className="logo-circle">🧪</div>

        <div>
          <h1>مبراة الفلكي</h1>
          <p>عيادتك في مكان واحد</p>
        </div>
      </header>

      {/* NAVIGATION */}

      <div className="mobile-nav">
        <button
          className={page === "home" ? "nav-active" : ""}
          onClick={() => setPage("home")}
        >
          🏠
          <span>الرئيسية</span>
        </button>

        <button
          className={page === "booking" ? "nav-active" : ""}
          onClick={() => setPage("booking")}
        >
          📅
          <span>حجز موعد</span>
        </button>

        <button
          className={page === "results" ? "nav-active" : ""}
          onClick={() => setPage("results")}
        >
          📄
          <span>نتائج التحاليل</span>
        </button>
      </div>

      {/* HOME */}

      {page === "home" && (
        <main className="mobile-content">

          <section className="hero-mobile">
            <div className="hero-icon">🏥</div>

            <h2>
              أهلاً بيك في
              <br />
              <span>مبراة الفلكي</span>
            </h2>

            <p>
              احجز موعدك أو تابع نتائج تحاليلك
              بسهولة وأمان
            </p>

            <button
              className="main-button"
              onClick={() => setPage("booking")}
            >
              📅 احجز موعدك الآن
            </button>

            <button
              className="secondary-button"
              onClick={() => setPage("results")}
            >
              📄 البحث عن نتيجة تحليل
            </button>
          </section>

          <section className="features">

            <div className="feature-card">
              <div>📅</div>
              <h3>حجز سريع</h3>
              <p>احجز موعدك في دقائق</p>
            </div>

            <div className="feature-card">
              <div>👨‍⚕️</div>
              <h3>أفضل الأطباء</h3>
              <p>اختار الطبيب المناسب</p>
            </div>

            <div className="feature-card">
              <div>📄</div>
              <h3>نتائجك بسهولة</h3>
              <p>شوف نتيجة التحليل برقمك</p>
            </div>

          </section>
        </main>
      )}

      {/* BOOKING */}

      {page === "booking" && (
        <main className="mobile-content">

          <div className="mobile-card">

            <div className="section-title">
              <span>📅</span>
              <div>
                <h2>حجز موعد</h2>
                <p>اختار بيانات الموعد</p>
              </div>
            </div>

            <form onSubmit={handleBooking}>

              <div className="field">
                <label>الاسم</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInput}
                  placeholder="اكتب اسمك بالكامل"
                />
              </div>

              <div className="field">
                <label>رقم الهاتف</label>

                <input
                  className="phone-input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleInput}
                  placeholder="01xxxxxxxxx"
                  maxLength="11"
                  inputMode="numeric"
                />
              </div>

              <div className="selection-block">

                <h3>اختر التخصص</h3>

                <div className="mobile-grid">

                  {Object.keys(doctors).map(
                    (specialty) => (
                      <button
                        type="button"
                        key={specialty}
                        className={
                          form.specialty === specialty
                            ? "choice-card selected"
                            : "choice-card"
                        }
                        onClick={() =>
                          selectSpecialty(
                            specialty
                          )
                        }
                      >
                        <span>🩺</span>
                        <strong>{specialty}</strong>
                      </button>
                    )
                  )}

                </div>
              </div>

              {form.specialty && (
                <div className="selection-block">

                  <h3>اختر الطبيب</h3>

                  <div className="mobile-grid">

                    {doctors[form.specialty].map(
                      (doctor) => (
                        <button
                          type="button"
                          key={doctor.name}
                          className={
                            form.doctor === doctor.name
                              ? "choice-card doctor selected"
                              : "choice-card doctor"
                          }
                          onClick={() =>
                            selectDoctor(
                              doctor.name
                            )
                          }
                        >
                          <span>👨‍⚕️</span>

                          <strong>
                            {doctor.name}
                          </strong>
                        </button>
                      )
                    )}

                  </div>
                </div>
              )}

              {selectedDoctor && (
                <div className="selection-block">

                  <h3>اختر التاريخ</h3>

                  <div className="days-list">

                    {doctorDays.map((day) => (
                      <button
                        type="button"
                        key={day.date}
                        className={
                          form.date === day.date
                            ? "date-card selected"
                            : "date-card"
                        }
                        onClick={() =>
                          selectDate(day.date)
                        }
                      >
                        <span>
                          {day.dayName}
                        </span>

                        <strong>
                          {day.dayDate}/
                          {day.month}
                        </strong>

                        {form.date === day.date && (
                          <small>
                            ✓ تم الاختيار
                          </small>
                        )}
                      </button>
                    ))}

                  </div>

                </div>
              )}

              {form.date && selectedDoctor && (
                <div className="selection-block">

                  <h3>اختر الموعد</h3>

                  <div className="times-list">

                    {selectedDoctor.times.map(
                      (time) => {

                        const occupied =
                          occupiedTimes.includes(
                            time
                          );

                        return (
                          <button
                            type="button"
                            key={time}
                            disabled={occupied}
                            className={
                              occupied
                                ? "time-button occupied"
                                : form.time === time
                                ? "time-button selected"
                                : "time-button"
                            }
                            onClick={() =>
                              selectTime(time)
                            }
                          >
                            {occupied
                              ? "🔴 محجوز"
                              : `🟢 ${time}`}
                          </button>
                        );
                      }
                    )}

                  </div>

                </div>
              )}

              <button
                className="main-button submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "جاري الحجز..."
                  : "تأكيد الحجز"}
              </button>

            </form>

            {message && (
              <div className="mobile-message">
                {message}
              </div>
            )}

          </div>
        </main>
      )}

      {/* RESULTS */}

      {page === "results" && (
        <main className="mobile-content">

          <div className="mobile-card">

            <div className="section-title">
              <span>📄</span>

              <div>
                <h2>نتائج التحاليل</h2>
                <p>
                  أدخل رقم هاتفك للبحث عن نتيجتك
                </p>
              </div>
            </div>

            <form onSubmit={searchResults}>

              <div className="field">

                <label>رقم الهاتف</label>

                <input
                  className="phone-input result-phone"
                  type="tel"
                  value={resultPhone}
                  onChange={(e) =>
                    setResultPhone(
                      e.target.value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  maxLength="11"
                  inputMode="numeric"
                />

              </div>

              <button
                className="main-button submit"
                type="submit"
                disabled={resultLoading}
              >
                {resultLoading
                  ? "جاري البحث..."
                  : "🔎 البحث عن النتيجة"}
              </button>

            </form>

            {resultMessage && (
              <div className="mobile-message">
                {resultMessage}
              </div>
            )}

            {results.length > 0 && (
              <div className="results-list">

                <h3>النتائج الموجودة</h3>

                {results.map((result) => (
                  <div
                    className="result-card"
                    key={result.id}
                  >

                    <div className="result-icon">
                      📄
                    </div>

                    <div className="result-info">

                      <strong>
                        {result.patientName}
                      </strong>

                      <span>
                        {result.originalFileName}
                      </span>

                    </div>

                    <a
                      className="view-result"
                      href={`http://localhost:5000/api/results/file/${encodeURIComponent(
                        result.fileName
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      فتح
                    </a>

                  </div>
                ))}

              </div>
            )}

          </div>
        </main>
      )}

      <footer className="mobile-footer">
        <p>© 2026 مبراة الفلكي</p>
        <span>رعايتك تهمنا ❤️</span>
      </footer>

    </div>
  );
}

export default App;