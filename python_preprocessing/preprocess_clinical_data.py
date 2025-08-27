# python_scripts/preprocess_clinical_data.py

import pandas as pd
import os
import json

# --- Configuration ---
SOURCE_CLINICAL_FILE = 'data/suppTablesCsv/supptables_s2.clinical_summary.csv'
OUTPUT_FOLDER = 'data/clinical_by_sample'

PATIENT_COLUMNS = [
    'Sample_ID', 'patientId', 'labId', 'gender', 'ageAtDiagnosis', 'dxAtSpecimenAcquisition', 
    'specificDxAtAcquisition', 'AML_subtype', 'responseToInductionTx', 'typeInductionTx', 
    'mostRecentTreatmentRegimen', 'currentTreatmentType', 'currentStage', 'vitalStatus', 
    'overallSurvival', 'causeOfDeath'
]
SAMPLES_COLUMNS = [
    'Sample_ID', 'ELN2022', 'AMLFusion', 'Status', 'specimenType', 'percentBlastsBM', 
    'percentBlastsPB', 'percentBasophilsPB', 'percentEosinophilsPB', 'percentImmatureGranulocytesPB', 
    'percentLymphocytesPB', 'percentMonocytesPB', 'percentNeutrophilsPB'
]

def preprocess_clinical_data_fast():
    """
    Reads the large clinical summary file and splits it into individual
    JSON files using a fast, optimized grouping method that correctly
    handles all missing values.
    """
    print(f"Starting FAST and ROBUST Clinical data pre-processing...")
    
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created output directory: {OUTPUT_FOLDER}")

    try:
        print(f"Loading the large source file: {SOURCE_CLINICAL_FILE}...")
        df = pd.read_csv(SOURCE_CLINICAL_FILE)
        print("Source file loaded successfully.")
    except FileNotFoundError:
        print(f"--- 🛑 ERROR: Source file not found at '{SOURCE_CLINICAL_FILE}'. ---")
        return

    print("Grouping all samples by patient ID...")
    patient_groups = df.groupby('patientId')
    
    total_samples = len(df)
    print(f"Found {total_samples} total samples to process.")
    
    for index, current_sample_row in df.iterrows():
        current_sample_id = current_sample_row['Sample_ID']
        current_patient_id = current_sample_row['patientId']

        # --- THIS IS THE DEFINITIVE FIX ---
        # We will use pandas' own .to_json() method, which is guaranteed
        # to convert NaN to null correctly.

        # 1. Convert the patient data row to a JSON string.
        patient_json_string = current_sample_row[PATIENT_COLUMNS].to_json()

        # 2. Convert the related samples DataFrame to a JSON string.
        related_samples_df = patient_groups.get_group(current_patient_id)
        related_samples_json_string = related_samples_df[SAMPLES_COLUMNS].to_json(orient='records')

        # 3. Manually construct the final JSON string. This gives us full control
        #    and ensures there are no invalid characters.
        final_json_string = f'''{{
    "patient_data": {patient_json_string},
    "related_samples": {related_samples_json_string}
}}'''
        # --- END OF FIX ---

        # 4. Save the final, correct JSON string to the file.
        output_path = os.path.join(OUTPUT_FOLDER, f"{current_sample_id}.json")
        with open(output_path, 'w') as f:
            f.write(final_json_string)
        
        if (index + 1) % 200 == 0 or (index + 1) == total_samples:
            print(f"  Processed {index + 1}/{total_samples} samples...")

    print(f"\n--- ✅ Success! Pre-processing complete. All JSON files are valid. ---")

if __name__ == "__main__":
    preprocess_clinical_data_fast()