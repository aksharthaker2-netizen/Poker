import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_hand_full_log, heuristic_bot_decide, xgboost_bot_decide
import pandas as pd

NUM_HANDS = 50000
opponent_pool = [heuristic_bot_decide, xgboost_bot_decide]

all_logs = []
for i in range(NUM_HANDS):
    all_logs.extend(play_hand_full_log(opponent_pool))
    if (i + 1) % 10000 == 0:
        print(f"{i + 1}/{NUM_HANDS} hands simulated...")

df = pd.DataFrame(all_logs)
out_path = Path(__file__).resolve().parent / "data" / "headsup_full_log.csv"
df.to_csv(out_path, index=False)
print(f"\nLogged {len(df)} decisions from {NUM_HANDS} hands to {out_path}")
print(df["phase"].value_counts())