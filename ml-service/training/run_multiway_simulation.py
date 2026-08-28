import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_seat_rotating_multiway, xgboost_bot_decide

NUM_HANDS = 6000
NUM_PLAYERS = 4
decide_fns = [xgboost_bot_decide] * NUM_PLAYERS

totals = run_seat_rotating_multiway(NUM_HANDS, NUM_PLAYERS, decide_fns)
print(f"Hands played: {NUM_HANDS}, Players: {NUM_PLAYERS} (blind duty rotated every hand)")
for i, profit in enumerate(totals):
    bb_per_100 = (profit / 10) / NUM_HANDS * 100
    print(f"Seat {i}: total profit={profit}, bb/100={bb_per_100:.2f}")