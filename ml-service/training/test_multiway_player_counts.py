import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_multiway_simulation, xgboost_bot_decide

NUM_HANDS = 2000

for num_players in [3, 4, 5, 6]:
    decide_fns = [xgboost_bot_decide] * num_players
    totals = run_multiway_simulation(NUM_HANDS, num_players, decide_fns)
    print(f"\n{num_players} players, {NUM_HANDS} hands:")
    for i, profit in enumerate(totals):
        bb_per_100 = (profit / 10) / NUM_HANDS * 100
        print(f"  Seat {i}: total profit={profit}, bb/100={bb_per_100:.2f}")