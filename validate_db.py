import json
import sys

def validate_names():
    filepath = "data/names.json"
    print(f"Validating {filepath}...")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"ERROR: Failed to parse JSON: {e}")
        sys.exit(1)

    if not isinstance(data, list):
        print("ERROR: Root structure must be a JSON array (list).")
        sys.exit(1)

    required_fields = ["id", "name", "gender", "meaning", "origin", "language", "pronunciation", "alternativeSpellings"]
    valid_genders = {"male", "female", "unisex"}

    ids = set()
    names = set()
    gender_counts = {}
    origin_counts = {}

    for idx, entry in enumerate(data):
        if not isinstance(entry, dict):
            print(f"ERROR: Entry at index {idx} is not an object.")
            sys.exit(1)

        # Check required fields
        for field in required_fields:
            if field not in entry:
                print(f"ERROR: Entry index {idx} ({entry.get('name', 'Unknown')}) missing required field: '{field}'")
                sys.exit(1)

        # Field types
        if not isinstance(entry["id"], str) or not entry["id"].strip():
            print(f"ERROR: Entry index {idx} has invalid 'id'. Must be a non-empty string.")
            sys.exit(1)
        if not isinstance(entry["name"], str) or not entry["name"].strip():
            print(f"ERROR: Entry index {idx} has invalid 'name'. Must be a non-empty string.")
            sys.exit(1)
        if entry["gender"] not in valid_genders:
            print(f"ERROR: Entry '{entry['name']}' has invalid 'gender': '{entry['gender']}'. Must be one of {valid_genders}.")
            sys.exit(1)
        if not isinstance(entry["meaning"], str) or not entry["meaning"].strip():
            print(f"ERROR: Entry '{entry['name']}' has invalid 'meaning'.")
            sys.exit(1)
        if not isinstance(entry["origin"], str) or not entry["origin"].strip():
            print(f"ERROR: Entry '{entry['name']}' has invalid 'origin'.")
            sys.exit(1)
        if not isinstance(entry["language"], str) or not entry["language"].strip():
            print(f"ERROR: Entry '{entry['name']}' has invalid 'language'.")
            sys.exit(1)
        if not isinstance(entry["pronunciation"], str) or not entry["pronunciation"].strip():
            print(f"ERROR: Entry '{entry['name']}' has invalid 'pronunciation'.")
            sys.exit(1)
        if not isinstance(entry["alternativeSpellings"], list) or not all(isinstance(alt, str) for alt in entry["alternativeSpellings"]):
            print(f"ERROR: Entry '{entry['name']}' has invalid 'alternativeSpellings'. Must be a list of strings.")
            sys.exit(1)

        # Uniqueness
        if entry["id"] in ids:
            print(f"ERROR: Duplicate ID found: '{entry['id']}'")
            sys.exit(1)
        ids.add(entry["id"])

        name_lower = entry["name"].lower()
        if name_lower in names:
            print(f"ERROR: Duplicate name found: '{entry['name']}'")
            sys.exit(1)
        names.add(name_lower)

        # Stats
        gender = entry["gender"]
        gender_counts[gender] = gender_counts.get(gender, 0) + 1
        origin = entry["origin"]
        origin_counts[origin] = origin_counts.get(origin, 0) + 1

    print("\n--- Validation Success ---")
    print(f"Total names: {len(data)}")
    print(f"Gender breakdown: {gender_counts}")
    print(f"Origins breakdown: {origin_counts}")

if __name__ == "__main__":
    validate_names()
