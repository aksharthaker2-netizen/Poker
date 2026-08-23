import pandas as pd
from pathlib import Path

df = pd.read_csv(Path(__file__).resolve().parent / "data" / "postflop_headsup_log.csv")

df["strength_bucket"] = pd.cut(df["hand_strength"], bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0], include_lowest=True)

print("=== Situations where hero faces a bet (to_call > 0) ===")
facing_bet = df[df["facing_a_bet"] == True]
print(facing_bet.groupby(["strength_bucket", "action"])["hero_profit"].agg(["mean", "count"]))

print("\n=== Situations where hero can check (to_call == 0) ===")
no_bet = df[df["facing_a_bet"] == False]
print(no_bet.groupby(["strength_bucket", "action"])["hero_profit"].agg(["mean", "count"]))