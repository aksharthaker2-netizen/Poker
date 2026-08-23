import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_hand_and_log_postflop
import pandas as pd

NUM_HANDS = 20000
all_logs = []
for i in range(NUM_HANDS):
    all_logs.extend(play_hand_and_log_postflop())

df = pd.DataFrame(all_logs)
out_path = Path(__file__).resolve().parent / "data" / "postflop_headsup_log.csv"
df.to_csv(out_path, index=False)
print(f"Logged {len(df)} postflop decisions from {NUM_HANDS} hands to {out_path}")