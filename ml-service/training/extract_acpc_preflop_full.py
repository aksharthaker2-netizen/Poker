import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import features

import pandas as pd

data_dir = Path(__file__).resolve().parent / "data" / "acpc_phh"
ALL_POSITIONS = ["BB", "BTN", "CO", "HJ", "SB", "UTG"]


def extract_hand_records(hand):
    actions = hand.get("actions", [])
    blinds = hand.get("blinds_or_straddles")
    if not blinds or len(blinds) != 2:
        return []

    deal_actions = [a for a in actions if a.startswith("d dh")]
    if len(deal_actions) != 2:
        return []
    hole_cards = {}
    for da in deal_actions:
        parts = da.split()
        hole_cards[parts[2]] = [parts[3][0:2], parts[3][2:4]]

    non_deal = [a for a in actions if not a.startswith("d dh")]
    preflop_actions = []
    for a in non_deal:
        if a.startswith("d db"):
            break
        preflop_actions.append(a)
    if not preflop_actions:
        return []

    first_actor = preflop_actions[0].split()[0]
    other_actor = "p2" if first_actor == "p1" else "p1"
    position_map = {first_actor: "SB", other_actor: "BB"}

    committed = {"p1": blinds[0], "p2": blinds[1]}
    pot = blinds[0] + blinds[1]
    num_bets = 1
    records = []

    for action_str in preflop_actions:
        parts = action_str.split()
        actor = parts[0]
        act_code = parts[1]
        to_call = max(committed.values()) - committed[actor]

        strength = features.hand_strength(hole_cards[actor], [])
        row = {
            "our_hand_strength": strength,
            "num_bets": num_bets,
            "pot_size": pot,
            "num_players": 2,
        }
        for pos in ALL_POSITIONS:
            row[f"pos_{pos}"] = 1 if position_map[actor] == pos else 0

        if act_code == "f":
            label = "fold"
        elif act_code == "cc":
            label = "call" if to_call > 0 else "check"
            committed[actor] = max(committed.values())
            pot = committed["p1"] + committed["p2"]
        elif act_code == "cbr":
            label = "raise"
            committed[actor] = int(parts[2])
            pot = committed["p1"] + committed["p2"]
            num_bets += 1
        else:
            continue

        row["action_label"] = label
        records.append(row)

        if label == "fold":
            break

    return records


all_records = []
for file_path in data_dir.iterdir():
    content = file_path.read_text()
    hand_blocks = content.split("\n[")
    hand_blocks = [("[" + b if not b.startswith("[") else b) for b in hand_blocks]

    import tomllib
    for block in hand_blocks:
        lines = block.split("\n", 1)
        if len(lines) < 2:
            continue
        try:
            hand = tomllib.loads(lines[1])
        except Exception:
            continue
        all_records.extend(extract_hand_records(hand))

df = pd.DataFrame(all_records)
out_path = Path(__file__).resolve().parent / "data" / "acpc_preflop_full.csv"
df.to_csv(out_path, index=False)
print(f"Extracted {len(df)} preflop decision points")
print(df["action_label"].value_counts())