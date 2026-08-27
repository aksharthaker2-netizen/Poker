import pandas as pd
import json
from pathlib import Path

df = pd.read_csv(Path(__file__).resolve().parent / "data" / "acpc_headsup_opening.csv")
df["bucket"] = pd.cut(df["hand_strength"], bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0], include_lowest=True)

grouped = df.groupby(["bucket", "action"])["profit_bb"].mean()

lookup = {}
for (bucket, action), mean_profit in grouped.items():
    bucket_key = f"{bucket.left}-{bucket.right}"
    lookup.setdefault(bucket_key, {})[action] = round(mean_profit, 3)

out_path = Path(__file__).resolve().parent.parent / "app" / "model" / "ev_lookup.json"
with open(out_path, "w") as f:
    json.dump(lookup, f, indent=2)

print(f"Saved EV lookup table to {out_path}")
print(json.dumps(lookup, indent=2)) 