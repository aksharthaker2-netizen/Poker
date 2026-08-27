import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_multiway_simulation, xgboost_bot_decide

NUM_HANDS = 2000
NUM_PLAYERS = 6
decide_fns = [xgboost_bot_decide] * NUM_PLAYERS

print("Blinds on seats 4/5 (default):")
totals_default = run_multiway_simulation(NUM_HANDS, NUM_PLAYERS, decide_fns, sb_seat=4)
for i, profit in enumerate(totals_default):
    print(f"  Seat {i}: bb/100={(profit/10)/NUM_HANDS*100:.2f}")

print("\nBlinds on seats 0/1 (swapped):")
totals_swapped = run_multiway_simulation(NUM_HANDS, NUM_PLAYERS, decide_fns, sb_seat=0)
for i, profit in enumerate(totals_swapped):
    print(f"  Seat {i}: bb/100={(profit/10)/NUM_HANDS*100:.2f}")