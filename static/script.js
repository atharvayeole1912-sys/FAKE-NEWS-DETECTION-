// ============================================================
// TRUTHLENS - DASHBOARD JAVASCRIPT
// Single Model: Logistic Regression
// ============================================================

let allNews = [];
let selectedNews = new Set();


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    loadMetrics();
    loadDataset();
    updateCharacterCount();

});


// ============================================================
// LOAD MODEL METRICS
// ============================================================

async function loadMetrics() {

    try {

        const response = await fetch("/metrics");

        if (!response.ok) {
            throw new Error("Unable to load metrics");
        }

        const data = await response.json();


        document.getElementById("accuracy").textContent =
            `${data.accuracy}%`;

        document.getElementById("precision").textContent =
            `${data.precision}%`;

        document.getElementById("recall").textContent =
            `${data.recall}%`;

        document.getElementById("f1").textContent =
            `${data.f1}%`;


        document.getElementById("totalNews").textContent =
            data.total;

        document.getElementById("fakeNews").textContent =
            data.fake;

        document.getElementById("realNews").textContent =
            data.real;


    } catch (error) {

        console.error(
            "Metrics loading error:",
            error
        );

        document.getElementById("accuracy").textContent =
            "N/A";

        document.getElementById("precision").textContent =
            "N/A";

        document.getElementById("recall").textContent =
            "N/A";

        document.getElementById("f1").textContent =
            "N/A";

    }

}


// ============================================================
// LOAD NEWS DATASET
// ============================================================

async function loadDataset() {

    const newsList =
        document.getElementById("newsList");

    try {

        const response = await fetch("/dataset");

        if (!response.ok) {
            throw new Error("Unable to load dataset");
        }

        const data = await response.json();

        allNews = data.news || [];

        displayNews(allNews);

    } catch (error) {

        console.error(
            "Dataset loading error:",
            error
        );

        newsList.innerHTML = `
            <div class="error-message">
                ❌ Could not load the news dataset.
                Please refresh the page.
            </div>
        `;

    }

}


// ============================================================
// DISPLAY NEWS
// ============================================================

function displayNews(newsArray) {

    const newsList =
        document.getElementById("newsList");

    if (!newsArray.length) {

        newsList.innerHTML = `
            <div class="empty-message">
                No news articles found.
            </div>
        `;

        updateSelectedCount();

        return;
    }


    newsList.innerHTML = "";


    newsArray.forEach(function (article) {

        const articleDiv =
            document.createElement("div");

        articleDiv.className =
            "news-item";


        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className =
            "news-checkbox";

        checkbox.dataset.id =
            article.id;

        checkbox.checked =
            selectedNews.has(
                String(article.id)
            );


        checkbox.addEventListener(
            "change",
            function () {

                const id =
                    String(article.id);

                if (this.checked) {

                    selectedNews.add(id);

                } else {

                    selectedNews.delete(id);

                }

                updateSelectedCount();

            }
        );


        const content =
            document.createElement("div");

        content.className =
            "news-content";


        const label =
            document.createElement("div");

        label.className =
            "news-label";


        const badge =
            document.createElement("span");


        if (
            article.actual_label ===
            "Fake News"
        ) {

            badge.className =
                "news-badge fake";

            badge.textContent =
                "FAKE";

        } else {

            badge.className =
                "news-badge real";

            badge.textContent =
                "REAL";

        }


        label.appendChild(badge);


        if (article.subject) {

            const subject =
                document.createElement("span");

            subject.className =
                "news-subject";

            subject.textContent =
                article.subject;

            label.appendChild(subject);

        }


        const text =
            document.createElement("p");

        text.className =
            "news-text";

        text.textContent =
            article.text;


        content.appendChild(label);

        content.appendChild(text);


        articleDiv.appendChild(checkbox);

        articleDiv.appendChild(content);


        newsList.appendChild(articleDiv);

    });


    updateSelectedCount();

}


// ============================================================
// SEARCH + FILTER
// ============================================================

function filterNews() {

    const searchInput =
        document.getElementById(
            "searchNews"
        );

    const filterInput =
        document.getElementById(
            "filterType"
        );


    const search =
        searchInput.value
            .toLowerCase()
            .trim();

    const filter =
        filterInput.value;


    const filtered =
        allNews.filter(function (article) {

            const text =
                `${article.text} ${article.title || ""} ${article.subject || ""}`
                    .toLowerCase();


            const matchesSearch =
                text.includes(search);


            let matchesFilter = true;


            if (filter === "fake") {

                matchesFilter =
                    article.actual_label ===
                    "Fake News";

            }


            if (filter === "real") {

                matchesFilter =
                    article.actual_label ===
                    "Not a Fake News";

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    displayNews(filtered);

}


// ============================================================
// SELECT ALL
// ============================================================

function selectAllNews() {

    const searchInput =
        document.getElementById(
            "searchNews"
        );

    const filterInput =
        document.getElementById(
            "filterType"
        );


    const search =
        searchInput.value
            .toLowerCase()
            .trim();

    const filter =
        filterInput.value;


    const visibleNews =
        allNews.filter(function (article) {

            const text =
                `${article.text} ${article.title || ""} ${article.subject || ""}`
                    .toLowerCase();


            const matchesSearch =
                text.includes(search);


            let matchesFilter = true;


            if (filter === "fake") {

                matchesFilter =
                    article.actual_label ===
                    "Fake News";

            }


            if (filter === "real") {

                matchesFilter =
                    article.actual_label ===
                    "Not a Fake News";

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    visibleNews.forEach(function (article) {

        selectedNews.add(
            String(article.id)
        );

    });


    displayNews(
        visibleNews
    );

}


// ============================================================
// CLEAR SELECTION
// ============================================================

function clearSelection() {

    selectedNews.clear();

    displayNews(
        getVisibleNews()
    );

}


// ============================================================
// GET CURRENTLY VISIBLE NEWS
// ============================================================

function getVisibleNews() {

    const searchInput =
        document.getElementById(
            "searchNews"
        );

    const filterInput =
        document.getElementById(
            "filterType"
        );


    const search =
        searchInput.value
            .toLowerCase()
            .trim();

    const filter =
        filterInput.value;


    return allNews.filter(
        function (article) {

            const text =
                `${article.text} ${article.title || ""} ${article.subject || ""}`
                    .toLowerCase();


            const matchesSearch =
                text.includes(search);


            let matchesFilter = true;


            if (filter === "fake") {

                matchesFilter =
                    article.actual_label ===
                    "Fake News";

            }


            if (filter === "real") {

                matchesFilter =
                    article.actual_label ===
                    "Not a Fake News";

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        }
    );

}


// ============================================================
// SELECTED COUNT
// ============================================================

function updateSelectedCount() {

    const count =
        selectedNews.size;


    const element =
        document.getElementById(
            "selectedCount"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `${count} article${count === 1 ? "" : "s"} selected`;

}


// ============================================================
// ANALYZE SELECTED NEWS
// ============================================================

async function analyzeSelectedNews() {

    if (selectedNews.size === 0) {

        alert(
            "Please select at least one news article."
        );

        return;

    }


    // Analyze the first selected article
    // for the detailed result panel.

    const firstId =
        Array.from(
            selectedNews
        )[0];


    await analyzeDatasetArticle(
        firstId
    );

}


// ============================================================
// ANALYZE DATASET ARTICLE
// ============================================================

async function analyzeDatasetArticle(
    id
) {

    showAnalyzing();


    try {

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        news:
                            getNewsText(id)

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Prediction failed"
            );

        }


        const article =
            allNews.find(
                function (item) {

                    return String(item.id) ===
                        String(id);

                }
            );


        showResult({

            result:
                data.result,

            confidence:
                data.confidence,

            actual:
                article
                    ? article.actual_label
                    : "Unknown",

            news:
                article
                    ? article.text
                    : data.news,

            model:
                data.model,

            correct:
                article
                    ? data.result ===
                      article.actual_label
                    : null

        });


    } catch (error) {

        console.error(error);

        showError(
            "Could not analyze the selected article."
        );

    }

}


// ============================================================
// GET NEWS TEXT
// ============================================================

function getNewsText(id) {

    const article =
        allNews.find(
            function (item) {

                return String(item.id) ===
                    String(id);

            }
        );


    return article
        ? article.text
        : "";

}


// ============================================================
// MANUAL NEWS ANALYSIS
// ============================================================

async function analyzeNews() {

    const newsText =
        document.getElementById(
            "newsText"
        );


    const text =
        newsText.value.trim();


    if (!text) {

        alert(
            "Please enter some news first."
        );

        return;

    }


    showAnalyzing();


    try {

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        news: text
                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Prediction failed"
            );

        }


        showResult({

            result:
                data.result,

            confidence:
                data.confidence,

            actual:
                null,

            news:
                text,

            model:
                data.model,

            correct:
                null

        });


    } catch (error) {

        console.error(error);

        showError(
            "Could not connect to the prediction server."
        );

    }

}


// ============================================================
// CHARACTER COUNT
// ============================================================

function updateCharacterCount() {

    const text =
        document.getElementById(
            "newsText"
        );


    const counter =
        document.getElementById(
            "charCount"
        );


    if (!text || !counter) {
        return;
    }


    counter.textContent =
        `${text.value.length} characters`;

}


// ============================================================
// ANALYZING STATE
// ============================================================

function showAnalyzing() {

    const resultText =
        document.getElementById(
            "resultText"
        );


    const description =
        document.getElementById(
            "resultDescription"
        );


    const icon =
        document.getElementById(
            "resultIcon"
        );


    resultText.textContent =
        "Analyzing...";


    description.textContent =
        "Running Logistic Regression analysis...";


    icon.textContent =
        "🧠";


    document.getElementById(
        "result"
    ).scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ============================================================
// SHOW RESULT
// ============================================================

function showResult(data) {

    const resultText =
        document.getElementById(
            "resultText"
        );


    const description =
        document.getElementById(
            "resultDescription"
        );


    const icon =
        document.getElementById(
            "resultIcon"
        );


    const details =
        document.getElementById(
            "resultDetails"
        );


    resultText.textContent =
        data.result;


    if (
        data.result ===
        "Fake News"
    ) {

        icon.textContent =
            "🔴";

    } else {

        icon.textContent =
            "🟢";

    }


    let html = "";


    if (data.confidence !== null &&
        data.confidence !== undefined) {

        html += `
            <div class="result-detail">
                <span>Confidence</span>
                <strong>
                    ${data.confidence}%
                </strong>
            </div>
        `;

    }


    html += `
        <div class="result-detail">
            <span>Model</span>
            <strong>
                ${data.model || "Logistic Regression"}
            </strong>
        </div>
    `;


    if (data.actual) {

        html += `
            <div class="result-detail">
                <span>Actual Dataset Label</span>
                <strong>
                    ${data.actual}
                </strong>
            </div>
        `;


        if (data.correct !== null) {

            html += `
                <div class="result-detail">
                    <span>Prediction</span>
                    <strong>
                        ${data.correct
                            ? "✓ Correct"
                            : "✗ Incorrect"}
                    </strong>
                </div>
            `;

        }

    }


    details.innerHTML =
        html;


    description.innerHTML =
        `
        <div class="analyzed-news">
            <strong>Analyzed News</strong>
            <p>
                ${escapeHTML(
                    data.news
                )}
            </p>
        </div>
        `;


    document.getElementById(
        "result"
    ).scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    document.getElementById(
        "resultText"
    ).textContent =
        "Error";


    document.getElementById(
        "resultDescription"
    ).textContent =
        message;


    document.getElementById(
        "resultIcon"
    ).textContent =
        "⚠️";

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

    }
