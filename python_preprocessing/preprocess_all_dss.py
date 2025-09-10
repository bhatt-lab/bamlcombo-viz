# python_scripts/preprocess_all_dss.py

import pandas as pd
import os

# --- Configuration ---
MONO_DSS_FILE = 'data/suppTablesCsv/supptables_s10.dss_monotherapy.csv'
COMBO_DSS_FILE = 'data/suppTablesCsv/supptables_s11.dss_combination.csv'
OUTPUT_FOLDER = 'data/unified_dss_by_sample' # New folder for the unified data

def preprocess_all_dss():
    """
    Reads both monotherapy and combination DSS files, combines them,
    and splits them into individual JSON files for each Sample_ID.
    """
    print("--- Starting Unified DSS Pre-processing ---")
    
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created output directory: {OUTPUT_FOLDER}")

    try:
        print("Loading source DSS files...")
        df_mono = pd.read_csv(MONO_DSS_FILE)
        df_combo = pd.read_csv(COMBO_DSS_FILE)
        print("Source files loaded successfully.")
    except FileNotFoundError as e:
        print(f"--- 🛑 ERROR: File not found! {e} ---")
        return

    # --- Standardize and Combine DataFrames ---
    # We need to make sure the columns we care about have the same names.
    # The monotherapy file might have 'Chemical_compound' instead of 'Combination'. Let's rename it.
    if 'Chemical_compound' in df_mono.columns:
        df_mono = df_mono.rename(columns={'Chemical_compound': 'Combination'})
    
    # Select only the columns needed for the plot to keep things clean
    common_cols = ['Sample_ID', 'Combination', 'DSS']
    df_mono_subset = df_mono[common_cols]
    df_combo_subset = df_combo[common_cols]

    # Concatenate the two dataframes into one large one
    df_unified = pd.concat([df_mono_subset, df_combo_subset])
    print("Monotherapy and combination DSS data have been combined.")

    # --- Group by Sample_ID and Save ---
    print("Grouping data by 'Sample_ID'...")
    grouped = df_unified.groupby('Sample_ID')
    
    total_samples = len(grouped)
    print(f"Found {total_samples} unique samples to process.")

    processed_count = 0
    for sample_id, sample_group_df in grouped:
        output_path = os.path.join(OUTPUT_FOLDER, f"{sample_id}.json")
        
        # Use pandas' built-in .to_json() to correctly handle missing values (NaN -> null)
        sample_group_df.to_json(output_path, orient='records', indent=4)
        
        processed_count += 1
        if processed_count % 200 == 0 or processed_count == total_samples:
            print(f"  Processed {processed_count}/{total_samples} samples...")

    print(f"\n--- ✅ Success! Unified DSS Pre-processing complete. ---")

if __name__ == "__main__":
    preprocess_all_dss()