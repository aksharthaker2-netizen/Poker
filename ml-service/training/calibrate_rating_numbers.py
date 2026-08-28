matchup_results = {
    (400, 800): -31.19, (400, 1200): -74.45, (400, 1600): -105.28,
    (800, 1200): -54.99, (800, 1600): -83.41, (1200, 1600): -58.07,
}

tiers = [400, 800, 1200, 1600]
power_scores = {}

for tier in tiers:
    results = []
    for (a, b), value in matchup_results.items():
        if a == tier:
            results.append(value)
        elif b == tier:
            results.append(-value)
    power_scores[tier] = sum(results) / len(results)

print("Power scores (average bb/100 vs the field):")
for tier in tiers:
    print(f"  {tier}: {power_scores[tier]:.2f}")

min_score = min(power_scores.values())
max_score = max(power_scores.values())
DISPLAY_MIN, DISPLAY_MAX = 400, 1600

print("\nRecalibrated display ratings (anchored to 400-1600 range):")
new_ratings = {}
for tier in tiers:
    scaled = DISPLAY_MIN + (power_scores[tier] - min_score) / (max_score - min_score) * (DISPLAY_MAX - DISPLAY_MIN)
    new_ratings[tier] = round(scaled)
    print(f"  Old label {tier} -> New rating {new_ratings[tier]}")