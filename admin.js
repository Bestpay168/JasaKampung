/* =========================================================
   JASA KAMPUNG — ADMIN DASHBOARD
   Supabase + Order Management + Service Management
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {
        supabaseUrl: https://zdrpadycrxykpvqdnifb.supabase.co",
        supabaseKey: "sb_publishable_Ahre-vE-eSSWsOjGDesQEA_AlA6jBE9"
    };

    /* =====================================================
       SUPABASE
    ===================================================== */

    if (!window.supabase) {
        alert("Supabase JS belum dimuat.");
        return;
    }

    const supabaseClient = window.supabase.createClient(
        CONFIG.supabaseUrl,
        CONFIG.supabaseKey
    );

     /* =====================================================
       STATE
    ===================================================== */

    let orders = [];
    let services = [];
    let selectedOrder = null;

    /* =====================================================
       DOM
    ===================================================== */

    const orderList = document.getElementById("orderList");
    const serviceAdminList = document.getElementById("serviceAdminList");

    const orderSearch = document.getElementById("orderSearch");

    const totalOrders = document.getElementById("totalOrders");
    const pendingOrders = document.getElementById("pendingOrders");
    const processingOrders = document.getElementById("processingOrders");
    const completedOrders = document.getElementById("completedOrders");
    const totalRevenue = document.getElementById("totalRevenue");

    const orderModal = document.getElementById("orderModal");
    const serviceModal = document.getElementById("serviceModal");

    const modalOrderCode = document.getElementById("modalOrderCode");
    const orderDetail = document.getElementById("orderDetail");
    const orderStatus = document.getElementById("orderStatus");

    const saveStatusButton = document.getElementById("saveStatusButton");

    const serviceForm = document.getElementById("serviceForm");
    const serviceId = document.getElementById("serviceId");
    const serviceName = document.getElementById("serviceName");
    const serviceDescription = document.getElementById("serviceDescription");
    const servicePrice = document.getElementById("servicePrice");
    const serviceUnit = document.getElementById("serviceUnit");
    const serviceCategory = document.getElementById("serviceCategory");
    const serviceActive = document.getElementById("serviceActive");

    const addServiceButton = document.getElementById("addServiceButton");

    /* =====================================================
       INITIALIZE
    ===================================================== */
/* =====================================================
   AUTH GUARD
===================================================== */

const {
    data: {
        session
    }
} = await supabaseClient.auth.getSession();


if (!session) {

    window.location.href =
        "admin-login.html";

    return;

}


const {
    data: adminUser,
    error: adminError
} = await supabaseClient
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();


if (adminError || !adminUser) {

    await supabaseClient.auth.signOut();

    window.location.href =
        "admin-login.html";

    return;

}


/* =====================================================
   ADMIN SUDAH TERVALIDASI
===================================================== */


    await init();

    async function init() {
        setupEvents();

        showLoading();

        await Promise.all([
            loadOrders(),
            loadServices()
        ]);

        updateDashboard();

        hideLoading();
    }

    /* =====================================================
       EVENTS
    ===================================================== */
const logoutButton =
    document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Keluar dari dashboard admin?"
                );

            if (!confirmed) return;


            const {
                error
            } = await supabaseClient.auth.signOut();


            if (error) {

                console.error(error);

                showToast(
                    "Gagal keluar.",
                    "error"
                );

                return;

            }


            window.location.href =
                "admin-login.html";

        }
    );

}

    function setupEvents() {

        /* Search order */

        if (orderSearch) {
            orderSearch.addEventListener("input", () => {
                renderOrders();
            });
        }

        /* Refresh */

        const refreshButton = document.getElementById("refreshButton");

        if (refreshButton) {
            refreshButton.addEventListener("click", async () => {

                showToast("Memperbarui data...", "info");

                await Promise.all([
                    loadOrders(),
                    loadServices()
                ]);

                updateDashboard();

                showToast("Data berhasil diperbarui", "success");
            });
        }

        /* Add service */

        if (addServiceButton) {
            addServiceButton.addEventListener("click", () => {
                openAddServiceModal();
            });
        }

        /* Save order status */

        if (saveStatusButton) {
            saveStatusButton.addEventListener("click", saveOrderStatus);
        }

        /* Service form */

        if (serviceForm) {
            serviceForm.addEventListener("submit", saveService);
        }

        /* Close modal buttons */

        document.querySelectorAll("[data-close-modal]").forEach(button => {

            button.addEventListener("click", () => {

                const modalId = button.dataset.closeModal;

                closeModal(modalId);
            });

        });

        /* Click outside modal */

        [orderModal, serviceModal].forEach(modal => {

            if (!modal) return;

            modal.addEventListener("click", event => {

                if (event.target === modal) {
                    modal.classList.remove("show");
                }

            });

        });

        /* Bottom navigation */

        document.querySelectorAll(".bottom-nav button").forEach(button => {

            button.addEventListener("click", () => {

                const target = button.dataset.target;

                if (!target) return;

                const element = document.getElementById(target);

                if (element) {

                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            });

        });

    }

    /* =====================================================
       LOAD ORDERS
    ===================================================== */

    async function loadOrders() {

        const { data, error } = await supabaseClient
            .from("orders")
            .select(`
                *,
                customers (
                    id,
                    name,
                    phone,
                    address
                ),
                order_items (
                    id,
                    service_name,
                    price,
                    quantity,
                    unit
                )
            `)
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error("Load orders error:", error);

            orders = [];

            showToast(
                "Pesanan gagal dimuat. Periksa RLS Supabase.",
                "error"
            );

            renderOrders();

            return;
        }

        orders = data || [];

        renderOrders();
    }

    /* =====================================================
       LOAD SERVICES
    ===================================================== */

    async function loadServices() {

        const { data, error } = await supabaseClient
            .from("services")
            .select("*")
            .order("created_at", {
                ascending: true
            });

        if (error) {

            console.error("Load services error:", error);

            services = [];

            showToast(
                "Jasa gagal dimuat.",
                "error"
            );

            renderServices();

            return;
        }

        services = data || [];

        renderServices();
    }

    /* =====================================================
       DASHBOARD
    ===================================================== */

    function updateDashboard() {

        const total = orders.length;

        const pending = orders.filter(order =>
            normalizeStatus(order.status) === "menunggu"
        ).length;

        const processing = orders.filter(order =>
            normalizeStatus(order.status) === "diproses"
        ).length;

        const completed = orders.filter(order =>
            normalizeStatus(order.status) === "selesai"
        ).length;

        const revenue = orders
            .filter(order =>
                normalizeStatus(order.status) === "selesai"
            )
            .reduce((sum, order) => {

                return sum + Number(order.total || 0);

            }, 0);

        if (totalOrders) {
            totalOrders.textContent = total;
        }

        if (pendingOrders) {
            pendingOrders.textContent = pending;
        }

        if (processingOrders) {
            processingOrders.textContent = processing;
        }

        if (completedOrders) {
            completedOrders.textContent = completed;
        }

        if (totalRevenue) {
            totalRevenue.textContent = formatRupiah(revenue);
        }
    }

    /* =====================================================
       RENDER ORDERS
    ===================================================== */

    function renderOrders() {

        if (!orderList) return;

        let filteredOrders = [...orders];

        const search = orderSearch
            ? orderSearch.value
                .toLowerCase()
                .trim()
            : "";

        if (search) {

            filteredOrders = filteredOrders.filter(order => {

                const customer = order.customers || {};

                const code = String(
                    order.order_code || ""
                ).toLowerCase();

                const name = String(
                    customer.name || ""
                ).toLowerCase();

                const phone = String(
                    customer.phone || ""
                ).toLowerCase();

                return (
                    code.includes(search) ||
                    name.includes(search) ||
                    phone.includes(search)
                );

            });

        }

        if (!filteredOrders.length) {

            orderList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Belum ada pesanan</h3>
                    <p>Pesanan pelanggan akan muncul di sini.</p>
                </div>
            `;

            return;
        }

        orderList.innerHTML = filteredOrders
            .map(order => createOrderCard(order))
            .join("");

        /* Order card click */

        orderList
            .querySelectorAll("[data-order-id]")
            .forEach(card => {

                card.addEventListener("click", () => {

                    const id = Number(
                        card.dataset.orderId
                    );

                    openOrderModal(id);

                });

            });

    }

    /* =====================================================
       ORDER CARD
    ===================================================== */

    function createOrderCard(order) {

        const customer = order.customers || {};

        const status = normalizeStatus(order.status);

        const statusClass = getStatusClass(status);

        const itemCount = (order.order_items || [])
            .reduce((sum, item) => {

                return sum + Number(item.quantity || 0);

            }, 0);

        return `
            <article
                class="order-card"
                data-order-id="${order.id}"
            >

                <div class="order-card-top">

                    <div>

                        <strong class="order-code">
                            ${escapeHTML(
                                order.order_code || "-"
                            )}
                        </strong>

                        <div class="order-date">
                            ${formatDate(
                                order.created_at
                            )}
                        </div>

                    </div>

                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(
                            order.status || "Menunggu"
                        )}
                    </span>

                </div>


                <div class="order-customer">

                    <strong>
                        ${escapeHTML(
                            customer.name || "Pelanggan"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            customer.phone || "-"
                        )}
                    </span>

                </div>


                <div class="order-summary">

                    <span>
                        ${itemCount} item
                    </span>

                    <strong>
                        ${formatRupiah(order.total)}
                    </strong>

                </div>


                <div class="order-delivery">

                    ${escapeHTML(
                        order.delivery_type || "-"
                    )}

                    • 

                    ${escapeHTML(
                        order.payment_method || "-"
                    )}

                </div>

            </article>
        `;
    }

    /* =====================================================
       OPEN ORDER MODAL
    ===================================================== */

    function openOrderModal(id) {

        selectedOrder = orders.find(
            order => Number(order.id) === Number(id)
        );

        if (!selectedOrder) return;

        const customer = selectedOrder.customers || {};
        const items = selectedOrder.order_items || [];

        if (modalOrderCode) {

            modalOrderCode.textContent =
                selectedOrder.order_code || "-";

        }

        if (orderStatus) {

            orderStatus.value =
                selectedOrder.status || "Menunggu";

        }

        if (orderDetail) {

            orderDetail.innerHTML = `

                <div class="detail-section">

                    <h4>Data Pelanggan</h4>

                    <div class="detail-row">
                        <span>Nama</span>
                        <strong>
                            ${escapeHTML(
                                customer.name || "-"
                            )}
                        </strong>
                    </div>

                    <div class="detail-row">
                        <span>Telepon</span>
                        <strong>
                            ${escapeHTML(
                                customer.phone || "-"
                            )}
                        </strong>
                    </div>

                    <div class="detail-row">
                        <span>Alamat</span>
                        <strong>
                            ${escapeHTML(
                                customer.address || "-"
                            )}
                        </strong>
                    </div>

                </div>


                <div class="detail-section">

                    <h4>Pesanan</h4>

                    ${
                        items.length
                        ? items.map(item => `

                            <div class="detail-item">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            item.service_name
                                        )}
                                    </strong>

                                    <small>
                                        ${item.quantity}
                                        ${escapeHTML(
                                            item.unit || ""
                                        )}
                                    </small>

                                </div>

                                <strong>
                                    ${formatRupiah(
                                        Number(item.price) *
                                        Number(item.quantity)
                                    )}
                                </strong>

                            </div>

                        `).join("")
                        : `
                            <p>Tidak ada detail item.</p>
                        `
                    }

                </div>


                <div class="detail-section">

                    <h4>Pengiriman</h4>

                    <div class="detail-row">
                        <span>Jenis</span>
                        <strong>
                            ${escapeHTML(
                                selectedOrder.delivery_type || "-"
                            )}
                        </strong>
                    </div>

                    <div class="detail-row">
                        <span>Pembayaran</span>
                        <strong>
                            ${escapeHTML(
                                selectedOrder.payment_method || "-"
                            )}
                        </strong>
                    </div>

                </div>


                <div class="detail-section">

                    <h4>Total</h4>

                    <div class="detail-row">
                        <span>Subtotal</span>
                        <strong>
                            ${formatRupiah(
                                selectedOrder.subtotal
                            )}
                        </strong>
                    </div>

                    <div class="detail-row">
                        <span>Ongkir</span>
                        <strong>
                            ${formatRupiah(
                                selectedOrder.shipping
                            )}
                        </strong>
                    </div>

                    <div class="detail-total">
                        <span>Total</span>
                        <strong>
                            ${formatRupiah(
                                selectedOrder.total
                            )}
                        </strong>
                    </div>

                </div>


                <div class="detail-section">

                    <h4>Catatan</h4>

                    <p>
                        ${escapeHTML(
                            selectedOrder.note || "Tidak ada catatan."
                        )}
                    </p>

                </div>
            `;

        }

        if (orderModal) {

            orderModal.classList.add("show");

        }

    }

    /* =====================================================
       SAVE ORDER STATUS
    ===================================================== */

    async function saveOrderStatus() {

        if (!selectedOrder || !orderStatus) {
            return;
        }

        const newStatus =
            orderStatus.value;

        if (!newStatus) return;

        if (saveStatusButton) {

            saveStatusButton.disabled = true;

            saveStatusButton.textContent =
                "Menyimpan...";

        }

        const { error } = await supabaseClient
            .from("orders")
            .update({
                status: newStatus
            })
            .eq("id", selectedOrder.id);

        if (error) {

            console.error(error);

            showToast(
                "Status gagal diperbarui.",
                "error"
            );

        } else {

            selectedOrder.status = newStatus;

            const index = orders.findIndex(
                order =>
                    Number(order.id) ===
                    Number(selectedOrder.id)
            );

            if (index !== -1) {

                orders[index].status =
                    newStatus;

            }

            renderOrders();

            updateDashboard();

            closeModal("orderModal");

            showToast(
                "Status pesanan berhasil diperbarui.",
                "success"
            );

        }

        if (saveStatusButton) {

            saveStatusButton.disabled = false;

            saveStatusButton.textContent =
                "Simpan Status";

        }

    }

    /* =====================================================
       RENDER SERVICES
    ===================================================== */

    function renderServices() {

        if (!serviceAdminList) return;

        if (!services.length) {

            serviceAdminList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🧺</div>
                    <h3>Belum ada jasa</h3>
                    <p>Tambahkan jasa pertama Anda.</p>
                </div>
            `;

            return;
        }

        serviceAdminList.innerHTML =
            services.map(service => {

                return `

                    <article
                        class="service-admin-card
                        ${service.active ? "" : "inactive"}"
                    >

                        <div class="service-admin-info">

                            <div class="service-admin-title">

                                <h3>
                                    ${escapeHTML(
                                        service.name
                                    )}
                                </h3>

                                <span
                                    class="service-status
                                    ${service.active
                                        ? "active"
                                        : "inactive"}"
                                >
                                    ${
                                        service.active
                                        ? "Aktif"
                                        : "Nonaktif"
                                    }
                                </span>

                            </div>

                            <p>
                                ${escapeHTML(
                                    service.description || ""
                                )}
                            </p>

                            <strong>
                                ${formatRupiah(
                                    service.price
                                )}
                                /
                                ${escapeHTML(
                                    service.unit
                                )}
                            </strong>

                        </div>


                        <div class="service-actions">

                            <button
                                type="button"
                                class="btn-secondary"
                                data-edit-service="${service.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn-secondary"
                                data-toggle-service="${service.id}"
                            >
                                ${
                                    service.active
                                    ? "Nonaktifkan"
                                    : "Aktifkan"
                                }
                            </button>

                            <button
                                type="button"
                                class="btn-danger"
                                data-delete-service="${service.id}"
                            >
                                Hapus
                            </button>

                        </div>

                    </article>

                `;

            }).join("");

        /* Edit */

        serviceAdminList
            .querySelectorAll("[data-edit-service]")
            .forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.editService
                        );

                    openEditServiceModal(id);

                });

            });

        /* Toggle */

        serviceAdminList
            .querySelectorAll("[data-toggle-service]")
            .forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.toggleService
                        );

                    toggleService(id);

                });

            });

        /* Delete */

        serviceAdminList
            .querySelectorAll("[data-delete-service]")
            .forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.deleteService
                        );

                    deleteService(id);

                });

            });

    }

    /* =====================================================
       ADD SERVICE
    ===================================================== */

    function openAddServiceModal() {

        if (!serviceForm) return;

        serviceForm.reset();

        if (serviceId) {
            serviceId.value = "";
        }

        if (serviceActive) {
            serviceActive.checked = true;
        }

        const title =
            document.getElementById("serviceModalTitle");

        if (title) {
            title.textContent = "Tambah Jasa";
        }

        if (serviceModal) {
            serviceModal.classList.add("show");
        }

    }

    /* =====================================================
       EDIT SERVICE
    ===================================================== */

    function openEditServiceModal(id) {

        const service =
            services.find(
                item =>
                    Number(item.id) === Number(id)
            );

        if (!service) return;

        if (serviceId) {
            serviceId.value = service.id;
        }

        if (serviceName) {
            serviceName.value =
                service.name || "";
        }

        if (serviceDescription) {
            serviceDescription.value =
                service.description || "";
        }

        if (servicePrice) {
            servicePrice.value =
                service.price || 0;
        }

        if (serviceUnit) {
            serviceUnit.value =
                service.unit || "";
        }

        if (serviceCategory) {
            serviceCategory.value =
                service.category || "";
        }

        if (serviceActive) {
            serviceActive.checked =
                Boolean(service.active);
        }

        const title =
            document.getElementById("serviceModalTitle");

        if (title) {
            title.textContent = "Edit Jasa";
        }

        if (serviceModal) {
            serviceModal.classList.add("show");
        }

    }

    /* =====================================================
       SAVE SERVICE
    ===================================================== */

    async function saveService(event) {

        event.preventDefault();

        const name =
            serviceName
                ? serviceName.value.trim()
                : "";

        const description =
            serviceDescription
                ? serviceDescription.value.trim()
                : "";

        const price =
            servicePrice
                ? Number(servicePrice.value)
                : 0;

        const unit =
            serviceUnit
                ? serviceUnit.value.trim()
                : "";

        const category =
            serviceCategory
                ? serviceCategory.value.trim()
                : "";

        const active =
            serviceActive
                ? serviceActive.checked
                : true;

        if (!name) {

            showToast(
                "Nama jasa wajib diisi.",
                "error"
            );

            return;
        }

        if (price < 0) {

            showToast(
                "Harga tidak boleh negatif.",
                "error"
            );

            return;
        }

        const payload = {
            name,
            description,
            price,
            unit,
            category,
            active
        };

        const editingId =
            serviceId
                ? serviceId.value
                : "";

        let result;

        if (editingId) {

            result = await supabaseClient
                .from("services")
                .update(payload)
                .eq("id", editingId);

        } else {

            result = await supabaseClient
                .from("services")
                .insert(payload);

        }

        if (result.error) {

            console.error(
                "Save service error:",
                result.error
            );

            showToast(
                "Jasa gagal disimpan.",
                "error"
            );

            return;
        }

        closeModal("serviceModal");

        await loadServices();

        showToast(
            editingId
                ? "Jasa berhasil diperbarui."
                : "Jasa berhasil ditambahkan.",
            "success"
        );

    }

    /* =====================================================
       TOGGLE SERVICE
    ===================================================== */

    async function toggleService(id) {

        const service =
            services.find(
                item =>
                    Number(item.id) === Number(id)
            );

        if (!service) return;

        const { error } =
            await supabaseClient
                .from("services")
                .update({
                    active: !service.active
                })
                .eq("id", id);

        if (error) {

            console.error(error);

            showToast(
                "Status jasa gagal diubah.",
                "error"
            );

            return;
        }

        await loadServices();

        showToast(
            service.active
                ? "Jasa dinonaktifkan."
                : "Jasa diaktifkan.",
            "success"
        );

    }

    /* =====================================================
       DELETE SERVICE
    ===================================================== */

    async function deleteService(id) {

        const service =
            services.find(
                item =>
                    Number(item.id) === Number(id)
            );

        if (!service) return;

        const confirmed =
            confirm(
                `Hapus jasa "${service.name}"?`
            );

        if (!confirmed) return;

        const { error } =
            await supabaseClient
                .from("services")
                .delete()
                .eq("id", id);

        if (error) {

            console.error(error);

            showToast(
                "Jasa gagal dihapus.",
                "error"
            );

            return;
        }

        await loadServices();

        showToast(
            "Jasa berhasil dihapus.",
            "success"
        );

    }

    /* =====================================================
       MODAL
    ===================================================== */

    function closeModal(id) {

        const modal =
            document.getElementById(id);

        if (modal) {
            modal.classList.remove("show");
        }

    }

    /* =====================================================
       STATUS
    ===================================================== */

    function normalizeStatus(status) {

        return String(status || "")
            .toLowerCase()
            .trim();

    }

    function getStatusClass(status) {

        switch (status) {

            case "menunggu":
                return "status-pending";

            case "diproses":
                return "status-processing";

            case "selesai":
                return "status-completed";

            case "dibatalkan":
                return "status-cancelled";

            default:
                return "status-pending";

        }

    }

    /* =====================================================
       FORMAT RUPIAH
    ===================================================== */

    function formatRupiah(value) {

        return new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        ).format(
            Number(value || 0)
        );

    }

    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) return "-";

        const date =
            new Date(dateString);

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);

    }

    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        const toast =
            document.getElementById("toast");

        if (!toast) {

            alert(message);

            return;
        }

        toast.textContent = message;

        toast.className =
            `toast ${type} show`;

        clearTimeout(
            showToast.timer
        );

        showToast.timer =
            setTimeout(() => {

                toast.classList.remove("show");

            }, 3000);

    }

    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        if (!orderList) return;

        orderList.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Memuat pesanan...</p>
            </div>
        `;

    }

    function hideLoading() {

        renderOrders();
        renderServices();

    }

});