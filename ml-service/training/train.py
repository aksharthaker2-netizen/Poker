import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from data_utils import load_preflop_split
from model_utils import evaluate_model
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
import joblib
from pathlib import Path
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from data_utils import load_postflop_split
import pandas as pd

TRAIN_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_60k_train_set_game_scenario_information.csv"
TEST_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_1k_test_set_game_scenario_information.csv"

X_train, y_train = load_preflop_split(TRAIN_URL, "preflop_60k_train.csv")
X_test, y_test = load_preflop_split(TEST_URL, "preflop_1k_test.csv")
acpc_df = pd.read_csv(Path(__file__).resolve().parent / "data" / "acpc_preflop_full.csv")
X_acpc = acpc_df.drop(columns=["action_label"])
y_acpc = acpc_df["action_label"]

X_train = pd.concat([X_train, X_acpc], ignore_index=True)
y_train = pd.concat([y_train, y_acpc], ignore_index=True)

print(f"Combined training set: {len(X_train)} rows (PokerBench + ACPC heads-up)")
print(y_train.value_counts())

baseline_prediction = y_train.mode()[0]
baseline_accuracy = (y_test == baseline_prediction).mean()
print(f"Baseline (always predict '{baseline_prediction}'): {baseline_accuracy:.2%}")

results = {}

label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)
y_test_encoded = label_encoder.transform(y_test)

xgb_model = XGBClassifier(n_estimators=100, max_depth=6, random_state=42, eval_metric="mlogloss")
results["XGBoost"] = evaluate_model("XGBoost", xgb_model, X_train, y_train_encoded, X_test, y_test_encoded)

MODEL_PATH = Path(__file__).resolve().parent.parent / "app" / "model" / "xgboost_model.pkl"
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(xgb_model, MODEL_PATH)
print(f"\nSaved trained XGBoost model to: {MODEL_PATH}")
ENCODER_PATH = Path(__file__).resolve().parent.parent / "app" / "model" / "label_encoder.pkl"
ENCODER_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(label_encoder, ENCODER_PATH)
print(f"Saved label encoder to: {ENCODER_PATH}")

POSTFLOP_TRAIN_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/postflop_500k_train_set_game_scenario_information.csv"
POSTFLOP_TEST_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/postflop_10k_test_set_game_scenario_information.csv"

X_train_pf, y_train_pf = load_postflop_split(POSTFLOP_TRAIN_URL, "postflop_500k_train.csv")
X_test_pf, y_test_pf = load_postflop_split(POSTFLOP_TEST_URL, "postflop_10k_test.csv")
acpc_pf_df = pd.read_csv(Path(__file__).resolve().parent / "data" / "acpc_postflop_full.csv")
X_acpc_pf = acpc_pf_df.drop(columns=["action_label"])
y_acpc_pf = acpc_pf_df["action_label"]

X_train_pf = pd.concat([X_train_pf, X_acpc_pf], ignore_index=True)
y_train_pf = pd.concat([y_train_pf, y_acpc_pf], ignore_index=True)

print(f"Combined postflop training set: {len(X_train_pf)} rows (PokerBench + ACPC heads-up)")
print(y_train_pf.value_counts())

postflop_baseline = y_train_pf.mode()[0]
print(f"\nPostflop baseline (always predict '{postflop_baseline}'): {(y_test_pf == postflop_baseline).mean():.2%}")

pf_label_encoder = LabelEncoder()
y_train_pf_encoded = pf_label_encoder.fit_transform(y_train_pf)
y_test_pf_encoded = pf_label_encoder.transform(y_test_pf)

postflop_model = XGBClassifier(n_estimators=100, max_depth=6, random_state=42, eval_metric="mlogloss")
evaluate_model("Postflop XGBoost", postflop_model, X_train_pf, y_train_pf_encoded, X_test_pf, y_test_pf_encoded)

POSTFLOP_MODEL_PATH = Path(__file__).resolve().parent.parent / "app" / "model" / "postflop_xgboost_model.pkl"
POSTFLOP_ENCODER_PATH = Path(__file__).resolve().parent.parent / "app" / "model" / "postflop_label_encoder.pkl"
POSTFLOP_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(postflop_model, POSTFLOP_MODEL_PATH)
joblib.dump(pf_label_encoder, POSTFLOP_ENCODER_PATH)
print(f"Saved postflop model to: {POSTFLOP_MODEL_PATH}")

print("\n=== Summary so far ===")
for name, acc in results.items():
    print(f"{name}: {acc:.2%}")