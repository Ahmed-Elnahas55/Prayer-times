// ====================== القرّاء والسيرفرات ======================
const reciters = {
  afs: {
    name: "مشاري العفاسي",
    servers: ["https://server8.mp3quran.net/afs/"],
  },
  husr: { name: "الحصري", servers: ["https://server8.mp3quran.net/husr/"] },
  yasser: {
    name: "ياسر الدوسري",
    servers: ["https://download.quranicaudio.com/quran/yasser_ad-dussary/"],
  },
  jaber: {
    name: "علي جابر",
    servers: ["https://download.quranicaudio.com/quran/ali_jaber/"],
  },
  ayyoub: {
    name: "محمد أيوب",
    servers: [
      "https://server8.mp3quran.net/ayyub/",
      "https://cdn.islamic.network/quran/audio/128/ayyoub/",
    ],
  },
};

let currentReciter = "afs";
let allSurahs = [];
let currentSurahIndex = 0;

// ====================== عناصر الصفحة ======================
const reciterSelect = document.getElementById("reciterSelect");
const surahsContainer = document.getElementById("surahs-list");
const surahView = document.getElementById("surah-view");
const surahTitle = document.getElementById("surah-title");
const audio = document.getElementById("quranAudio");
const searchInput = document.getElementById("searchInput");

// ====================== تحميل السور ======================
fetch("https://api.alquran.cloud/v1/surah")
  .then((res) => res.json())
  .then((data) => {
    allSurahs = data.data;
    renderSurahs(allSurahs);
    surahsContainer.style.display = "grid";
  })
  .catch(() => {
    alert("مشكلة في تحميل السور");
    allSurahs = Array.from({ length: 114 }, (_, i) => ({
      number: i + 1,
      name: `سورة ${i + 1}`,
      numberOfAyahs: 7,
    }));
    renderSurahs(allSurahs);
    surahsContainer.style.display = "grid";
  });

// ====================== بناء select ======================
Object.keys(reciters).forEach((key) => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = reciters[key].name;
  reciterSelect.appendChild(option);
});

reciterSelect.addEventListener("change", () => {
  currentReciter = reciterSelect.value;
  if (surahView.style.display === "block") {
    playCurrentSurah();
  }
});

// ====================== Veiw Surah ======================
function renderSurahs(data) {
  surahsContainer.innerHTML = "";

  data.forEach((surah, index) => {
    const card = document.createElement("div");
    card.className = "surah";

    const title = document.createElement("h3");
    title.textContent = `${surah.number}. ${surah.name}`;

    const ayahCount = document.createElement("small");
    ayahCount.textContent = `${surah.numberOfAyahs} آية`;

    card.appendChild(title);
    card.appendChild(ayahCount);

    card.addEventListener("click", () => {
      currentSurahIndex = index;
      playCurrentSurah();
      surahsContainer.style.display = "none";
      surahView.style.display = "block";
    });

    surahsContainer.appendChild(card);
  });
}

// ====================== تشغيل السورة الحالية ======================
function playCurrentSurah() {
  const surah = allSurahs[currentSurahIndex];
  if (!surah) return;

  surahTitle.textContent = `${surah.name}`;
  const formattedId = String(surah.number).padStart(3, "0");
  const reciter = reciters[currentReciter];

  if (reciter.servers.length > 1) {
    playWithFallback(reciter.servers, formattedId, 0);
  } else {
    audio.src = `${reciter.servers[0]}${formattedId}.mp3`;
    audio.play().catch(() => {
      alert("الصوت مش شغال");
    });
  }
}

// ====================== fallback ======================
function playWithFallback(servers, id, index) {
  if (index >= servers.length) {
    alert("الصوت مش متوفر للقارئ ده 😢");
    return;
  }

  audio.src = `${servers[index]}${id}.mp3`;
  audio.play().catch(() => playWithFallback(servers, id, index + 1));
  audio.onerror = () => playWithFallback(servers, id, index + 1);
}

// ====================== Auto Next ======================
audio.addEventListener("ended", () => {
  currentSurahIndex++;
  if (currentSurahIndex >= allSurahs.length) currentSurahIndex = 0;
  playCurrentSurah();
});

// ====================== Btn Back ======================
function goBack() {
  surahsContainer.style.display = "grid";
  surahView.style.display = "none";
  audio.pause();
}

// ====================== Search ======================
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = allSurahs.filter((surah) =>
    surah.name.toLowerCase().includes(term),
  );
  renderSurahs(filtered);
});
// ====================== Theme Dark/light ======================
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