import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor

action = predictor.predict_postflop_action(
    hole_cards=["Ah", "Ad"], community_cards=["Ac", "7h", "2d"],
    pot_size=20, to_call=10, min_raise=20,
    num_prior_bets=0, is_hero_aggressor=False, street="Flop", hero_is_ip=False,
)
print(f"Set of Aces on A-7-2 board, facing small bet: {action}")

action2 = predictor.predict_postflop_action(
    hole_cards=["2c", "7d"], community_cards=["Ac", "Kh", "Qd"],
    pot_size=20, to_call=10, min_raise=20,
    num_prior_bets=0, is_hero_aggressor=False, street="Flop", hero_is_ip=False,
)
print(f"Complete air on A-K-Q board, facing small bet: {action2}")