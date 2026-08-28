import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_mixed_multiway_validation

NUM_HANDS = 8000
NUM_PLAYERS = 4
XGBOOST_SEATS = {0, 1}

xgb_profit, heur_profit = run_mixed_multiway_validation(NUM_HANDS, NUM_PLAYERS, XGBOOST_SEATS)

xgb_bb100 = (xgb_profit / len(XGBOOST_SEATS)) / 10 / NUM_HANDS * 100
heur_bb100 = (heur_profit / (NUM_PLAYERS - len(XGBOOST_SEATS))) / 10 / NUM_HANDS * 100

print(f"{NUM_PLAYERS}-player table, {len(XGBOOST_SEATS)} XGBoost seats vs {NUM_PLAYERS - len(XGBOOST_SEATS)} Phase 0 seats")
print(f"Hands: {NUM_HANDS}, seats and blinds rotated every hand")
print(f"XGBoost avg bb/100 per seat: {xgb_bb100:.2f}")
print(f"Phase 0 avg bb/100 per seat: {heur_bb100:.2f}")