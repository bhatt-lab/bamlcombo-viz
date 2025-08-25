# python_scripts/generate_color_config.py

import pandas as pd
import json
import re

# --- Configuration ---
COMBINATION_DETAILS_FILE = 'data/suppTablesCsv/supptables_s8.combination_details.csv'
COLOR_PALETTE = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
]

def generate_config():
    """
    Generates a config file with two maps:
    1. A map from normalized Chemical_compound to combo_class.
    2. A map from combo_class to a unique color.
    """
    print(f"Reading combination details from '{COMBINATION_DETAILS_FILE}'...")
    try:
        # Ensure the column names match your CSV file exactly.
        # Common names are 'Chemical_compound' and 'combo_class'.
        df = pd.read_csv(COMBINATION_DETAILS_FILE)
    except FileNotFoundError:
        print(f"--- 🛑 ERROR: File not found! Please check the path. ---")
        return
    except KeyError as e:
        print(f"--- 🛑 ERROR: A required column was not found: {e} ---")
        print(f"Please ensure your CSV contains the columns 'Chemical_compound' and 'combo_class'.")
        return

    # --- MAP 1: Create the map from Chemical_compound to combo_class ---
    print("\n--- Generating Compound -> Class Map ---")
    compound_to_class = {}
    for index, row in df.iterrows():
        original_compound = str(row['Chemical_compound'])
        # Use regex to create a robust, normalized key
        normalized_key = re.sub(r'\s+', '', original_compound.lower())
        compound_to_class[normalized_key] = row['combo_class']
        
        if index < 5: # Print first 5 examples for verification
             print(f"Original Compound: '{original_compound}'  =>  Normalized Key: '{normalized_key}'")

    # --- MAP 2: Create the map from combo_class to color ---
    unique_classes = df['combo_class'].dropna().unique()
    class_colors = {}
    for i, class_name in enumerate(unique_classes):
        color = COLOR_PALETTE[i % len(COLOR_PALETTE)]
        class_colors[class_name] = color
    
    print(f"\nFound {len(unique_classes)} unique classes and assigned colors.")

    # --- Combine both maps into a single configuration object ---
    final_config = {
        'compoundToClass': compound_to_class,
        'classColors': class_colors
    }

    # Convert and print the final output
    js_object_string = json.dumps(final_config, indent=4)
    print("\n--- ✅ Success! Copy the text below and paste it into js/color_config.js ---\n")
    print(f"const COLOR_CONFIG = {js_object_string};")
    print("\n--------------------------------------------------------------------------\n")


if __name__ == "__main__":
    generate_config()