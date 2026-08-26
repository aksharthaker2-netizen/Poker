import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor
import features

hole_cards = ["Ah", "Kd"]
pot_size = 340
num_bets = 1
pot_size_bb = pot_size / 10
num_players = 4
position = features.map_position_label("button")

strength = features.hand_strength(hole_cards, [])
print(f"hand_strength: {strength}")
print(f"pot_size_bb: {pot_size_bb}")
print(f"position (mapped): {position}")
print(f"num_bets: {num_bets}")
print(f"num_players: {num_players}")

action = predictor.predict_preflop_action(
    hand_strength=strength, num_bets=num_bets, pot_size=pot_size_bb,
    num_players=num_players, position=position,
)
print(f"\nPredicted action: {action}")

import pandas as pd
row = {"our_hand_strength": strength, "num_bets": num_bets, "pot_size": pot_size_bb, "num_players": num_players}
for pos in predictor.ALL_POSITIONS:
    row[f"pos_{pos}"] = 1 if pos == position else 0
X = pd.DataFrame([row])
print(f"\nProbabilities ({list(predictor._label_encoder.classes_)}):")
print(predictor._model.predict_proba(X))