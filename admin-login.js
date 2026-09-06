/* =========================================================
   JASA KAMPUNG — ADMIN LOGIN
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const CONFIG = {

        supabaseUrl:
            "https://zdrpadycrxykpvqdnifb.supabase.co",

        supabaseKey:
            "sb_publishable_Ahre-vE-eSSWsOjGDesQEA_AlA6jBE9"

    };


    const supabaseClient =
        window.supabase.createClient(
            CONFIG.supabaseUrl,
            CONFIG.supabaseKey
        );


    const loginForm =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.getElementById("loginButton");

    const loginMessage =
        document.getElementById("loginMessage");


    /* =====================================================
       CEK SESSION
    ===================================================== */

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    if (session) {

        const isAdmin =
            await checkAdmin(
                session.user.id
            );

        if (isAdmin) {

            window.location.href =
                "admin.html";

            return;

        } else {

            await supabaseClient.auth.signOut();

        }

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!email || !password) {

                showMessage(
                    "Email dan password wajib diisi.",
                    "error"
                );

                return;

            }


            loginButton.disabled = true;

            loginButton.textContent =
                "Memeriksa...";


            const {
                data,
                error
            } = await supabaseClient.auth
                .signInWithPassword({
                    email,
                    password
                });


            if (error) {

                console.error(error);

                showMessage(
                    "Email atau password salah.",
                    "error"
                );

                resetButton();

                return;

            }


            const isAdmin =
                await checkAdmin(
                    data.user.id
                );


            if (!isAdmin) {

                await supabaseClient.auth.signOut();

                showMessage(
                    "Akun ini bukan akun admin.",
                    "error"
                );

                resetButton();

                return;

            }


            showMessage(
                "Login berhasil. Membuka dashboard...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "admin.html";

            }, 500);

        }
    );


    /* =====================================================
       CHECK ADMIN
    ===================================================== */

    async function checkAdmin(userId) {

        const {
            data,
            error
        } = await supabaseClient
            .from("admin_users")
            .select("user_id, role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();


        if (error) {

            console.error(
                "Admin check error:",
                error
            );

            return false;

        }


        return !!data;

    }


    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(
        message,
        type
    ) {

        loginMessage.textContent =
            message;

        loginMessage.className =
            `login-message ${type}`;

    }


    /* =====================================================
       RESET BUTTON
    ===================================================== */

    function resetButton() {

        loginButton.disabled = false;

        loginButton.textContent =
            "Masuk ke Dashboard";

    }

});