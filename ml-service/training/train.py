import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from data_utils import load_preflop_split
from model_utils import evaluate_model
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

TRAIN_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_60k_train_set_game_scenario_information.csv"
TEST_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_1k_test_set_game_scenario_information.csv"

X_train, y_train = load_preflop_split(TRAIN_URL, "preflop_60k_train.csv")
X_test, y_test = load_preflop_split(TEST_URL, "preflop_1k_test.csv")

baseline_prediction = y_train.mode()[0]
baseline_accuracy = (y_test == baseline_prediction).mean()
print(f"Baseline (always predict '{baseline_prediction}'): {baseline_accuracy:.2%}")

results = {}

rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
results["Random Forest"] = evaluate_model("Random Forest", rf_model, X_train, y_train, X_test, y_test)

label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)
y_test_encoded = label_encoder.transform(y_test)

xgb_model = XGBClassifier(n_estimators=100, max_depth=6, random_state=42, eval_metric="mlogloss")
results["XGBoost"] = evaluate_model("XGBoost", xgb_model, X_train, y_train_encoded, X_test, y_test_encoded)

lgbm_model = LGBMClassifier(n_estimators=100, max_depth=6, random_state=42, verbose=-1)
results["LightGBM"] = evaluate_model("LightGBM", lgbm_model, X_train, y_train, X_test, y_test)

catboost_model = CatBoostClassifier(n_estimators=100, max_depth=6, random_state=42, verbose=False)
results["CatBoost"] = evaluate_model("CatBoost", catboost_model, X_train, y_train, X_test, y_test)

MODEL_PATH = Path(__file__).resolve().parent.parent / "app" / "model" / "xgboost_model.pkl"
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(xgb_model, MODEL_PATH)
print(f"\nSaved trained XGBoost model to: {MODEL_PATH}")
ENCODER_PATH = Path(__file__).resolve().parent.parent / "app" / "model" / "label_encoder.pkl"
ENCODER_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(label_encoder, ENCODER_PATH)
print(f"Saved label encoder to: {ENCODER_PATH}")

print("\n=== Summary so far ===")
for name, acc in results.items():
    print(f"{name}: {acc:.2%}")