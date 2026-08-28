import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_mixed_multiway_validation

NUM_HANDS = 8000

configs = [
    (3, {0}),
    (4, {0, 1}),
    (5, {0, 1}),
    (6, {0, 1, 2}),
]

for num_players, xgboost_seats in configs:
    xgb_profit, heur_profit = run_mixed_multiway_validation(NUM_HANDS, num_players, xgboost_seats)
    num_heur_seats = num_players - len(xgboost_seats)

    xgb_bb100 = (xgb_profit / len(xgboost_seats)) / 10 / NUM_HANDS * 100
    heur_bb100 = (heur_profit / num_heur_seats) / 10 / NUM_HANDS * 100

    print(f"{num_players} players ({len(xgboost_seats)} XGBoost vs {num_heur_seats} Phase 0):")
    print(f"  XGBoost avg bb/100 per seat: {xgb_bb100:.2f}")
    print(f"  Phase 0 avg bb/100 per seat: {heur_bb100:.2f}")