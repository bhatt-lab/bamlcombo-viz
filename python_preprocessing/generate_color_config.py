# python_scripts/generate_color_config.py

import pandas as pd
import json
import re

# --- Configuration ---
# We now have two source files for details
MONOTHERAPY_DETAILS_FILE = 'data/suppTablesCsv/supptables_s7.monotherapy_details.csv'
COMBINATION_DETAILS_FILE = 'data/suppTablesCsv/supptables_s8.combination_details.csv'

COLOR_PALETTE = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
]

def generate_unified_config():
    """
    Generates a config file with two maps by combining monotherapy
    and combination therapy details.
    """
    print("--- Generating Unified Color Configuration ---")
    try:
        # Load both detail files
        df_mono = pd.read_csv(MONOTHERAPY_DETAILS_FILE)
        df_combo = pd.read_csv(COMBINATION_DETAILS_FILE)
        print("Source detail files loaded successfully.")
    except FileNotFoundError as e:
        print(f"--- 🛑 ERROR: File not found! {e} ---")
        return

    # --- Combine the two dataframes ---
    if 'Drug_Class' in df_mono.columns:
            # Rename 'Drug_Class' to 'combo_class' to match the combination dataframe
            df_mono = df_mono.rename(columns={'Drug_Class': 'combo_class'})
            print("Standardized 'Drug_Class' column to 'combo_class'.")
    else:
        print("--- ⚠️ WARNING: 'Drug_Class' column not found in monotherapy file. Assuming it's already named 'combo_class'. ---")

    # --- Combine the two dataframes ---
    # Now that the class columns have the same name, we can combine them.
    details_df = pd.concat([
        df_mono[['Chemical_compound', 'combo_class']],
        df_combo[['Chemical_compound', 'combo_class']]
    ]).drop_duplicates(subset=['Chemical_compound']).reset_index(drop=True)
    print("Monotherapy and combination details have been combined.")

    # --- MAP 1: Create the map from Chemical_compound to combo_class ---
    compound_to_class = {}
    for index, row in details_df.iterrows():
        normalized_key = re.sub(r'\s+', '', str(row['Chemical_compound']).lower())
        compound_to_class[normalized_key] = row['combo_class']

    # --- MAP 2: Create the map from combo_class to color ---
    unique_classes = details_df['combo_class'].dropna().unique()
    class_colors = {}
    for i, class_name in enumerate(unique_classes):
        color = COLOR_PALETTE[i % len(COLOR_PALETTE)]
        class_colors[class_name] = color
    
    print(f"Found {len(unique_classes)} unique classes across all therapies.")

    # --- Combine and print the final output ---
    final_config = {
        'compoundToClass': compound_to_class,
        'classColors': class_colors
    }
    js_object_string = json.dumps(final_config, indent=4)
    print("\n--- ✅ Success! Copy the text below and paste it into js/color_config.js ---\n")
    print(f"const COLOR_CONFIG = {js_object_string};")
    print("\n--------------------------------------------------------------------------\n")

if __name__ == "__main__":
    generate_unified_config()