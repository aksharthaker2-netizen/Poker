import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor
import features

test_cases = [
    ("Pocket Aces, UTG open, 6-max", ["Ah", "Ad"], 1, 1.5, 6, "UTG"),
    ("7-2 offsuit, UTG open, 6-max", ["7c", "2h"], 1, 1.5, 6, "UTG"),
    ("Pocket Aces, BB facing UTG raise, 6-max", ["Ah", "Ad"], 2, 4.5, 6, "BB"),
    ("Weak Ace, BTN open, 4-max", ["Ac", "4h"], 1, 1.5, 4, "BTN"),
    ("Suited connector, CO open, 5-max", ["9h", "8h"], 1, 1.5, 5, "CO"),

    # New cases below
    ("Weak Jack, UTG open, 3-max", ["Jc", "4d"], 1, 1.5, 3, "UTG"),
    ("Any two cards, BTN open, 2-max (true heads-up)", ["8c", "3d"], 1, 1.5, 2, "SB"),
    ("Pocket Kings, BB facing 3-bet, 6-max", ["Kh", "Kc"], 3, 10.5, 6, "BB"),
    ("Marginal hand facing 3-bet, should fold", ["Qc", "8d"], 3, 10.5, 6, "BB"),
    ("Pocket Aces facing 4-bet (huge aggression), 6-max", ["As", "Ac"], 4, 25.0, 6, "UTG"),
    ("Middle pair facing 4-bet, should fold", ["8h", "8d"], 4, 25.0, 6, "UTG"),
    ("Strong Ace, CO open, 6-max", ["As", "Qh"], 1, 1.5, 6, "CO"),
    ("Trash hand, SB open, 6-max", ["3c", "6d"], 1, 1.5, 6, "SB"),
]

for description, hole_cards, num_bets, pot_size_bb, num_players, position in test_cases:
    strength = features.hand_strength(hole_cards, [])
    action = predictor.predict_preflop_action(
        hand_strength=strength, num_bets=num_bets, pot_size=pot_size_bb,
        num_players=num_players, position=position,
    )
    print(f"{description}: strength={strength:.3f} -> {action}")