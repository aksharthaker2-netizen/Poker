import joblib
from pathlib import Path
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "model"
_model = joblib.load(MODEL_DIR / "xgboost_model.pkl")
_label_encoder = joblib.load(MODEL_DIR / "label_encoder.pkl")

ALL_POSITIONS = ["BB", "BTN", "CO", "HJ", "SB", "UTG"]


def predict_preflop_action(hand_strength, num_bets, pot_size, num_players, position):
    row = {
        "our_hand_strength": hand_strength,
        "num_bets": num_bets,
        "pot_size": pot_size,
        "num_players": num_players,
    }
    for pos in ALL_POSITIONS:
        row[f"pos_{pos}"] = 1 if position == pos else 0

    X = pd.DataFrame([row])
    prediction_encoded = _model.predict(X)[0]
    action = _label_encoder.inverse_transform([prediction_encoded])[0]
    return action