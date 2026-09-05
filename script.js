
/* =========================================================
   JASA KAMPUNG
   script.js
   Mobile First • No Backend Required
========================================================= */


/* =========================================================
   KONFIGURASI
========================================================= */

const CONFIG = {
    whatsapp: "6289614001997", // GANTI dengan nomor WhatsApp Anda
    deliveryFee: 10000,
    storageCart: "jasa_kampung_cart",
    storageOrders: "jasa_kampung_orders",
    storageLocation: "jasa_kampung_location"
};


/* =========================================================
   STATE
========================================================= */

let cart = loadCart();
let orders = loadOrders();


/* =========================================================
   DOM
========================================================= */

const searchInput = document.getElementById("searchInput");
const serviceGrid = document.getElementById("serviceGrid");
const serviceCount = document.getElementById("serviceCount");
const noResult = document.getElementById("noResult");

const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const cartModal = document.getElementById("cartModal");
const checkoutModal = document.getElementById("checkoutModal");

const cartItems = document.getElementById("cartItems");

const subtotalElement = document.getElementById("subtotal");
const shippingElement = document.getElementById("shipping");
const totalElement = document.getElementById("total");

const checkoutTotal = document.getElementById("checkoutTotal");

const checkoutForm = document.getElementById("checkoutForm");

const currentLocation = document.getElementById("currentLocation");
const locationBtn = document.getElementById("locationBtn");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    updateCart();

    loadSavedLocation();

    setupSearch();

    setupCategories();

    setupAddButtons();

    setupNavigation();

    setupModals();

    setupDeliveryCalculation();

    setupCheckout();

});


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(number) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function saveCart() {

    localStorage.setItem(
        CONFIG.storageCart,
        JSON.stringify(cart)
    );

}


function loadCart() {

    try {

        const data = localStorage.getItem(
            CONFIG.storageCart
        );

        return data ? JSON.parse(data) : [];

    } catch (error) {

        console.error("Cart error:", error);

        return [];

    }

}


function saveOrders() {

    localStorage.setItem(
        CONFIG.storageOrders,
        JSON.stringify(orders)
    );

}


function loadOrders() {

    try {

        const data = localStorage.getItem(
            CONFIG.storageOrders
        );

        return data ? JSON.parse(data) : [];

    } catch (error) {

        console.error("Order error:", error);

        return [];

    }

}


/* =========================================================
   ADD BUTTON
========================================================= */

function setupAddButtons() {

    const buttons =
        document.querySelectorAll(".add-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const name =
                button.dataset.name;

            const price =
                Number(button.dataset.price);

            const unit =
                button.dataset.unit;

            addToCart(
                name,
                price,
                unit
            );

        });

    });

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(name, price, unit) {

    const existing =
        cart.find(item => item.name === name);

    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            id: Date.now(),
            name,
            price,
            unit,
            quantity: 1
        });

    }

    saveCart();

    updateCart();

    showToast(
        `${name} ditambahkan ke keranjang`
    );

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    const quantity =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    const subtotal =
        cart.reduce(
            (total, item) =>
                total +
                item.price *
                item.quantity,
            0
        );

    cartCount.textContent = quantity;

    cartTotal.textContent =
        formatRupiah(subtotal);

    renderCart();

    updateCheckoutTotal();

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    if (!cart.length) {

        cartItems.innerHTML = `
            <div class="empty-cart">

                <i class="fa-solid fa-cart-shopping"></i>

                <h3>
                    Keranjang kosong
                </h3>

                <p>
                    Tambahkan jasa terlebih dahulu.
                </p>

            </div>
        `;

        subtotalElement.textContent =
            formatRupiah(0);

        shippingElement.textContent =
            formatRupiah(0);

        totalElement.textContent =
            formatRupiah(0);

        return;

    }


    cartItems.innerHTML = cart.map(item => {

        const itemTotal =
            item.price * item.quantity;

        return `

            <div class="cart-item">

                <div class="cart-item-info">

                    <h3>
                        ${escapeHTML(item.name)}
                    </h3>

                    <span>
                        ${formatRupiah(item.price)}
                        /${escapeHTML(item.unit)}
                    </span>

                    <div class="quantity-control">

                        <button
                            type="button"
                            onclick="decreaseQuantity(${item.id})">

                            <i class="fa-solid fa-minus"></i>

                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            onclick="increaseQuantity(${item.id})">

                            <i class="fa-solid fa-plus"></i>

                        </button>

                    </div>

                </div>

                <div class="cart-item-price">

                    ${formatRupiah(itemTotal)}

                </div>

            </div>

        `;

    }).join("");


    const subtotal =
        calculateSubtotal();

    const shipping =
        getShippingFee();

    const total =
        subtotal + shipping;


    subtotalElement.textContent =
        formatRupiah(subtotal);

    shippingElement.textContent =
        formatRupiah(shipping);

    totalElement.textContent =
        formatRupiah(total);

}


/* =========================================================
   INCREASE
========================================================= */

function increaseQuantity(id) {

    const item =
        cart.find(item => item.id === id);

    if (!item) return;

    item.quantity++;

    saveCart();

    updateCart();

}


/* =========================================================
   DECREASE
========================================================= */

function decreaseQuantity(id) {

    const item =
        cart.find(item => item.id === id);

    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {

        cart =
            cart.filter(
                item => item.id !== id
            );

    }

    saveCart();

    updateCart();

}


/* =========================================================
   SUBTOTAL
========================================================= */

function calculateSubtotal() {

    return cart.reduce(
        (total, item) =>
            total +
            item.price *
            item.quantity,
        0
    );

}


/* =========================================================
   SHIPPING
========================================================= */

function getShippingFee() {

    const delivery =
        document.querySelector(
            'input[name="delivery"]:checked'
        );

    if (!delivery) {
        return 0;
    }

    if (delivery.value === "delivery") {
        return CONFIG.deliveryFee;
    }

    return 0;

}


/* =========================================================
   DELIVERY CHANGE
========================================================= */

function setupDeliveryCalculation() {

    const deliveryInputs =
        document.querySelectorAll(
            'input[name="delivery"]'
        );

    deliveryInputs.forEach(input => {

        input.addEventListener(
            "change",
            () => {

                renderCart();

                updateCheckoutTotal();

            }
        );

    });

}


/* =========================================================
   CHECKOUT TOTAL
========================================================= */

function updateCheckoutTotal() {

    if (!checkoutTotal) return;

    const subtotal =
        calculateSubtotal();

    const shipping =
        getShippingFee();

    const total =
        subtotal + shipping;

    checkoutTotal.textContent =
        formatRupiah(total);

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    renderCart();

    cartModal.hidden = false;

    document.body.style.overflow = "hidden";

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCart() {

    cartModal.hidden = true;

    document.body.style.overflow = "";

}


/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout() {

    if (!cart.length) {

        showToast(
            "Keranjang masih kosong"
        );

        return;

    }

    closeCart();

    updateCheckoutTotal();

    checkoutModal.hidden = false;

    document.body.style.overflow = "hidden";

}


function closeCheckout() {

    checkoutModal.hidden = true;

    document.body.style.overflow = "";

}


/* =========================================================
   CHECKOUT FORM
========================================================= */

function setupCheckout() {

    if (!checkoutForm) return;

    checkoutForm.addEventListener(
        "submit",
        handleCheckout
    );

}


/* =========================================================
   HANDLE CHECKOUT
========================================================= */

function handleCheckout(event) {

    event.preventDefault();


    if (!cart.length) {

        showToast(
            "Keranjang masih kosong"
        );

        return;

    }


    const name =
        document.getElementById(
            "name"
        ).value.trim();


    const phone =
        document.getElementById(
            "phone"
        ).value.trim();


    const address =
        document.getElementById(
            "address"
        ).value.trim();


    const payment =
        document.getElementById(
            "payment"
        ).value;


    const note =
        document.getElementById(
            "note"
        ).value.trim();


    const delivery =
        document.querySelector(
            'input[name="delivery"]:checked'
        );


    if (!name ||
        !phone ||
        !address ||
        !payment ||
        !delivery) {

        showToast(
            "Lengkapi data pesanan"
        );

        return;

    }


    const subtotal =
        calculateSubtotal();


    const shipping =
        delivery.value === "delivery"
            ? CONFIG.deliveryFee
            : 0;


    const total =
        subtotal + shipping;


    const orderId =
        createOrderId();


    const order = {

        id: orderId,

        date:
            new Date().toISOString(),

        customer: {

            name,
            phone,
            address

        },

        items:
            JSON.parse(
                JSON.stringify(cart)
            ),

        delivery:
            delivery.value,

        payment,

        note,

        subtotal,

        shipping,

        total,

        status:
            "Menunggu"

    };


    orders.unshift(order);

    saveOrders();


    const whatsappMessage =
        createWhatsAppMessage(order);


    openWhatsApp(
        whatsappMessage
    );


    cart = [];

    saveCart();

    updateCart();


    checkoutForm.reset();


    const pickup =
        document.querySelector(
            'input[name="delivery"][value="pickup"]'
        );

    if (pickup) {
        pickup.checked = true;
    }


    closeCheckout();

    showToast(
        "Pesanan berhasil dibuat"
    );

}


/* =========================================================
   ORDER ID
========================================================= */

function createOrderId() {

    const now = new Date();

    const date =
        now.toISOString()
            .slice(0, 10)
            .replaceAll("-", "");


    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );


    return `JK-${date}-${random}`;

}


/* =========================================================
   WHATSAPP MESSAGE
========================================================= */

function createWhatsAppMessage(order) {

    let message =
        `*PESANAN JASA KAMPUNG*%0A`;

    message +=
        `%0A*Order:* ${order.id}`;

    message +=
        `%0A*Nama:* ${order.customer.name}`;

    message +=
        `%0A*WhatsApp:* ${order.customer.phone}`;

    message +=
        `%0A*Alamat:* ${order.customer.address}`;


    message +=
        `%0A%0A*DETAIL PESANAN*`;


    order.items.forEach((item, index) => {

        const itemTotal =
            item.price *
            item.quantity;


        message +=
            `%0A${index + 1}. ` +
            `${item.name} ` +
            `x${item.quantity} ` +
            `= ${formatRupiah(itemTotal)}`;

    });


    message +=
        `%0A%0ASubtotal: ${formatRupiah(order.subtotal)}`;

    message +=
        `%0AOngkir: ${formatRupiah(order.shipping)}`;

    message +=
        `%0A*TOTAL: ${formatRupiah(order.total)}*`;

    message +=
        `%0APengantaran: ${order.delivery === "delivery" ? "Diantar" : "Ambil sendiri"}`;

    message +=
        `%0APembayaran: ${order.payment}`;


    if (order.note) {

        message +=
            `%0ACatatan: ${order.note}`;

    }


    message +=
        `%0A%0AMohon konfirmasi pesanan saya.`;

    return message;

}


/* =========================================================
   OPEN WHATSAPP
========================================================= */

function openWhatsApp(message) {

    const url =
        `https://wa.me/${CONFIG.whatsapp}?text=${message}`;

    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    if (!searchInput) return;

    searchInput.addEventListener(
        "input",
        filterServices
    );

}


function filterServices() {

    const keyword =
        searchInput.value
            .toLowerCase()
            .trim();


    const cards =
        document.querySelectorAll(
            ".service-card"
        );


    let visible = 0;


    cards.forEach(card => {

        const name =
            card.dataset.name
                .toLowerCase();


        const description =
            card.querySelector("p")
                ?.textContent
                .toLowerCase() || "";


        const matched =
            name.includes(keyword) ||
            description.includes(keyword);


        card.style.display =
            matched
                ? ""
                : "none";


        if (matched) {
            visible++;
        }

    });


    updateServiceCount(
        visible
    );


    noResult.hidden =
        visible !== 0;

}


/* =========================================================
   CATEGORIES
========================================================= */

function setupCategories() {

    const categories =
        document.querySelectorAll(
            ".category"
        );


    categories.forEach(category => {

        category.addEventListener(
            "click",
            () => {

                categories.forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );


                category.classList.add(
                    "active"
                );


                const selected =
                    category.dataset.category;


                filterCategory(
                    selected
                );

            }
        );

    });

}


function filterCategory(category) {

    const cards =
        document.querySelectorAll(
            ".service-card"
        );


    let visible = 0;


    cards.forEach(card => {

        const match =
            category === "all" ||
            card.dataset.category === category;


        card.style.display =
            match
                ? ""
                : "none";


        if (match) {
            visible++;
        }

    });


    updateServiceCount(
        visible
    );


    noResult.hidden =
        visible !== 0;

}


/* =========================================================
   SERVICE COUNT
========================================================= */

function updateServiceCount(count) {

    serviceCount.textContent =
        `${count} jasa`;

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const page =
                    item.dataset.page;


                navItems.forEach(nav =>
                    nav.classList.remove(
                        "active"
                    )
                );


                item.classList.add(
                    "active"
                );


                if (page === "home") {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }


                if (page === "services") {

                    scrollToServices();

                }


                if (page === "cart") {

                    openCart();

                }


                if (page === "orders") {

                    openOrders();

                }


                if (page === "profile") {

                    openProfile();

                }

            }
        );

    });

}


/* =========================================================
   FIND SERVICE
========================================================= */

const findServiceBtn =
    document.getElementById(
        "findServiceBtn"
    );


if (findServiceBtn) {

    findServiceBtn.addEventListener(
        "click",
        scrollToServices
    );

}


function scrollToServices() {

    const services =
        document.getElementById(
            "services"
        );


    if (!services) return;


    services.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   CART BUTTON
========================================================= */

if (cartButton) {

    cartButton.addEventListener(
        "click",
        openCart
    );

}


/* =========================================================
   MODALS
========================================================= */

function setupModals() {

    const closeCartButton =
        document.getElementById(
            "closeCart"
        );


    const closeCheckoutButton =
        document.getElementById(
            "closeCheckout"
        );


    const checkoutButton =
        document.getElementById(
            "checkoutBtn"
        );


    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            closeCart
        );

    }


    if (closeCheckoutButton) {

        closeCheckoutButton.addEventListener(
            "click",
            closeCheckout
        );

    }


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            openCheckout
        );

    }


    if (cartModal) {

        cartModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === cartModal
                ) {

                    closeCart();

                }

            }
        );

    }


    if (checkoutModal) {

        checkoutModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === checkoutModal
                ) {

                    closeCheckout();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            closeCart();

            closeCheckout();

        }
    );

}


/* =========================================================
   LOCATION
========================================================= */

if (locationBtn) {

    locationBtn.addEventListener(
        "click",
        changeLocation
    );

}


function changeLocation() {

    const location =
        prompt(
            "Masukkan lokasi/alamat Anda:"
        );


    if (!location) return;


    const cleanLocation =
        location.trim();


    if (!cleanLocation) return;


    localStorage.setItem(
        CONFIG.storageLocation,
        cleanLocation
    );


    loadSavedLocation();


    showToast(
        "Lokasi berhasil disimpan"
    );

}


function loadSavedLocation() {

    const location =
        localStorage.getItem(
            CONFIG.storageLocation
        );


    if (!location) {

        currentLocation.textContent =
            "Belum dipilih";

        return;

    }


    currentLocation.textContent =
        location;

}


/* =========================================================
   ORDERS
========================================================= */

function openOrders() {

    const history =
        getOrderHistoryHTML();


    const existing =
        document.getElementById(
            "ordersModal"
        );


    if (existing) {

        existing.remove();

    }


    const modal =
        document.createElement("div");


    modal.id =
        "ordersModal";


    modal.className =
        "modal";


    modal.innerHTML = `

        <div class="modal-content">

            <div class="modal-header">

                <div>

                    <small>RIWAYAT</small>

                    <h2>
                        Pesanan Saya
                    </h2>

                </div>

                <button
                    class="close-btn"
                    id="closeOrders">

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>

            <div class="order-history">

                ${history}

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    modal
        .querySelector("#closeOrders")
        .addEventListener(
            "click",
            () => {

                modal.remove();

                document.body.style.overflow = "";

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                modal.remove();

                document.body.style.overflow = "";

            }

        }
    );


    document.body.style.overflow =
        "hidden";

}


function getOrderHistoryHTML() {

    if (!orders.length) {

        return `

            <div class="empty-cart">

                <i class="fa-solid fa-receipt"></i>

                <h3>
                    Belum ada pesanan
                </h3>

                <p>
                    Riwayat pesanan Anda akan muncul di sini.
                </p>

            </div>

        `;

    }


    return orders.map(order => {

        const date =
            new Date(order.date)
                .toLocaleString(
                    "id-ID",
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                );


        return `

            <div class="cart-item">

                <div class="cart-item-info">

                    <h3>
                        ${escapeHTML(order.id)}
                    </h3>

                    <span>
                        ${escapeHTML(date)}
                    </span>

                    <span>
                        ${order.items.length}
                        jenis jasa
                        •
                        ${escapeHTML(order.status)}
                    </span>

                </div>

                <div class="cart-item-price">

                    ${formatRupiah(order.total)}

                </div>

            </div>

        `;

    }).join("");

}


/* =========================================================
   PROFILE
========================================================= */

function openProfile() {

    const existing =
        document.getElementById(
            "profileModal"
        );


    if (existing) {
        existing.remove();
    }


    const modal =
        document.createElement("div");


    modal.id =
        "profileModal";


    modal.className =
        "modal";


    modal.innerHTML = `

        <div class="modal-content">

            <div class="modal-header">

                <div>

                    <small>AKUN</small>

                    <h2>
                        Akun Saya
                    </h2>

                </div>

                <button
                    class="close-btn"
                    id="closeProfile">

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <div class="empty-cart">

                <div
                    style="
                        width:70px;
                        height:70px;
                        margin:0 auto 15px;
                        border-radius:50%;
                        background:#f3f4f6;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:28px;
                    ">

                    <i class="fa-regular fa-user"></i>

                </div>


                <h3>
                    Pelanggan JASA KAMPUNG
                </h3>


                <p>
                    Pesan berbagai jasa lokal
                    dengan mudah.
                </p>

            </div>


            <div class="profile-menu"
                 style="margin-top:20px;">

                <button
                    type="button"
                    onclick="openOrders()">

                    <i class="fa-solid fa-receipt"></i>

                    Riwayat Pesanan

                    <i class="fa-solid fa-chevron-right"></i>

                </button>


                <button
                    type="button"
                    onclick="changeLocation()">

                    <i class="fa-solid fa-location-dot"></i>

                    Ubah Lokasi

                    <i class="fa-solid fa-chevron-right"></i>

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    modal
        .querySelector("#closeProfile")
        .addEventListener(
            "click",
            () => {

                modal.remove();

                document.body.style.overflow = "";

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                modal.remove();

                document.body.style.overflow = "";

            }

        }
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   HOME
========================================================= */

function showHome() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   NOTIFICATION
========================================================= */

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );


if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        () => {

            showToast(
                "Belum ada notifikasi baru"
            );

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    if (!toast) return;


    toastText.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.addToCart =
    addToCart;

window.increaseQuantity =
    increaseQuantity;

window.decreaseQuantity =
    decreaseQuantity;

window.openCart =
    openCart;

window.closeCart =
    closeCart;

window.openCheckout =
    openCheckout;

window.closeCheckout =
    closeCheckout;

window.openOrders =
    openOrders;

window.openProfile =
    openProfile;

window.showHome =
    showHome;

window.scrollToServices =
    scrollToServices;

window.changeLocation =
    changeLocation;