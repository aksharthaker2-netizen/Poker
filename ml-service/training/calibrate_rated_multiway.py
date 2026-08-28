import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import run_rated_multiway_calibration

NUM_HANDS = 8000
NUM_PLAYERS = 4
SEAT_RATINGS = {0: 400, 1: 800, 2: 1200, 3: 1600}

totals = run_rated_multiway_calibration(NUM_HANDS, NUM_PLAYERS, SEAT_RATINGS)

print(f"{NUM_PLAYERS}-player table, one seat per rating tier, {NUM_HANDS} hands, rotated")
for rating in sorted(totals.keys()):
    bb100 = (totals[rating] / 10) / NUM_HANDS * 100
    print(f"Rating {rating}: bb/100 = {bb100:.2f}")