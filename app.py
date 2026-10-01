from flask import Flask, render_template, request, jsonify
import pickle
import pandas as pd
import re
import os

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# ============================================================
# APP
# ============================================================

app = Flask(__name__)


# ============================================================
# LOAD DATASET
# ============================================================

DATASET_PATH = "Datasets/datasets/manual_testing.csv"

try:
    manual_data = pd.read_csv(DATASET_PATH)

    # Make sure required columns exist
    required_columns = ["text", "class"]

    for column in required_columns:
        if column not in manual_data.columns:
            raise ValueError(
                f"Required column '{column}' not found in dataset."
            )

    manual_data["text"] = manual_data["text"].fillna("")

except Exception as e:
    print("Dataset loading error:", e)
    manual_data = pd.DataFrame(
        columns=["title", "text", "subject", "date", "class"]
    )


# ============================================================
# LOAD ONE MODEL ONLY
# ============================================================

try:

    vectorization = pickle.load(
        open("vectorizer.pkl", "rb")
    )

    LR = pickle.load(
        open("LR_model.pkl", "rb")
    )

except Exception as e:

    print("Model loading error:", e)

    vectorization = None
    LR = None


# ============================================================
# TEXT PREPROCESSING
# ============================================================

def wordopt(text):

    text = str(text)

    text = text.lower()

    text = re.sub(
        r'\[.*?\]',
        '',
        text
    )

    text = re.sub(
        r"\\W",
        " ",
        text
    )

    text = re.sub(
        r'https?://\S+|www\.\S+',
        '',
        text
    )

    text = re.sub(
        r'<.*?>+',
        '',
        text
    )

    text = re.sub(
        r'[%s]' %
        re.escape(
            r"""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""
        ),
        '',
        text
    )

    text = re.sub(
        r'\n',
        '',
        text
    )

    text = re.sub(
        r'\w*\d\w*',
        '',
        text
    )

    return text


# ============================================================
# LABEL FUNCTION
# ============================================================

def output_label(n):

    n = int(n)

    if n == 0:
        return "Fake News"

    return "Not a Fake News"


# ============================================================
# MODEL PREDICTION
# ============================================================

def predict_news(news):

    if vectorization is None or LR is None:
        raise RuntimeError(
            "Model files could not be loaded."
        )

    cleaned_news = wordopt(news)

    vectorized_news = vectorization.transform(
        [cleaned_news]
    )

    prediction = LR.predict(
        vectorized_news
    )[0]

    result = output_label(prediction)

    # Confidence
    confidence = None

    try:

        probabilities = LR.predict_proba(
            vectorized_news
        )[0]

        confidence = round(
            float(max(probabilities)) * 100,
            2
        )

    except Exception:
        confidence = None

    return result, confidence


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ============================================================
# DATASET API
# ============================================================

@app.route("/dataset")
def dataset():

    try:

        if manual_data.empty:

            return jsonify({
                "news": []
            })

        news = []

        for index, row in manual_data.iterrows():

            label = output_label(
                row["class"]
            )

            news.append({

                "id": int(index),

                "title": str(
                    row.get("title", "")
                ),

                "text": str(
                    row.get("text", "")
                ),

                "subject": str(
                    row.get("subject", "")
                ),

                "date": str(
                    row.get("date", "")
                ),

                "actual_label": label

            })

        return jsonify({
            "news": news
        })

    except Exception as e:

        print("Dataset API error:", e)

        return jsonify({
            "error": "Could not load dataset.",
            "news": []
        }), 500


# ============================================================
# DASHBOARD METRICS
# ============================================================

@app.route("/metrics")
def metrics():

    try:

        if manual_data.empty:

            return jsonify({
                "accuracy": 0,
                "precision": 0,
                "recall": 0,
                "f1": 0,
                "total": 0,
                "fake": 0,
                "real": 0
            })


        # Prepare dataset
        texts = manual_data["text"].apply(
            wordopt
        )

        actual = manual_data["class"].astype(int)


        # Vectorize
        X = vectorization.transform(
            texts
        )


        # Predict using ONLY Logistic Regression
        predicted = LR.predict(X)


        # Calculate metrics
        accuracy = accuracy_score(
            actual,
            predicted
        )

        precision = precision_score(
            actual,
            predicted,
            zero_division=0
        )

        recall = recall_score(
            actual,
            predicted,
            zero_division=0
        )

        f1 = f1_score(
            actual,
            predicted,
            zero_division=0
        )


        fake_count = int(
            (actual == 0).sum()
        )

        real_count = int(
            (actual == 1).sum()
        )


        return jsonify({

            "accuracy": round(
                accuracy * 100,
                2
            ),

            "precision": round(
                precision * 100,
                2
            ),

            "recall": round(
                recall * 100,
                2
            ),

            "f1": round(
                f1 * 100,
                2
            ),

            "total": int(
                len(manual_data)
            ),

            "fake": fake_count,

            "real": real_count

        })


    except Exception as e:

        print("Metrics error:", e)

        return jsonify({
            "error": "Could not calculate model metrics."
        }), 500


# ============================================================
# PREDICTION API
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({
                "success": False,
                "error": "Invalid request."
            }), 400


        news = str(
            data.get("news", "")
        ).strip()


        if not news:

            return jsonify({
                "success": False,
                "error": "Please enter some news."
            }), 400


        # Predict
        result, confidence = predict_news(
            news
        )


        return jsonify({

            "success": True,

            "result": result,

            "confidence": confidence,

            "model": "Logistic Regression",

            "news": news

        })


    except Exception as e:

        print("Prediction error:", e)

        return jsonify({

            "success": False,

            "error": "Prediction failed."

        }), 500


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        )

)
