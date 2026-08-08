from flask import Flask, render_template, request, jsonify
import pickle
import pandas as pd
import re
import os

# =========================
# LOAD DATASET
# =========================

manual_data = pd.read_csv("Datasets/datasets/manual_testing.csv")

app = Flask(__name__)


# =========================
# LOAD TRAINED MODELS
# =========================

vectorization = pickle.load(open("vectorizer.pkl", "rb"))
LR = pickle.load(open("LR_model.pkl", "rb"))
DT = pickle.load(open("DT_model.pkl", "rb"))
GB = pickle.load(open("GB_model.pkl", "rb"))
RF = pickle.load(open("RF_model.pkl", "rb"))


# =========================
# TEXT PREPROCESSING
# =========================

def wordopt(text):
    text = text.lower()
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r"\\W", " ", text)
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>+', '', text)
    text = re.sub(r'[%s]' % re.escape(r"""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), '', text)
    text = re.sub(r'\n', '', text)
    text = re.sub(r'\w*\d\w*', '', text)

    return text


# =========================
# SAME LABEL FUNCTION
# AS YOUR NOTEBOOK
# =========================

def output_lable(n):
    if n == 0:
        return "Fake News"
    elif n == 1:
        return "Not a Fake News"


# =========================
# HOME PAGE
# =========================

@app.route("/")
def home():

    fake_rows = manual_data[manual_data["class"] == 0]
    true_rows = manual_data[manual_data["class"] == 1]

    fake_example = fake_rows.sample(1).iloc[0]["text"]
    true_example = true_rows.sample(1).iloc[0]["text"]

    return render_template(
        "index.html",
        fake_example=fake_example,
        true_example=true_example
    )

# =========================
# PREDICTION
# =========================

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    news = data.get("news", "")

    if not news.strip():
        return jsonify({
            "result": "Please enter some news."
        })


    # Prepare news
    testing_news = {
        "text": [news]
    }

    new_def_test = pd.DataFrame(testing_news)


    # Apply same preprocessing
    new_def_test["text"] = new_def_test["text"].apply(wordopt)


    # Get text
    new_x_test = new_def_test["text"]


    # Vectorization
    new_xv_test = vectorization.transform(new_x_test)


    # Predictions
    pred_LR = LR.predict(new_xv_test)
    pred_DT = DT.predict(new_xv_test)
    pred_GB = GB.predict(new_xv_test)
    pred_RF = RF.predict(new_xv_test)


    # Convert predictions to labels
    lr_result = output_lable(pred_LR[0])
    dt_result = output_lable(pred_DT[0])
    gb_result = output_lable(pred_GB[0])
    rf_result = output_lable(pred_RF[0])


    # Count predictions
    predictions = [
        lr_result,
        dt_result,
        gb_result,
        rf_result
    ]

    fake_count = predictions.count("Fake News")
    real_count = predictions.count("Not a Fake News")


    # Majority prediction
    if fake_count > real_count:
        final_result = "Fake News"
    elif real_count > fake_count:
        final_result = "Not a Fake News"
    else:
        final_result = "Mixed Result"


    return jsonify({

        "result": final_result,

        "lr": lr_result,

        "dt": dt_result,

        "gb": gb_result,

        "rf": rf_result,

        "description":
            f"LR: {lr_result} | "
            f"DT: {dt_result} | "
            f"GB: {gb_result} | "
            f"RF: {rf_result}"
    })


# =========================
# RUN APPLICATION
# =========================





if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )