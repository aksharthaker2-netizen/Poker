import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_multiway_simulation, xgboost_bot_decide
import time

NUM_HANDS = 3
NUM_PLAYERS = 4
decide_fns = [xgboost_bot_decide] * NUM_PLAYERS

start = time.time()
totals = run_multiway_simulation(NUM_HANDS, NUM_PLAYERS, decide_fns)
elapsed = time.time() - start

print(f"Hands played: {NUM_HANDS}, Players: {NUM_PLAYERS}")
print(f"Time taken: {elapsed:.1f} seconds ({elapsed/NUM_HANDS*1000:.1f} ms/hand)")
for i, profit in enumerate(totals):
    bb_per_100 = (profit / 10) / NUM_HANDS * 100
    print(f"Seat {i}: total profit={profit}, bb/100={bb_per_100:.2f}")