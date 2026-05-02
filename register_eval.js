// RUN THIS FILE ONLY ONCE!

const register = async () => {
    // 1. FILL IN YOUR EXACT DETAILS HERE:
    const payload = {
        email: "pk2766@srmist.edu.in",
        name: "KUMMARI PRANAY TEJA",
        mobileNo: "7386041881",
        githubUsername: "pranaytejak", // Must match Google form
        rollNo: "RA2311003010981",
        accessCode: "QkbpxH" // Check your email for this
    };

    try {
        console.log("Sending registration request...");
        const response = await fetch('http://20.207.122.201/evaluation-service/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log("\n=========================================");
        console.log("✅ REGISTRATION RESPONSE");
        console.log("=========================================\n");
        console.log(JSON.stringify(data, null, 2));
        console.log("\n⚠️ IMPORTANT: Copy the clientID and clientSecret from above and save them securely in a Notepad or password manager. You cannot retrieve them again.");

    } catch (error) {
        console.error("Registration failed:", error);
    }
};

register();
