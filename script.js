// =====================================================
// ZENVYRA - DIGITAL CREDENTIAL VERIFICATION
// Main Frontend JavaScript
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("ZENVYRA JavaScript loaded successfully.");

    // =================================================
    // NAVIGATION
    // =================================================

    setupNavigation();

    // =================================================
    // VERIFY CREDENTIAL
    // =================================================

    setupCredentialVerification();

    // =================================================
    // INSTITUTION LOGIN
    // =================================================

    setupInstitutionLogin();

    // =================================================
    // METAMASK
    // =================================================

    setupMetaMask();

    // =================================================
    // ISSUE CERTIFICATE
    // =================================================

    setupIssueCertificate();

    // =================================================
    // LOGOUT
    // =================================================

    setupLogout();

});


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const links = document.querySelectorAll(
        'a[href^="#"]'
    );

    links.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId =
                link.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });

}


// =====================================================
// GO TO VERIFY SECTION
// =====================================================

function goToVerify() {

    const verifySection =
        document.getElementById("verify");

    if (!verifySection) {
        return;
    }

    verifySection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    setTimeout(function () {

        const input =
            document.getElementById("credentialId");

        if (input) {
            input.focus();
        }

    }, 500);

}


// =====================================================
// GO TO INSTITUTION PORTAL
// =====================================================

function goToInstitution() {

    console.log("Opening Institution Portal...");

    window.location.href = "admin.html";

}


// =====================================================
// VERIFY CREDENTIAL
// =====================================================

function setupCredentialVerification() {

    const verifyBtn =
        document.getElementById(
            "verifyCredentialBtn"
        );

    const input =
        document.getElementById(
            "credentialId"
        );

    const result =
        document.getElementById(
            "verificationResult"
        );


    if (!verifyBtn || !input || !result) {

        console.log(
            "Verification elements not found."
        );

        return;
    }


    verifyBtn.addEventListener(
        "click",
        async function () {

            const credentialId =
                input.value.trim();


            // -----------------------------------------
            // EMPTY INPUT
            // -----------------------------------------

            if (!credentialId) {

                showVerificationResult(
                    result,
                    "error",
                    "Please enter a Credential ID."
                );

                input.focus();

                return;
            }


            // -----------------------------------------
            // LOADING
            // -----------------------------------------

            verifyBtn.disabled = true;

            verifyBtn.innerHTML =
                "<span>Verifying...</span><span>⏳</span>";

            result.className =
                "verification-result";

            result.textContent =
                "Checking blockchain record...";


            try {

                // -------------------------------------
                // BACKEND API
                // -------------------------------------
                // Backend route:
                // GET /verify/:id
                //
                // Example:
                // /verify/ZYV-2026-000123
                // -------------------------------------

                const response =
                    await fetch(
                        "/api/verify/" +
                        encodeURIComponent(
                            credentialId
                        ),
                        {
                            method: "GET",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                // -------------------------------------
                // RESPONSE
                // -------------------------------------

                let data = null;

                try {

                    data =
                        await response.json();

                } catch (jsonError) {

                    console.warn(
                        "Response was not JSON."
                    );

                }


                console.log(
                    "Verification response:",
                    data
                );


                // -------------------------------------
                // SUCCESS
                // -------------------------------------

                if (
                    response.ok &&
                    data
                ) {

                    /*
                     * Supports common backend responses:
                     *
                     * {
                     *   verified: true,
                     *   certificate: {...}
                     * }
                     *
                     * OR
                     *
                     * {
                     *   success: true,
                     *   data: {...}
                     * }
                     */

                    const verified =
                        data.verified === true ||
                        data.success === true ||
                        data.isValid === true;


                    if (verified) {

                        showVerificationResult(
                            result,
                            "success",
                            buildSuccessMessage(
                                credentialId,
                                data
                            )
                        );

                    } else {

                        showVerificationResult(
                            result,
                            "error",
                            buildFailureMessage(
                                credentialId,
                                data
                            )
                        );

                    }

                } else {

                    showVerificationResult(
                        result,
                        "error",
                        getBackendErrorMessage(
                            data,
                            response.status
                        )
                    );

                }


            } catch (error) {

                console.error(
                    "Verification error:",
                    error
                );


                showVerificationResult(
                    result,
                    "error",
                    "Unable to connect to the verification server. " +
                    "Please make sure the ZENVYRA backend is running."
                );

            }


            // -----------------------------------------
            // RESTORE BUTTON
            // -----------------------------------------

            verifyBtn.disabled = false;

            verifyBtn.innerHTML =
                "<span>Verify Credential</span><span>→</span>";

        }
    );

}


// =====================================================
// VERIFICATION RESULT
// =====================================================

function showVerificationResult(
    resultElement,
    type,
    message
) {

    resultElement.className =
        "verification-result " +
        type;

    resultElement.textContent =
        message;

}


// =====================================================
// SUCCESS MESSAGE
// =====================================================

function buildSuccessMessage(
    credentialId,
    data
) {

    let message =
        "✓ CREDENTIAL VERIFIED\n\n" +
        "Credential ID: " +
        credentialId;


    // -----------------------------------------
    // Certificate details
    // -----------------------------------------

    const certificate =
        data.certificate ||
        data.data ||
        data.result;


    if (
        certificate &&
        typeof certificate === "object"
    ) {

        if (certificate.name) {

            message +=
                "\nRecipient: " +
                certificate.name;

        }

        if (certificate.studentName) {

            message +=
                "\nRecipient: " +
                certificate.studentName;

        }

        if (certificate.course) {

            message +=
                "\nProgramme: " +
                certificate.course;

        }

        if (certificate.programme) {

            message +=
                "\nProgramme: " +
                certificate.programme;

        }

        if (certificate.issuer) {

            message +=
                "\nIssuer: " +
                certificate.issuer;

        }

    }


    return message;

}


// =====================================================
// FAILURE MESSAGE
// =====================================================

function buildFailureMessage(
    credentialId,
    data
) {

    let message =
        "✕ CREDENTIAL NOT FOUND\n\n" +
        "Credential ID: " +
        credentialId;


    if (
        data &&
        data.message
    ) {

        message +=
            "\n\n" +
            data.message;

    } else {

        message +=
            "\n\nPlease check the Credential ID.";

    }


    return message;

}


// =====================================================
// BACKEND ERROR
// =====================================================

function getBackendErrorMessage(
    data,
    status
) {

    if (
        data &&
        data.message
    ) {

        return data.message;

    }


    if (status === 404) {

        return (
            "✕ Credential not found. " +
            "Please check the Credential ID."
        );

    }


    if (status === 500) {

        return (
            "Server error while verifying the credential."
        );

    }


    return (
        "Verification failed. " +
        "Please try again."
    );

}


// =====================================================
// INSTITUTION LOGIN
// =====================================================

function setupInstitutionLogin() {

    const loginBtn =
        document.getElementById(
            "institutionLoginBtn"
        );


    if (!loginBtn) {
        return;
    }


    loginBtn.addEventListener(
        "click",
        function () {

            const username =
                document.getElementById(
                    "institutionUsername"
                );


            const password =
                document.getElementById(
                    "institutionPassword"
                );


            const status =
                document.getElementById(
                    "loginStatus"
                );


            const institutionId =
                username
                    ? username.value.trim()
                    : "";


            const institutionPassword =
                password
                    ? password.value.trim()
                    : "";


            // -----------------------------------------
            // EMPTY INPUT
            // -----------------------------------------

            if (
                !institutionId ||
                !institutionPassword
            ) {

                if (status) {

                    status.innerHTML =
                        "<strong>LOGIN ERROR</strong>" +
                        "<span>" +
                        "Please enter Institution ID and Password." +
                        "</span>";

                }

                return;
            }


            // -----------------------------------------
            // CURRENT DEMO LOGIN
            // -----------------------------------------
            // Real authentication will be connected
            // with backend later.
            // -----------------------------------------

            if (status) {

                status.innerHTML =
                    "<strong>LOGIN SUCCESS</strong>" +
                    "<span>" +
                    "Institution credentials accepted." +
                    "</span>";

            }


            // Open admin dashboard page

            setTimeout(function () {

                window.location.href =
                    "admin.html";

            }, 700);

        }
    );

}


// =====================================================
// METAMASK CONNECTION
// =====================================================

function setupMetaMask() {

    const connectBtn =
        document.getElementById(
            "connectMetaMaskBtn"
        );


    if (!connectBtn) {

        console.log(
            "MetaMask button not found on this page."
        );

        return;
    }


    connectBtn.addEventListener(
        "click",
        async function () {

            const walletStatus =
                document.getElementById(
                    "walletStatus"
                );


            const walletAddress =
                document.getElementById(
                    "walletAddress"
                );


            const blockchainStatus =
                document.getElementById(
                    "blockchainStatus"
                );


            const networkIndicator =
                document.getElementById(
                    "networkIndicator"
                );


            const networkName =
                document.getElementById(
                    "networkName"
                );


            const dashboardWallet =
                document.getElementById(
                    "dashboardWallet"
                );


            // -----------------------------------------
            // CHECK METAMASK
            // -----------------------------------------

            if (
                typeof window.ethereum ===
                "undefined"
            ) {

                if (walletStatus) {

                    walletStatus.textContent =
                        "MetaMask Not Installed";

                }

                alert(
                    "MetaMask is not installed.\n\n" +
                    "Please install MetaMask to continue."
                );

                return;
            }


            try {

                connectBtn.disabled = true;

                connectBtn.innerHTML =
                    "<span>🦊</span>" +
                    "<span>Connecting...</span>" +
                    "<span>⏳</span>";


                // -------------------------------------
                // REQUEST ACCOUNT
                // -------------------------------------

                const accounts =
                    await window.ethereum.request({
                        method:
                            "eth_requestAccounts"
                    });


                if (
                    !accounts ||
                    accounts.length === 0
                ) {

                    throw new Error(
                        "No wallet account found."
                    );

                }


                const account =
                    accounts[0];


                const shortAddress =
                    account.slice(0, 6) +
                    "..." +
                    account.slice(-4);


                // -------------------------------------
                // UPDATE UI
                // -------------------------------------

                if (walletStatus) {

                    walletStatus.textContent =
                        shortAddress;

                }


                if (walletAddress) {

                    walletAddress.textContent =
                        account;

                }


                if (dashboardWallet) {

                    dashboardWallet.textContent =
                        shortAddress;

                }


                if (blockchainStatus) {

                    blockchainStatus.textContent =
                        "Connected";

                }


                if (networkIndicator) {

                    networkIndicator.textContent =
                        "● Online";

                }


                if (networkName) {

                    networkName.textContent =
                        "MetaMask Network";

                }


                connectBtn.innerHTML =
                    "<span>✓</span>" +
                    "<span>Wallet Connected</span>";


                console.log(
                    "MetaMask connected:",
                    account
                );


                // -------------------------------------
                // LISTEN FOR ACCOUNT CHANGE
                // -------------------------------------

                if (
                    window.ethereum &&
                    window.ethereum.on
                ) {

                    window.ethereum.on(
                        "accountsChanged",
                        function (accounts) {

                            if (
                                !accounts ||
                                accounts.length === 0
                            ) {

                                resetWalletUI();

                                return;
                            }


                            const newAccount =
                                accounts[0];


                            updateWalletUI(
                                newAccount
                            );

                        }
                    );

                }


            } catch (error) {

                console.error(
                    "MetaMask connection error:",
                    error
                );


                if (walletStatus) {

                    walletStatus.textContent =
                        "Not Connected";

                }


                connectBtn.innerHTML =
                    "<span>🦊</span>" +
                    "<span>Connect MetaMask</span>" +
                    "<span>→</span>";


                if (
                    error.code === 4001
                ) {

                    alert(
                        "MetaMask connection was cancelled."
                    );

                } else {

                    alert(
                        "Unable to connect MetaMask."
                    );

                }

            }


            connectBtn.disabled = false;

        }
    );

}


// =====================================================
// UPDATE WALLET UI
// =====================================================

function updateWalletUI(account) {

    const walletStatus =
        document.getElementById(
            "walletStatus"
        );


    const walletAddress =
        document.getElementById(
            "walletAddress"
        );


    const dashboardWallet =
        document.getElementById(
            "dashboardWallet"
        );


    const blockchainStatus =
        document.getElementById(
            "blockchainStatus"
        );


    const networkIndicator =
        document.getElementById(
            "networkIndicator"
        );


    const networkName =
        document.getElementById(
            "networkName"
        );


    const shortAddress =
        account.slice(0, 6) +
        "..." +
        account.slice(-4);


    if (walletStatus) {

        walletStatus.textContent =
            shortAddress;

    }


    if (walletAddress) {

        walletAddress.textContent =
            account;

    }


    if (dashboardWallet) {

        dashboardWallet.textContent =
            shortAddress;

    }


    if (blockchainStatus) {

        blockchainStatus.textContent =
            "Connected";

    }


    if (networkIndicator) {

        networkIndicator.textContent =
            "● Online";

    }


    if (networkName) {

        networkName.textContent =
            "MetaMask Network";

    }

}


// =====================================================
// RESET WALLET
// =====================================================

function resetWalletUI() {

    const walletStatus =
        document.getElementById(
            "walletStatus"
        );


    const walletAddress =
        document.getElementById(
            "walletAddress"
        );


    const dashboardWallet =
        document.getElementById(
            "dashboardWallet"
        );


    const blockchainStatus =
        document.getElementById(
            "blockchainStatus"
        );


    const networkIndicator =
        document.getElementById(
            "networkIndicator"
        );


    const networkName =
        document.getElementById(
            "networkName"
        );


    if (walletStatus) {

        walletStatus.textContent =
            "Not Connected";

    }


    if (walletAddress) {

        walletAddress.textContent =
            "";

    }


    if (dashboardWallet) {

        dashboardWallet.textContent =
            "Not Connected";

    }


    if (blockchainStatus) {

        blockchainStatus.textContent =
            "Not Connected";

    }


    if (networkIndicator) {

        networkIndicator.textContent =
            "● Offline";

    }


    if (networkName) {

        networkName.textContent =
            "Not Connected";

    }

}


// =====================================================
// ISSUE CERTIFICATE
// =====================================================

function setupIssueCertificate() {

    const issueBtn =
        document.getElementById(
            "issueCertificateBtn"
        );


    if (!issueBtn) {
        return;
    }


    issueBtn.addEventListener(
        "click",
        function () {

            alert(
                "Certificate issuing module is ready.\n\n" +
                "Blockchain smart contract integration " +
                "will be connected in the next step."
            );

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) {
        return;
    }


    logoutBtn.addEventListener(
        "click",
        function () {

            const confirmation =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmation) {
                return;
            }


            localStorage.removeItem(
                "zenvyraInstitution"
            );


            window.location.href =
                "index.html";

        }
    );

}


// =====================================================
// EXPORT FUNCTIONS
// =====================================================

window.goToVerify =
    goToVerify;

window.goToInstitution =
    goToInstitution;