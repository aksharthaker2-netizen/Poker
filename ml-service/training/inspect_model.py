import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor
import pandas as pd

print("Label encoder classes (in order):", list(predictor._label_encoder.classes_))
print()
print("Model's expected feature names/order:", list(predictor._model.feature_names_in_))
print()

row = {
    "our_hand_strength": 1.0,
    "num_bets": 1,
    "pot_size": 1.5,
    "num_players": 2,
}
for pos in predictor.ALL_POSITIONS:
    row[f"pos_{pos}"] = 1 if pos == "SB" else 0

X = pd.DataFrame([row])
print("Our constructed row's columns/order:", list(X.columns))
print()
print("Prediction probabilities (order matches label encoder classes above):")
print(predictor._model.predict_proba(X))