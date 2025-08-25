# python_scripts/preprocess_dss_data.py

import pandas as pd
import os
import json

# --- Configuration ---
# Path to the large source CSV file
SOURCE_DSS_FILE = 'data/suppTablesCsv/supptables_s11.dss_combination.csv'

# The new folder where we will save the individual JSON files
OUTPUT_FOLDER = 'data/dss_by_sample'

def split_dss_by_sample():
    """
    Reads the large DSS combination file and splits it into individual
    JSON files, one for each Sample_ID.
    """
    print(f"Starting DSS data pre-processing...")
    
    # --- 1. Create the output directory if it doesn't exist ---
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created output directory: {OUTPUT_FOLDER}")

    # --- 2. Load the large CSV file ---
    try:
        print(f"Loading the large source file: {SOURCE_DSS_FILE}...")
        df = pd.read_csv(SOURCE_DSS_FILE)
        print("Source file loaded successfully.")
    except FileNotFoundError:
        print(f"--- 🛑 ERROR: Source file not found at '{SOURCE_DSS_FILE}'. ---")
        return

    # --- 3. Group the data by 'Sample_ID' ---
    # This is the core of the operation. It creates a group for each unique sample.
    print("Grouping data by 'Sample_ID'...")
    grouped = df.groupby('Sample_ID')
    
    total_samples = len(grouped)
    print(f"Found {total_samples} unique samples to process.")

    # --- 4. Loop through each group and save it as a JSON file ---
    processed_count = 0
    for sample_id, sample_group_df in grouped:
        
        # Define the output path for the new JSON file
        output_path = os.path.join(OUTPUT_FOLDER, f"{sample_id}.json")
        
        sample_group_df.to_json(output_path, orient='records', indent=4)
                
        processed_count += 1
        # Print progress to the console so you know it's working
        if processed_count % 100 == 0 or processed_count == total_samples:
            print(f"  Processed {processed_count}/{total_samples} samples...")

    print(f"\n--- ✅ Success! Pre-processing complete. ---")
    print(f"{total_samples} JSON files have been created in '{OUTPUT_FOLDER}'.")


if __name__ == "__main__":
    split_dss_by_sample()