import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from data_utils import load_preflop_split
from sklearn.metrics import classification_report

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

TRAIN_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_60k_train_set_game_scenario_information.csv"
TEST_URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_1k_test_set_game_scenario_information.csv"

X_train, y_train = load_preflop_split(TRAIN_URL, "preflop_60k_train.csv")
X_test, y_test = load_preflop_split(TEST_URL, "preflop_1k_test.csv")

model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
baseline_prediction = y_train.mode()[0]
baseline_accuracy = (y_test == baseline_prediction).mean()
print(f"Baseline (always predict '{baseline_prediction}'): {baseline_accuracy:.2%}")

print(f"Random Forest accuracy on held-out test set: {accuracy:.2%}")
print(classification_report(y_test, predictions))