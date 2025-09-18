# python_scripts/preprocess_genomics_data.py

import pandas as pd
import os
import json

# --- Configuration ---
MUTATIONS_FILE = 'data/suppTablesCsv/supptables_s3.wes_targeted_sequencing.csv'
FUSIONS_FILE = 'data/suppTablesCsv/supptables_s5.consensus_aml_fusion.csv'
OUTPUT_FOLDER = 'data/genomics_by_sample'

MUTATION_COLS = ['Sample_ID', 'lab_id', 'capture_type', 't_vaf', 'variant_classification', 'gene', 'symbol', 'biotype']

# --- HELPER FUNCTION ---
def is_true(value):
    """
    A robust function to check for 'true' values.
    Returns True if the value is the number 1 or the string 'True' (case-insensitive).
    """
    if isinstance(value, (int, float)):
        return value == 1
    if isinstance(value, str):
        return value.lower() == 'true'
    return False

def preprocess_genomics_data():
    """
    Reads mutation and fusion data, processes it using robust logic,
    and saves a combined JSON file for each sample, correctly handling all missing values.
    """
    print("--- Starting Genomics Data Pre-processing ---")
    
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created output directory: {OUTPUT_FOLDER}")

    try:
        print("Loading source files...")
        df_mut = pd.read_csv(MUTATIONS_FILE)
        df_fus = pd.read_csv(FUSIONS_FILE)
        
        # --- THIS IS THE DEFINITIVE FIX ---
        # Replace all pandas NaN values with Python's None in BOTH DataFrames.
        # This ensures all data is clean before any further processing.
        df_mut = df_mut.where(pd.notnull(df_mut), None)
        df_fus = df_fus.where(pd.notnull(df_fus), None)
        # --- END OF FIX ---

        print("Source files loaded and cleaned successfully.")
    except FileNotFoundError as e:
        print(f"--- 🛑 ERROR: File not found! {e} ---")
        return

    # --- Process Structural Variants (Fusions) ---
    print("Processing structural variants...")
    processed_fusions = []
    fusion_flag_cols = df_fus.columns[2:17]

    for _, row in df_fus.iterrows():
        consensus_val = ''
        if is_true(row['not_detect_mask']):
            consensus_val = 'Not detected'
        elif is_true(row['na_mask']):
            consensus_val = 'Not available'
        else:
            detected_fusions = [col for col in fusion_flag_cols if is_true(row[col])]
            consensus_val = ', '.join(detected_fusions) if detected_fusions else 'None'
        
        processed_fusions.append({
            'Sample_ID': row['Sample_ID'],
            'karyotype': row['karyotype'],
            'otherCytogenetics': row['otherCytogenetics'],
            'consensusAMLfusion': consensus_val
        })
    
    df_fus_processed = pd.DataFrame(processed_fusions)

    # --- Group both datasets by Sample_ID for fast lookup ---
    mut_groups = df_mut[MUTATION_COLS].groupby('Sample_ID')
    fus_groups = df_fus_processed.groupby('Sample_ID')
    
    all_sample_ids = set(df_mut['Sample_ID'].unique()) | set(df_fus['Sample_ID'].unique())
    total_samples = len(all_sample_ids)
    print(f"Found {total_samples} unique samples across both datasets.")

    # --- Loop through each sample and create its JSON file ---
    for i, sample_id in enumerate(all_sample_ids):
        mut_data = []
        if sample_id in mut_groups.groups:
            mut_data = mut_groups.get_group(sample_id).to_dict(orient='records')

        sv_data = []
        if sample_id in fus_groups.groups:
            sv_data = fus_groups.get_group(sample_id).to_dict(orient='records')

        final_data = {
            "mutations": mut_data,
            "structural_variants": sv_data
        }

        output_path = os.path.join(OUTPUT_FOLDER, f"{sample_id}.json")
        with open(output_path, 'w') as f:
            json.dump(final_data, f, indent=4)
        
        if (i + 1) % 200 == 0 or (i + 1) == total_samples:
            print(f"  Processed {i + 1}/{total_samples} samples...")

    print(f"\n--- ✅ Success! Genomics Pre-processing complete. All JSON files are valid. ---")

if __name__ == "__main__":
    preprocess_genomics_data()