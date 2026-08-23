import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))

from simulator import play_one_hand, xgboost_bot_decide, heuristic_bot_decide

for i in range(30):
    hero_profit, villain_profit = play_one_hand(xgboost_bot_decide, heuristic_bot_decide)
    print(f"Hand {i}: hero_profit={hero_profit}, villain_profit={villain_profit}")