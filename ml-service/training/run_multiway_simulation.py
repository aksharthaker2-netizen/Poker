import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_multiway_simulation, xgboost_bot_decide

NUM_HANDS = 2000
NUM_PLAYERS = 4
decide_fns = [xgboost_bot_decide] * NUM_PLAYERS

totals = run_multiway_simulation(NUM_HANDS, NUM_PLAYERS, decide_fns, sb_seat=0)
print(f"Hands played: {NUM_HANDS}, Players: {NUM_PLAYERS}, blinds on seats 0/1")
for i, profit in enumerate(totals):
    bb_per_100 = (profit / 10) / NUM_HANDS * 100
    print(f"Seat {i}: total profit={profit}, bb/100={bb_per_100:.2f}")