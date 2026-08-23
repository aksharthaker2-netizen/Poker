import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
import pandas as pd
from data_utils import DATA_DIR

df = pd.read_csv(DATA_DIR / "preflop_60k_train.csv")

print("Row count by num_players:")
print(df["num_players"].value_counts().sort_index())

print("\nAction distribution when num_players == 2:")
two_player_rows = df[df["num_players"] == 2]
print(two_player_rows["correct_decision"].apply(lambda d: d if d in ("fold", "call") else "raise").value_counts())

print("\nSample prev_line values when num_players == 2 (to see hand context):")
print(two_player_rows["prev_line"].head(10).tolist())

print("\nFold rate by num_bets, when num_players == 2:")
two_player_rows = df[df["num_players"] == 2].copy()
two_player_rows["is_fold"] = (two_player_rows["correct_decision"] == "fold").astype(int)
print(two_player_rows.groupby("num_bets")["is_fold"].agg(["mean", "count"]))

exact_situation = df[
    (df["num_players"] == 2) &
    (df["num_bets"] == 1) &
    (df["hero_pos"] == "SB")
]
print(f"\nRows matching num_players=2, num_bets=1, hero_pos=SB: {len(exact_situation)}")
print(exact_situation["correct_decision"].apply(lambda d: d if d in ("fold", "call") else "raise").value_counts())

print("\nSample prev_line for our exact situation (num_players=2, num_bets=1, SB):")
exact_situation = df[
    (df["num_players"] == 2) &
    (df["num_bets"] == 1) &
    (df["hero_pos"] == "SB")
]
print(exact_situation["prev_line"].head(15).tolist())
print()
print("Sample prev_line where num_bets == 0 instead, same position/player count:")
zero_bets = df[
    (df["num_players"] == 2) &
    (df["num_bets"] == 0) &
    (df["hero_pos"] == "SB")
]
print(f"Row count: {len(zero_bets)}")
print(zero_bets["prev_line"].head(15).tolist())