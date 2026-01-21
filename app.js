// app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig, whatsappNumber } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const productsRef = ref(db, "products");

const adminPanel = document.getElementById("admin-panel");
const productList = document.getElementById("product-list");
const logo = document.getElementById("brand-logo");

// 1. 로그인 상태 확인
onAuthStateChanged(auth, (user) => {
  if (user) {
    adminPanel.classList.add("active");
    renderProducts(true);
  } else {
    adminPanel.classList.remove("active");
    renderProducts(false);
  }
});

// 2. 시크릿 로그인 (5번 클릭)
let clicks = 0;
let timer;

logo.addEventListener("click", (e) => {
  e.preventDefault();
  clicks++;
  logo.style.transform = "scale(1.2)";
  setTimeout(() => (logo.style.transform = "scale(1)"), 100);

  clearTimeout(timer);
  timer = setTimeout(() => (clicks = 0), 2000);

  if (clicks === 5) {
    clicks = 0;
    if (auth.currentUser) return alert("Already logged in! 🌻");

    const email = prompt("🌻 Admin Email:");
    if (!email) return;
    const password = prompt("🌻 Password:");
    if (!password) return;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => alert("Hello Admin! ✨"))
      .catch((err) => alert("Oops: " + err.message));
  }
});

// 3. 로그아웃
document.getElementById("btn-logout").addEventListener("click", () => {
  signOut(auth).then(() => alert("See you later! 👋"));
});

// 4. 상품 추가
document.getElementById("btn-add").addEventListener("click", () => {
  const title = document.getElementById("p-title").value;
  const price = document.getElementById("p-price").value;
  const desc = document.getElementById("p-desc").value;

  if (!title || !price) return alert("Please write Title & Price!");

  push(productsRef, {
    title,
    price, // 숫자
    desc,
    createdAt: Date.now(),
  })
    .then(() => {
      alert("Added! 🌻");
      document.getElementById("p-title").value = "";
      document.getElementById("p-price").value = "";
      document.getElementById("p-desc").value = "";
    })
    .catch((err) => alert("You need to login first!"));
});

// 5. 상품 목록 렌더링 (뱃지 & 달러 표시)
function renderProducts(isAdmin) {
  onValue(productsRef, (snapshot) => {
    productList.innerHTML = "";
    const data = snapshot.val();

    if (!data) {
      productList.innerHTML = `
                <div class="empty-state">
                    No items yet.<br>Click the logo 5 times to add one!
                </div>
            `;
      return;
    }

    // 최신순으로 정렬
    const keys = Object.keys(data).reverse();

    keys.forEach((key, index) => {
      const p = data[key];
      const waLink = `https://wa.me/${whatsappNumber}`;

      const deleteBtn = isAdmin
        ? `<button class="btn-delete" onclick="deleteItem('${key}')">✕</button>`
        : "";

      // 자동 달러 표시 ($20)
      const displayPrice = `$${p.price}`;

      // 최신 2개 상품에 NUEVO 뱃지 붙이기
      let badgeHtml = "";
      if (index < 2) {
        badgeHtml = '<div class="badge-new">NUEVO</div>';
      }

      const html = `
                <div class="card">
                    ${badgeHtml}
                    <div class="art-wrapper">
                        <div class="sunflower-icon">🌻</div>
                        ${deleteBtn}
                    </div>
                    <div class="card-info">
                        <h3 class="p-title">${p.title}</h3>
                        <div class="price-tag">${displayPrice}</div>
                        <p class="p-desc">${p.desc}</p>
                        <a href="${waLink}" target="_blank" class="btn-wa">
                            Pedir por WhatsApp 💬
                        </a>
                    </div>
                </div>
            `;
      productList.innerHTML += html;
    });
  });
}

// 6. 삭제 기능
window.deleteItem = (key) => {
  if (confirm("Delete this cute item?")) {
    remove(ref(db, `products/${key}`));
  }
};
