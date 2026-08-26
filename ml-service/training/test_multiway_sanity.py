import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor
import features

test_cases = [
    # (description, hole_cards, num_bets, pot_size_bb, num_players, position)
    ("Pocket Aces, UTG open, 6-max", ["Ah", "Ad"], 1, 1.5, 6, "UTG"),
    ("7-2 offsuit, UTG open, 6-max", ["7c", "2h"], 1, 1.5, 6, "UTG"),
    ("Pocket Aces, BB facing UTG raise, 6-max", ["Ah", "Ad"], 2, 4.5, 6, "BB"),
    ("Weak Ace, BTN open, 4-max", ["Ac", "4h"], 1, 1.5, 4, "BTN"),
    ("Suited connector, CO open, 5-max", ["9h", "8h"], 1, 1.5, 5, "CO"),
]

for description, hole_cards, num_bets, pot_size_bb, num_players, position in test_cases:
    strength = features.hand_strength(hole_cards, [])
    action = predictor.predict_preflop_action(
        hand_strength=strength, num_bets=num_bets, pot_size=pot_size_bb,
        num_players=num_players, position=position,
    )
    print(f"{description}: strength={strength:.3f} -> {action}")