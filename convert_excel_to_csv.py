# convert_excel_to_csv.py

import pandas as pd
import os
import glob # Import the glob library to find files

# --- ⬇️⬇️⬇️ CONFIGURATION: YOU MUST EDIT THIS LINE ⬇️⬇️⬇️ ---
#
# The path to the FOLDER where you will keep all your source Excel files.
#
# Create a folder named 'excelFiles' in your project's root directory
# and then you can leave this as is.
#
# Example: 'C:/Users/YourUser/Documents/MyProject/excelFiles'
#
input_folder_path = 'data/excelFiles'
#
# --- ⬆️⬆️⬆️ END OF CONFIGURATION ⬆️⬆️⬆️ ---


# This is the 'data' folder in your website project where CSVs will be saved.
output_folder = 'data'


def convert_all_excel_in_folder():
    """
    Scans a folder for .xlsx files and converts every sheet from every file
    into a separate CSV file.
    """
    # --- 1. Validation and Setup ---
    if not os.path.isdir(input_folder_path):
        print(f"--- 🛑 ERROR: Input folder not found! ---")
        print(f"Please create the folder '{input_folder_path}' and place your Excel files inside it.")
        return

    if not os.path.exists(output_folder):
        print(f"Creating output directory: {output_folder}")
        os.makedirs(output_folder)

    # --- 2. Find all Excel files in the input folder ---
    # The pattern '*.xlsx' finds all files ending with .xlsx
    excel_files = glob.glob(os.path.join(input_folder_path, '*.xlsx'))

    if not excel_files:
        print(f"--- ⚠️ Warning: No .xlsx files found in '{input_folder_path}'. ---")
        return

    print(f"Found {len(excel_files)} Excel file(s) to process.")

    # --- 3. Loop through each Excel file found ---
    for excel_path in excel_files:
        excel_filename = os.path.basename(excel_path)
        print(f"\nProcessing file: '{excel_filename}'...")
        
        try:
            xls = pd.ExcelFile(excel_path)
            
            # --- 4. Loop through each sheet in the current Excel file ---
            for sheet_name in xls.sheet_names:
                print(f"  - Converting sheet: '{sheet_name}'")
                
                df = pd.read_excel(xls, sheet_name=sheet_name)
                
                # --- 5. Create a unique, web-friendly filename ---
                # e.g., from "Report 2024.xlsx" and sheet "Clinical Data"
                # becomes "report_2024_clinical_data.csv"
                excel_name_part = os.path.splitext(excel_filename)[0].lower().replace(' ', '_')
                sheet_name_part = sheet_name.lower().replace(' ', '_')
                
                csv_filename = f"{excel_name_part}_{sheet_name_part}.csv"
                csv_file_path = os.path.join(output_folder, csv_filename)
                
                # Save the DataFrame to a CSV file
                df.to_csv(csv_file_path, index=False)
                
                print(f"    -> ✅ Saved to '{csv_file_path}'")

        except Exception as e:
            print(f"    -> ❌ FAILED to process file '{excel_filename}'. Error: {e}")

    print("\nConversion complete!")


if __name__ == "__main__":
    convert_all_excel_in_folder()