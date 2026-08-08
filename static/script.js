const newsText = document.getElementById("newsText");
const charCount = document.getElementById("charCount");

newsText.addEventListener("input", function () {
    charCount.textContent = `${newsText.value.length} characters`;
});

async function analyzeNews() {

    const text = newsText.value.trim();

    if (text.length === 0) {
        alert("Please enter some news first.");
        return;
    }

    document.getElementById("resultText").textContent = "Analyzing...";
    document.getElementById("resultDescription").textContent =
        "Running all four machine-learning models...";

    try {

        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                news: text
            })
        });

        const data = await response.json();

        // Main result
        document.getElementById("resultText").textContent =
            data.result;

        // Model results
        document.getElementById("resultDescription").innerHTML = `
            <div class="model-results">
                <p><strong>Logistic Regression:</strong> ${data.lr}</p>
                <p><strong>Decision Tree:</strong> ${data.dt}</p>
                <p><strong>Gradient Boosting:</strong> ${data.gb}</p>
                <p><strong>Random Forest:</strong> ${data.rf}</p>
            </div>
        `;

        document.querySelector(".result-icon").textContent = "🧠";

    } catch (error) {

        console.error(error);

        document.getElementById("resultText").textContent =
            "Error";

        document.getElementById("resultDescription").textContent =
            "Could not connect to the prediction server.";
    }
}