import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import features

import tomllib
import pandas as pd

data_dir = Path(__file__).resolve().parent / "data" / "acpc_phh"


def extract_postflop_records(hand):
    actions = hand.get("actions", [])
    blinds = hand.get("blinds_or_straddles")
    if not blinds or len(blinds) != 2:
        return []
    big_blind = blinds[1]

    deal_actions = [a for a in actions if a.startswith("d dh")]
    if len(deal_actions) != 2:
        return []
    hole_cards = {}
    for da in deal_actions:
        parts = da.split()
        hole_cards[parts[2]] = [parts[3][0:2], parts[3][2:4]]

    committed = {"p1": blinds[0], "p2": blinds[1]}
    pot = blinds[0] + blinds[1]
    board = []
    street = "Preflop"
    num_bets_this_street = 0
    aggressor = None
    records = []

    non_deal = [a for a in actions if not a.startswith("d dh")]
    for action_str in non_deal:
        parts = action_str.split()

        if parts[0] == "d" and parts[1] == "db":
            new_cards = [parts[2][i:i+2] for i in range(0, len(parts[2]), 2)]
            board.extend(new_cards)
            street = {3: "Flop", 4: "Turn", 5: "River"}.get(len(board), street)
            num_bets_this_street = 0
            continue

        actor = parts[0]
        act_code = parts[1]
        to_call = max(committed.values()) - committed[actor]

        if street != "Preflop":
            strength = features.hand_strength(hole_cards[actor], board)
            is_paired, flush_possible = features.board_texture(board)
            straight_poss = features.straight_possible(board)
            row = {
                "our_hand_strength": strength,
                "pot_size": pot / big_blind,
                "num_prior_bets": num_bets_this_street,
                "is_hero_aggressor": int(aggressor == actor),
                "facing_bet_to_pot": (to_call / pot) if pot > 0 else 0,
                "board_paired": is_paired,
                "board_flush_possible": flush_possible,
                "board_straight_possible": straight_poss,
                "street_Flop": int(street == "Flop"),
                "street_River": int(street == "River"),
                "street_Turn": int(street == "Turn"),
                "pos_IP": 0,
                "pos_OOP": 1,
            }

            if act_code == "f":
                label = "fold"
            elif act_code == "cc":
                label = "call" if to_call > 0 else "check"
            elif act_code == "cbr":
                label = "raise"
            else:
                continue

            row["action_label"] = label
            records.append(row)

        if act_code == "cc":
            committed[actor] = max(committed.values())
        elif act_code == "cbr":
            committed[actor] = int(parts[2])
            num_bets_this_street += 1
            aggressor = actor
        pot = committed["p1"] + committed["p2"]

        if act_code == "f":
            return records

    return records


all_records = []
for file_path in data_dir.iterdir():
    content = file_path.read_text()
    hand_blocks = content.split("\n[")
    hand_blocks = [("[" + b if not b.startswith("[") else b) for b in hand_blocks]

    for block in hand_blocks:
        lines = block.split("\n", 1)
        if len(lines) < 2:
            continue
        try:
            hand = tomllib.loads(lines[1])
        except Exception:
            continue
        all_records.extend(extract_postflop_records(hand))

df = pd.DataFrame(all_records)
out_path = Path(__file__).resolve().parent / "data" / "acpc_postflop_full.csv"
df.to_csv(out_path, index=False)
print(f"Extracted {len(df)} postflop decision points")
print(df["action_label"].value_counts())