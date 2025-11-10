
    // 🧩 Tài khoản & mật khẩu admin
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "123456";

    // ✅ Cho phép nhấn Enter để đăng nhập
    document.addEventListener("keyup", function(e) {
      if (e.key === "Enter") checkLogin();
    });

    // 🧭 Kiểm tra đăng nhập
    function checkLogin() {
      const user = document.getElementById("username").value.trim();
      const pass = document.getElementById("password").value.trim();
      const error = document.getElementById("error-msg");

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        // Đăng nhập thành công
        document.getElementById("login-container").style.display = "none";
        document.getElementById("map").style.display = "block";
        document.getElementById("search-box").style.display = "flex";
        initMap();
      } else {
        error.textContent = "❌ Sai tài khoản hoặc mật khẩu!";
      }
    }

    // 🌍 Khởi tạo bản đồ
    function initMap() {
      const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQX9rOqG7YSLYfxWQeeAAf9mOqyF9nnz0vrxCeovj5DniO4NdfrH_NMJKASCjnL23a8bb-_O3yP33Bg/pub?output=csv";
      const fallbackImage = "https://i.postimg.cc/0ySm0FyL/no-image.png";

      function fixImageLink(url) {
        if (!url) return fallbackImage;
        url = url.trim();
        if (url.includes("drive.google.com")) {
          const idMatch = url.match(/[-\w]{25,}/);
          return idMatch ? `https://drive.google.com/uc?export=view&id=${idMatch[0]}` : fallbackImage;
        }
        if (url.startsWith("http")) return url;
        if (url.startsWith("data:image")) return url;
        return fallbackImage;
      }

      const map = L.map('map').setView([10.754202, 106.482959], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const markers = L.markerClusterGroup();
      const allMarkers = [];

      Papa.parse(sheetURL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          results.data.slice(1).forEach((r) => {
            const name = r[1] || "Chưa có tên";
            const address = r[2] || "";
            const lat = parseFloat(r[3]);
            const lng = parseFloat(r[4]);
            const photo = r[5];
            const note = r[6] || "";
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            const fixedPhoto = fixImageLink(photo);
            const marker = L.marker([lat, lng]);
            marker.bindPopup(`
              <div class="popup">
                <strong>${name}</strong><br>
                ${address}<br>
                <img loading="lazy" src="${fixedPhoto}" onerror="this.src='${fallbackImage}'">
                <div style="margin-top:6px"><em>${note}</em></div>
                <button onclick="showQR(${lat},${lng})">📍 Mã QR vị trí</button>
              </div>
            `);
            marker.name = name.toLowerCase();
            marker.address = address.toLowerCase();

            allMarkers.push(marker);
            markers.addLayer(marker);
          });

          map.addLayer(markers);

          // 🔍 Tìm kiếm
          const searchInput = document.getElementById("search-input");
          const searchBtn = document.getElementById("search-button");
          const resetBtn = document.getElementById("reset-button");

          searchBtn.addEventListener("click", searchPlaces);
          searchInput.addEventListener("keyup", (e) => { if (e.key === "Enter") searchPlaces(); });
          resetBtn.addEventListener("click", resetSearch);

          function searchPlaces() {
            const keyword = searchInput.value.trim().toLowerCase();
            if (!keyword) return;
            markers.clearLayers();
            const found = allMarkers.filter(m => m.name.includes(keyword) || m.address.includes(keyword));
            if (found.length === 0) {
              alert("Không tìm thấy kết quả phù hợp.");
            } else {
              found.forEach(m => markers.addLayer(m));
              map.fitBounds(L.featureGroup(found).getBounds());
            }
          }

          function resetSearch() {
            searchInput.value = "";
            markers.clearLayers();
            allMarkers.forEach(m => markers.addLayer(m));
            map.setView([10.754202, 106.482959], 13);
          }
        },
        error: (err) => alert("Không tải được dữ liệu: " + err)
      });
    }

    // 📱 Mã QR vị trí
    function showQR(lat, lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      const qr = new QRious({ value: url, size: 200 });
      const w = window.open("", "_blank", "width=300,height=350");
      w.document.write(`<h3>Mã QR vị trí</h3><img src="${qr.toDataURL()}"><br><a href="${url}" target="_blank">Mở Google Maps</a>`);
    }