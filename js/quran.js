let allSurahs = [];

//API
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    allSurahs = data.data;
    renderSurahs(allSurahs);
  })
  .catch(err => {
    console.error("خطأ في تحميل السور:", err);
    document.getElementById("surahs-list").innerHTML = "<p style='color:red; text-align:center;'>فشل في تحميل السور. حاول مرة أخرى.</p>";
  });

// Smart Search Removal Function
function removeTashkeel(text) {
  return text
    .replace(/[\u0617-\u061A\u064B-\u0652]/g, '')
    .replace(/آ|أ|إ|ٱ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

// surahs Card
function renderSurahs(data) {
  const container = document.getElementById("surahs-list");
  if (!container) return;
  
  container.innerHTML = "";

  data.forEach(surah => {
    const div = document.createElement("div");
    div.className = "surah";
    div.innerHTML = `
      <h3>${surah.number}. ${surah.name}</h3>
      <small>${surah.numberOfAyahs} آية • ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</small>
    `;
    div.onclick = () => loadSurah(surah.number, surah.name);
    container.appendChild(div);
  });
}

// Download Surah Text
function loadSurah(id, name) {
  document.getElementById("surahs-list").style.display = "none";
  document.getElementById("surah-view").style.display = "block";
  
  document.getElementById("surah-title").textContent = `${name}`;
  document.getElementById("surah-text").innerHTML = "⏳ جاري تحميل السورة...";

 fetch(`https://api.alquran.cloud/v1/surah/${id}/ar`)
  .then(res => res.json())
  .then(data => {
    let ayahs = data.data.ayahs;

    // إزالة البسملة من أول آية لو موجودة
    if (ayahs[0].text.startsWith("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")) {
      ayahs[0].text = ayahs[0].text.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "").trim();
    }

    let text = ayahs
      .map((ayah, index) => `${ayah.text} <span class="ayah-number">﴿${index + 1}﴾</span>`)
      .join(" ");

    document.getElementById("surah-text").innerHTML = text;
  });
}

// btn Back
function goBack() {
  document.getElementById("surahs-list").style.display = "block";
  document.getElementById("surah-view").style.display = "none";
}

// Smart search without diacritics
document.getElementById("searchInput").addEventListener("input", function () {
  const value = this.value.trim();
  
  if (value === "") {
    renderSurahs(allSurahs);
    return;
  }

  const normalizedSearch = removeTashkeel(value);

  const filtered = allSurahs.filter(surah => {
    const normalizedName = removeTashkeel(surah.name);
    return normalizedName.includes(normalizedSearch);
  });

  renderSurahs(filtered);
});
// Theme Dark/light
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