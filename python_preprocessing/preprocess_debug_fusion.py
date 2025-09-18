# python_scripts/debug_fusion.py

import pandas as pd

FUSIONS_FILE = 'data/suppTablesCsv/supptables_s5.consensus_aml_fusion.csv'

# --- NEW HELPER FUNCTION ---
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
# --- END OF HELPER FUNCTION ---

def debug_single_sample_fusion(sample_id_to_find):
    print(f"--- Starting Debug for Sample ID: {sample_id_to_find} ---")
    
    try:
        df = pd.read_csv(FUSIONS_FILE)
        print(f"Successfully loaded '{FUSIONS_FILE}'")
    except FileNotFoundError:
        print(f"--- 🛑 ERROR: File not found! ---")
        return

    sample_row_df = df[df['Sample_ID'] == sample_id_to_find]
    if sample_row_df.empty:
        print(f"--- 🛑 ERROR: Sample ID '{sample_id_to_find}' not found. ---")
        return

    row = sample_row_df.iloc[0]
    
    print("\n--- Raw Data for this Sample ---")
    print(f"Value of 'not_detect_mask' column: '{row['not_detect_mask']}' (Type: {type(row['not_detect_mask'])})")
    print(f"Value of 'na_mask' column: '{row['na_mask']}' (Type: {type(row['na_mask'])})")
    
    print("\n--- Applying HYBRID Logic Step-by-Step ---")
    
    consensus_val = ''
    fusion_flag_cols = df.columns[2:17]

    # --- MODIFIED LOGIC: Use the new helper function for all checks ---
    print(f"1. Checking is_true('{row['not_detect_mask']}')")
    if is_true(row['not_detect_mask']):
        consensus_val = 'Not detected'
        print("   -> Condition MET. Value is 'Not detected'.")
    else:
        print("   -> Condition NOT MET.")
        print(f"2. Checking is_true('{row['na_mask']}')")
        if is_true(row['na_mask']):
            consensus_val = 'Not available'
            print("   -> Condition MET. Value is 'Not available'.")
        else:
            print("   -> Condition NOT MET.")
            print("3. Checking other fusion columns...")
            detected_fusions = [col for col in fusion_flag_cols if is_true(row[col])]
            
            if detected_fusions:
                print(f"   -> Found these fusions: {detected_fusions}")
                consensus_val = ', '.join(detected_fusions)
            else:
                print("   -> No other fusions found.")
                consensus_val = 'None'

    print("\n--- FINAL RESULT ---")
    print(f"The calculated 'consensusAMLfusion' value is: '{consensus_val}'")
    print("--------------------\n")

if __name__ == "__main__":
    target_sample_id = 'S119'
    debug_single_sample_fusion(target_sample_id)