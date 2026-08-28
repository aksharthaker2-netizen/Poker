import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import build_side_pots, resolve_multiway_showdown

# Board: all hearts except one card, to make specific hands easy to reason about
board = ["Ah", "Kh", "5h", "2c", "9d"]

# Seat 0 (A): pair of Kings - decent
# Seat 1 (B): flush (all hearts) - best hand, but only eligible for main pot
# Seat 2 (C): just Ace high - weakest
hole_cards = {
    0: ["Kd", "Kc"],
    1: ["Qh", "Jh"],
    2: ["2d", "3d"],
}

total_contributed = {0: 100, 1: 50, 2: 100}
still_in = [0, 1, 2]
starting_stacks = {0: 900, 1: 0, 2: 900}  # what's left in stack after committing

pots = build_side_pots(total_contributed, still_in)
final_stacks = dict(starting_stacks)

for pot_amount, eligible_seats in pots:
    winners = resolve_multiway_showdown(hole_cards, board, eligible_seats)
    share = pot_amount // len(winners)
    remainder = pot_amount - share * len(winners)
    for w in winners:
        final_stacks[w] += share
    final_stacks[winners[0]] += remainder
    print(f"Pot of {pot_amount} (eligible {eligible_seats}) won by seat(s) {winners}")

print(f"\nFinal stacks: {final_stacks}")
print(f"Total chips: {sum(final_stacks.values())} (should equal 900+0+900+250 = 2050)")