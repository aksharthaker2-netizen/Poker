import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import build_side_pots, resolve_multiway_showdown

# Scenario: A contributed 100, B contributed 50 (all-in short stack), C contributed 100
# Total pot = 250. B can only win up to 3x50=150 (the "main pot").
# The remaining 100 (50 extra from A + 50 extra from C) is a side pot, A vs C only.
total_contributed = {0: 100, 1: 50, 2: 100}
still_in = [0, 1, 2]

pots = build_side_pots(total_contributed, still_in)
print("Side pots built:")
for amount, eligible in pots:
    print(f"  Pot of {amount}, eligible seats: {eligible}")

expected_total = sum(amount for amount, _ in pots)
print(f"\nTotal across all pots: {expected_total} (should equal 250)")