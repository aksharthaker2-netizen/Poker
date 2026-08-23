import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_hand_and_log_opening
import pandas as pd

NUM_HANDS = 20000
records = []
for i in range(NUM_HANDS):
    records.append(play_hand_and_log_opening())

df = pd.DataFrame(records)
out_path = Path(__file__).resolve().parent / "data" / "headsup_opening_log.csv"
df.to_csv(out_path, index=False)
print(f"Logged {len(df)} hands to {out_path}")
print(df.head(10))