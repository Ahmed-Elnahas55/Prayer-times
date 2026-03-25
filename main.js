// قائمة المحافظات
const governorates = [
  { ar: "طنطا", en: "Tanta" },
  { ar: "القاهرة", en: "Cairo" },
  { ar: "الإسكندرية", en: "Alexandria" },
  { ar: "الجيزة", en: "Giza" },
  { ar: "بورسعيد", en: "Port Said" },
  { ar: "المنصورة", en: "Mansoura" },
  { ar: "دمياط", en: "Damietta" },
  { ar: "الإسماعيلية", en: "Ismailia" },
  { ar: "أسوان", en: "Aswan" },
  { ar: "الأقصر", en: "Luxor" },
  { ar: "أسيوط", en: "Asyut" },
  { ar: "سوهاج", en: "Sohag" },
  { ar: "السويس", en: "Suez" },
  { ar: "شرم الشيخ", en: "Sharm El Sheikh" },
  { ar: "الغردقة", en: "Hurghada" },
  { ar: "مرسى مطروح", en: "Marsa Matruh" },
];

let currentPrayerTimes = null;
let audio = new Audio("https://praytimes.org/audio/sunni/Adhan-Egypt.mp3"); // صوت أذان مصري جميل
let notificationEnabled = false;
let prayerTimeout = null;

const citySelect = document.getElementById("citySelect");
const prayerTimesDiv = document.getElementById("prayerTimes");
const dateInfo = document.getElementById("dateInfo");
const nextPrayerDiv = document.getElementById("nextPrayer");
const nextNameTime = document.getElementById("nextNameTime");
const remainingEl = document.getElementById("remaining");
const themeBtn = document.getElementById("themeBtn");

function convertTo12Hour(time24) {
  let [hour, minute] = time24.split(":").map(Number);
  const period = hour >= 12 ? "م" : "ص";
  hour = hour % 12 || 12; // 0 → 12، 13 → 1، 24 → 12
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
}

// تعبئة القائمة
governorates.forEach((g) => {
  const option = document.createElement("option");
  option.value = g.en;
  option.textContent = g.ar;
  citySelect.appendChild(option);
});

// تحميل الثيم من localStorage
function loadTheme() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) {
    document.body.classList.add("dark");
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// تبديل الثيم
function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark);

  if (isDark) {
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
}


async function loadPrayerTimes(city) {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Egypt&method=5`,
    );
    const data = await res.json();
    currentPrayerTimes = data.data.timings;

    // التاريخ بالعربي الصحيح
    const d = data.data.date;

    // تحويل الشهر الهجري إلى عربي
    const hijriMonthsArabic = {
      Muharram: "محرم",
      Safar: "صفر",
      "Rabi' al-awwal": "ربيع الأول",
      "Rabi' al-thani": "ربيع الآخر",
      "Jumada al-awwal": "جمادى الأولى",
      "Jumada al-thani": "جمادى الآخرة",
      Rajab: "رجب",
      "Sha'ban": "شعبان",
      Ramadan: "رمضان",
      Shawwal: "شوال",
      "Dhu al-Qi'dah": "ذو القعدة",
      "Dhu al-Hijjah": "ذو الحجة",
    };

    const hijriMonthAr =
      hijriMonthsArabic[d.hijri.month.en] || d.hijri.month.en;

    // تحويل الشهر الميلادي إلى عربي
    const gregorianMonthsArabic = {
      Jan: "يناير",
      Feb: "فبراير",
      Mar: "مارس",
      Apr: "أبريل",
      May: "مايو",
      Jun: "يونيو",
      Jul: "يوليو",
      Aug: "أغسطس",
      Sep: "سبتمبر",
      Oct: "أكتوبر",
      Nov: "نوفمبر",
      Dec: "ديسمبر",
    };

    const readableParts = d.readable.split(" ");
    const monthEn = readableParts[1];
    const gregorianMonthAr = gregorianMonthsArabic[monthEn] || monthEn;

    const formattedDate = `${readableParts[0]} ${gregorianMonthAr} ${readableParts[2]}`;

    dateInfo.innerHTML = `
      <i class="fas fa-calendar"></i>
      <span>${formattedDate} | ${d.hijri.day} ${hijriMonthAr} ${d.hijri.year} هـ</span>
    `;

    const prayers = [
      { name: "الفجر", time: currentPrayerTimes.Fajr },
      { name: "الشروق", time: currentPrayerTimes.Sunrise },
      { name: "الظهر", time: currentPrayerTimes.Dhuhr },
      { name: "العصر", time: currentPrayerTimes.Asr },
      { name: "المغرب", time: currentPrayerTimes.Maghrib },
      { name: "العشاء", time: currentPrayerTimes.Isha },
    ];

    let html = "";
    prayers.forEach((p) => {
      const time12 = convertTo12Hour(p.time);
      html += `
        <div class="prayer-card">
          <h3>${p.name}</h3>
          <p>${time12}</p>
        </div>
      `;
    });
    prayerTimesDiv.innerHTML = html;

    calculateNextPrayer();
  } catch (err) {
    alert("حدث خطأ في تحميل المواقيت، تأكد من الإنترنت");
  }
}

function calculateNextPrayer() {
  if (!currentPrayerTimes) return;

  const now = new Date();
  const prayersList = [
    { name: "الفجر", time: currentPrayerTimes.Fajr },
    { name: "الشروق", time: currentPrayerTimes.Sunrise },
    { name: "الظهر", time: currentPrayerTimes.Dhuhr },
    { name: "العصر", time: currentPrayerTimes.Asr },
    { name: "المغرب", time: currentPrayerTimes.Maghrib },
    { name: "العشاء", time: currentPrayerTimes.Isha },
  ];

  let nextPrayer = prayersList[0];
  let smallestDiff = Infinity;

  prayersList.forEach((prayer) => {
    const [hour, minute] = prayer.time.split(":").map(Number);
    let prayerDate = new Date();
    prayerDate.setHours(hour, minute, 0, 0);

    if (prayerDate < now) prayerDate.setDate(prayerDate.getDate() + 1);

    const diff = prayerDate.getTime() - now.getTime();
    if (diff > 0 && diff < smallestDiff) {
      smallestDiff = diff;
      nextPrayer = prayer;
    }
  });

  const hoursLeft = Math.floor(smallestDiff / 3600000);
  const minutesLeft = Math.floor((smallestDiff % 3600000) / 60000);

  nextNameTime.textContent = `${nextPrayer.name} - ${nextPrayer.time}`;
  remainingEl.textContent = `متبقي: ${hoursLeft} ساعة و ${minutesLeft} دقيقة`;
  nextPrayerDiv.classList.remove("hidden");

  if (prayerTimeout) clearTimeout(prayerTimeout);

  prayerTimeout = setTimeout(() => {
    if (notificationEnabled) {
      new Notification(`🕌 حان وقت ${nextPrayer.name}`, {
        body: `الله أكبر - صلاة ${nextPrayer.name}`,
        icon: "https://cdn-icons-png.flaticon.com/512/3004/3004458.png",
      });
    }
    audio.currentTime = 0;
    audio.play().catch(() => alert("جاري تشغيل الأذان... ارفع الصوت"));
  }, smallestDiff);
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    alert("متصفحك لا يدعم الإشعارات");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    notificationEnabled = true;
    alert("✅ تم تفعيل الإشعارات والأذان بنجاح!");
  } else {
    alert("يرجى السماح بالإشعارات");
  }
}

setInterval(() => {
  if (currentPrayerTimes) calculateNextPrayer();
}, 60000);

window.onload = () => {
  loadTheme();
  citySelect.value = "Tanta";
  loadPrayerTimes("Tanta");

  citySelect.addEventListener("change", () => {
    loadPrayerTimes(citySelect.value);
  });
};
