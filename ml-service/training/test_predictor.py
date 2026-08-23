import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor

print("Testing predict_preflop_action directly, varying hand_strength:")
print("(situation: num_bets=1, pot_size=1.5bb, num_players=2, position=SB)")
print()

for strength in [0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9, 1.0]:
    action = predictor.predict_preflop_action(
        hand_strength=strength,
        num_bets=1,
        pot_size=1.5,
        num_players=2,
        position="SB",
    )
    print(f"hand_strength={strength} -> {action}")