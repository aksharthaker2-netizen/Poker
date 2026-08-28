import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_multiway_hand, xgboost_bot_decide

decide_fns = [xgboost_bot_decide] * 4
for i in range(20):
    profits, outcome = play_multiway_hand(decide_fns, 4)
    total = sum(profits)
    if abs(total) > 0.01:
        print(f"BROKEN HAND {i}: profits={profits}, total={total}, outcome={outcome}")