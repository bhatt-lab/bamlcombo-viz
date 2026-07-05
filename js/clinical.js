// js/clinical.js

// The main function now accepts data as a parameter.
// It is no longer async and does not load its own data.
function initializeClinicalTab(data) {
    // --- CONFIGURATION ---
    function sortSelectedColumns() {
        selectedColumns = allHeaders.filter(h => selectedColumns.includes(h));
    }

    
    const defaultColumns = [
        'Sample_ID', 
        'labId', 
        'patientId',
        'Data available', 
        'gender', 
        'ageAtDiagnosis', 
        'dxAtSpecimenAcquisition', 
        'specificDxAtAcquisition', 
        'AML_subtype', 
        'ELN2022', 
        'AMLFusion', 
        'Status', 
        'specimenType', 
        'responseToInductionTx', 
        'typeInductionTx', 
        'mostRecentTreatmentRegimen', 
        'currentTreatmentType', 
        'currentStage', 
        'vitalStatus', 
        'overallSurvival', 
        'causeOfDeath'
        // 'percentBlastsBM', 
        // 'percentBlastsPB', 
        // 'percentBasophilsPB', 
        // 'percentEosinophilsPB', 
        // 'percentImmatureGranulocytesPB', 
        // 'percentLymphocytesPB', 
        // 'percentMonocytesPB', 
        // 'percentNeutrophilsPB',
        // 'timeOfSampleCollectionRelativeToInclusion'
    ];

    const columnInfo = {
        'sampleid': 'Unique identifier for each specimen, for internal reference',
        'Sample_ID': 'Unique identifier for each specimen, for internal reference',
        'patientId': 'Unique identifier for each patient',
        'labId': 'Unique identifier for each specimen',
        'dbgap_subject_id': 'Unique dbGaP identifier for each patient',
        'dbgap_dnaseq_sample': 'Unique dbGaP identifier for the dna sequencing of the specimen',
        'dbgap_rnaseq_sample': 'Unique dbGaP identifier for the rna sequencing of the specimen',
        'Data available': 'Multiomics data available',
        'gender': 'Sex description for each patient obtained from the EMR',
        'ageAtDiagnosis': 'Difference in years between diagnosis date (of the heme malignancy at the time of specimen collection) and patient\'s date of birth',
        'priorMalignancyNonMyeloid': 'Did patient have a prior non-myeloid malignancy?',
        'priorMalignancyType': 'Type of prior non-myeloid malignancy',
        'cumulativeChemo': 'Has patient received chemotherapy during the course of their treatment for the current heme malignancy?',
        'priorMalignancyRadiationTx': 'Has patient received radiation treatment for a prior non-heme malignancy?',
        'priorMDS': 'Was patient ever diagnosed with MDS?',
        'priorMDSMoreThanTwoMths': 'Was the date difference between the earliest MDS diagnosis and AML diagnosis greater than 2 months?',
        'priorMDSMPN': 'Was the patient ever diagnosed with MDS/MPN?',
        'priorMDSMPNMoreThanTwoMths': 'Was the date difference between the earliest MDS/MPN diagnosis and AML diagnosis greater than 2 months?',
        'priorMPN': 'Was the patient ever diagnosed with MPN?',
        'priorMPNMoreThanTwoMths': 'Was the date difference between the earliest MPN diagnosis and AML diagnosis greater than 2 months?',
        'dxAtSpecimenAcquisition': '2022 World Health Organization diagnosis category at the time of the specimen acquisition',
        'specificDxAtAcquisition': '2022 World Health Organization diagnosis subtype at the time of the specimen acquisition',
        'secondarySpecificDxAtAcquisition': '2022 World Health Organization diagnosis subtype at the time of the specimen acquisition',
        'dxAtInclusion': 'Diagnosis at the time of earliest specimen inclusion by collection date',
        'specificDxAtInclusion': 'Specific diagnosis at the time of earliest specimen inclusion by collection date',
        'fabBlastMorphology': 'French-American-British (FAB) morphological classification',
        'AML_subtype': 'Annotated based on specificDxAtAcquisition, secondarySpecificDxAtAcquisition and fabBlastMorphology',
        'ELN2022': 'Risk classification assigned to the specimen based on the European Leukemia Network 2022 guidelines.',
        'AMLFusion': 'Manual review of clinical cytogenetic testing and previous annotations (specificDxAtAcquisition, consensusAMLFusion) for common AML cytogenetic fusions',
        'karyotype': 'Karyotype pulled from the cytogenetic report in the EMR',
        'otherCytogenetics': 'FISH results pulled from the cytogenetic report in the EMR',
        'mutationsSummary': 'Concatenated list of CLIA gene variants and variant allele frequencies',
        'FLT3_ITDCall': 'Consensus result from internally run PCR assay and capillary electrophoresis and/or CLIA lab assay and/or whole-exome sequencing.',
        'NPM1Call': 'Consensus result from internally run PCR assay and capillary electrophoresis and/or CLIA lab assay and/or whole-exome sequencing.',
        'CEBPA_Biallelic': 'Was the CEBPA variant biallelic?',
        'ageAtSpecimenAcquisition': 'Difference in years between the specimen collection date and the date of birth of the patient',
        'timeOfSampleCollectionRelativeToInclusion': 'Difference in days between the earliest specimen collection date and the date of this sample collection',
        'replicate': 'Identifier for serial specimens from the same patients',
        'diseaseStageAtSpecimenCollection': 'Brief description of the patient\'s disease stage at the time point of this specimen collection',
        'Status': '',
        'specimenGroups': 'Concatenated list of Specimen Groups referring to disease stage at the time point of this specimen collection',
        'specimenType': 'Type of specimen',
        'priorTreatmentTypeCount': 'Number of treatments that the patient has received as of the last date the patient was updated in the database. This field is not relative to the patient\'s sample collection date.',
        'priorTreatmentTypes': 'Concatenated list of treatment types that the patient has received as of the last time the clinical annotations were updated in the database. This field is not relative to the patient’s sample collection date.',
        'priorTreatmentRegimenCount': 'Number of treatment regimens that the patient received as of the last time the clinical annotations were updated in the database. This field is not relative to the patient’s sample collection date.',
        'priorTreatmentStageCount': 'The number of treatment stages that the patient has been in as of the last time the clinical annotations were updated in the database. This field is not relative to the patient’s sample collection date.',
        'priorTreatmentStages': 'Concatenated list of treatment stages that the patient has been in as of the last time the clinical annotations were updated in the database. This field is not relative to the patient’s sample collection date.',
        'responseToInductionTx': 'Treatment response corresponding to the first treatment record found with a stage of induction',
        'typeInductionTx': 'Treatment type corresponding to the first treatment record found with a stage of induction',
        'responseDurationToInductionTx': 'Days between start and end dates of the first treatment record found with a stage of induction',
        'cumulativeTreatmentRegimens': 'Concatenated list of treatment regimens that the patient has received as of the last time the clinical annotations were updated in the database. This field is not relative to the patient’s sample collection date.',
        'mostRecentTreatmentRegimen': 'Regimen of the most current treatment (in regard to the last time in the EMR) determined by start date',
        'currentTreatmentType': 'Treatment type of the most recent treatment determined by start date',
        'currentStage': 'Stage of the most current treatment determined by start date',
        'currentTreatmentDuration': 'Days between start and end dates of the most current treatment determined by start date',
        'vitalStatus': 'Patient vital status at the date of most recent follow-up',
        'overallSurvival': 'Number of days between diagnosis date (of the heme malignancy at the time of specimen collection) and last followup date found when determining vitalStatus',
        'causeOfDeath': 'Assessment of cause of death if vitalStatus is "Dead"',
        'percentBlastsBM': '% Blasts in the bone marrow',
        'percentBlastsPB': '% Blasts in the peripheral blood',
        'percentAbnormalPlasmaBM': '% Abnormal plasma cells in the bone marrow',
        'percentBandsPB': '% Bands in the peripheral blood',
        'percentBasophilsPB': '% Basophils in the peripheral blood',
        'percentEosinophilsPB': '% Eosinophils in the peripheral blood',
        'percentImmatureGranulocytesPB': '% Immature granulocytes in the peripheral blood',
        'percentLymphocytesPB': '% Lymphocytes in the peripheral blood',
        'percentMetamyelocytesPB': '% Metamyelocytes in the peripheral blood',
        'percentMonocytesPB': '% Monocytes in the peripheral blood',
        'percentMyelocytesPB': '% Myelocytes in the peripheral blood',
        'percentNeutrophilsPB': '% Neutrophils in the peripheral blood',
        'percentNucleatedRBCsPB': '% Nucleated RBCs in the peripheral blood ',
        'percentPromonocytes': '% Promonocytes in the peripheral blood',
        'percentPromyelocytes': '% Promyelocytes in the peripheral blood',
        'percentPromyelocytesPB': '% Promyelocytes in the peripheral blood',
        'percentReactiveLymphocytesPB': '% Reactive lymphocytes in the peripheral blood',
        'percentWBC': '% White blood cells in the peripheral blood',
        'wbcCount': 'White blood cell count expressed in international units (x10^9 cells/litre)',
        'plateletCount': 'Number of platelets (per litre)',
        'albumin': 'Albumin levels in the peripheral blood (g/dL)',
        'bCellGeneRearrangement': 'Immunoglobulin Gene Rearrangement in bone marrow',
        'bilirubin': 'Total bilirubin in the peripheral blood (mg/dL)',
        'creatinine': 'Creatinine levels in the peripheral blood (mg/dL)',
        'hemoglobin': 'Hemoglobin levels (%)',
        'tCellReceptorGene': 'Clinical gene mutation testing result',
        'ALT': 'Alanine aminotransferase levels in the peripheral blood (units/litre)',
        'AST': 'Aspartate aminotransferase levels in the peripheral blood (units/litre)',
        'LDH': 'Lactic acid dehydrogenase (LDH) levels (Units/Litre)',
        'MCV': 'Mean corpuscular volume (fL)',
        'surfaceAntigensImmunohistochemicalStains': 'Positive surface antigens, as determined by clinical flow'
    };

    // Plain-English display labels for the raw column names. The underlying
    // column name (used for data lookup, selection and tooltips) is unchanged;
    // only what the user sees is reworded. Unknown columns fall back to an
    // auto-prettified version of the raw name.
    const columnLabels = {
        'sampleid': 'Sample ID',
        'Sample_ID': 'Sample ID',
        'patientId': 'Patient ID',
        'labId': 'Lab ID',
        'dbgap_subject_id': 'dbGaP Subject ID',
        'dbgap_dnaseq_sample': 'dbGaP DNA-seq Sample',
        'dbgap_rnaseq_sample': 'dbGaP RNA-seq Sample',
        'Data available': 'Data Available',
        'gender': 'Gender',
        'ageAtDiagnosis': 'Age at Diagnosis',
        'priorMalignancyNonMyeloid': 'Prior Non-Myeloid Malignancy',
        'priorMalignancyType': 'Prior Malignancy Type',
        'cumulativeChemo': 'Received Chemotherapy',
        'priorMalignancyRadiationTx': 'Prior Malignancy Radiation Therapy',
        'priorMDS': 'Prior MDS',
        'priorMDSMoreThanTwoMths': 'Prior MDS >2 Months Before AML',
        'priorMDSMPN': 'Prior MDS/MPN',
        'priorMDSMPNMoreThanTwoMths': 'Prior MDS/MPN >2 Months Before AML',
        'priorMPN': 'Prior MPN',
        'priorMPNMoreThanTwoMths': 'Prior MPN >2 Months Before AML',
        'dxAtSpecimenAcquisition': 'Diagnosis at Specimen Acquisition',
        'specificDxAtAcquisition': 'Specific Diagnosis at Acquisition',
        'secondarySpecificDxAtAcquisition': 'Secondary Specific Diagnosis at Acquisition',
        'dxAtInclusion': 'Diagnosis at Inclusion',
        'specificDxAtInclusion': 'Specific Diagnosis at Inclusion',
        'fabBlastMorphology': 'FAB Blast Morphology',
        'fabBlastMorphology_old': 'FAB Blast Morphology (legacy)',
        'AML_subtype': 'AML Subtype',
        'ELN2022': 'ELN 2022 Risk',
        'AMLFusion': 'AML Fusion',
        'karyotype': 'Karyotype',
        'otherCytogenetics': 'Other Cytogenetics',
        'mutationsSummary': 'Mutations Summary',
        'FLT3_ITDCall': 'FLT3-ITD Call',
        'NPM1Call': 'NPM1 Call',
        'CEBPA_Biallelic': 'CEBPA Biallelic',
        'ageAtSpecimenAcquisition': 'Age at Specimen Acquisition',
        'timeOfSampleCollectionRelativeToInclusion': 'Time of Sample Collection Relative to Inclusion (days)',
        'replicate': 'Replicate',
        'diseaseStageAtSpecimenCollection': 'Disease Stage at Specimen Collection',
        'Status': 'Status',
        'specimenGroups': 'Specimen Groups',
        'specimenType': 'Specimen Type',
        'priorTreatmentTypeCount': 'Prior Treatment Type Count',
        'priorTreatmentTypes': 'Prior Treatment Types',
        'priorTreatmentRegimenCount': 'Prior Treatment Regimen Count',
        'priorTreatmentStageCount': 'Prior Treatment Stage Count',
        'priorTreatmentStages': 'Prior Treatment Stages',
        'responseToInductionTx': 'Response to Induction Therapy',
        'typeInductionTx': 'Induction Therapy Type',
        'responseDurationToInductionTx': 'Response Duration to Induction Therapy (days)',
        'cumulativeTreatmentRegimens': 'Cumulative Treatment Regimens',
        'mostRecentTreatmentRegimen': 'Most Recent Treatment Regimen',
        'currentTreatmentType': 'Current Treatment Type',
        'currentStage': 'Current Stage',
        'currentTreatmentDuration': 'Current Treatment Duration (days)',
        'vitalStatus': 'Vital Status',
        'overallSurvival': 'Overall Survival (days)',
        'causeOfDeath': 'Cause of Death',
        'percentBlastsBM': '% Blasts (Bone Marrow)',
        'percentBlastsPB': '% Blasts (Peripheral Blood)',
        'percentAbnormalPlasmaBM': '% Abnormal Plasma Cells (Bone Marrow)',
        'percentBandsPB': '% Bands (Peripheral Blood)',
        'percentBasophilsPB': '% Basophils (Peripheral Blood)',
        'percentEosinophilsPB': '% Eosinophils (Peripheral Blood)',
        'percentImmatureGranulocytesPB': '% Immature Granulocytes (Peripheral Blood)',
        'percentLymphocytesPB': '% Lymphocytes (Peripheral Blood)',
        'percentMetamyelocytesPB': '% Metamyelocytes (Peripheral Blood)',
        'percentMonocytesPB': '% Monocytes (Peripheral Blood)',
        'percentMyelocytesPB': '% Myelocytes (Peripheral Blood)',
        'percentNeutrophilsPB': '% Neutrophils (Peripheral Blood)',
        'percentNucleatedRBCsPB': '% Nucleated RBCs (Peripheral Blood)',
        'percentPromonocytes': '% Promonocytes',
        'percentPromyelocytes': '% Promyelocytes',
        'percentPromyelocytesPB': '% Promyelocytes (Peripheral Blood)',
        'percentReactiveLymphocytesPB': '% Reactive Lymphocytes (Peripheral Blood)',
        'percentWBC': '% White Blood Cells (Peripheral Blood)',
        'wbcCount': 'WBC Count (x10⁹/L)',
        'plateletCount': 'Platelet Count (per L)',
        'albumin': 'Albumin (g/dL)',
        'bCellGeneRearrangement': 'B-Cell Gene Rearrangement',
        'bilirubin': 'Total Bilirubin (mg/dL)',
        'creatinine': 'Creatinine (mg/dL)',
        'hemoglobin': 'Hemoglobin (%)',
        'tCellReceptorGene': 'T-Cell Receptor Gene',
        'ALT': 'ALT (U/L)',
        'AST': 'AST (U/L)',
        'LDH': 'LDH (U/L)',
        'MCV': 'MCV (fL)',
        'surfaceAntigensImmunohistochemicalStains': 'Surface Antigens (IHC Stains)'
    };

    const getColumnLabel = (header) => {
        if (columnLabels[header]) return columnLabels[header];
        // Fallback: split camelCase / snake_case and title-case the result.
        return String(header)
            .replace(/_/g, ' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    // --- APPLICATION LOGIC ---
    const customDropdownWrapper = document.getElementById('column-select-custom-dropdown');
    const selectedColumnsDisplay = document.getElementById('selected-columns-display');
    const checkboxListContainer = document.getElementById('checkbox-list-container');
    const searchInput = document.getElementById('column-search-input');
    const checkboxesWrapper = document.getElementById('checkboxes-wrapper');
    
    const tableContainer = document.getElementById('table-container');
    const tooltip = document.getElementById('tooltip');
    
    let allData = [];
    let allHeaders = [];
    let selectedColumns = [...defaultColumns];
    let isDropdownOpen = false;
    let clickOutsideListener = null;

    // --- INITIALIZATION LOGIC (now inside the function) ---
    try {
        allData = data;
        allHeaders = allData.length > 0 ? Object.keys(allData[0]) : [];
        allHeaders = allHeaders.filter(h => h); // Ensure no empty headers
        
        // This line now uses your new, longer list of default columns.
        selectedColumns = defaultColumns.filter(col => allHeaders.includes(col));
        sortSelectedColumns();

        if (selectedColumns.length === 0 && allHeaders.length > 0) {
            // Fallback if none of the default columns are found in the CSV
            selectedColumns = allHeaders.slice(0, Math.min(5, allHeaders.length)); 
        } else if (allHeaders.length === 0) {
            console.warn("No columns found in the provided data.");
            tableContainer.innerHTML = `<p style="color: orange;">No data or columns found.</p>`;
            return; 
        }

        renderAllColumnCheckboxes();
        updateSelectedItemsDisplay(); 
        renderTable();

        if (selectedColumnsDisplay && selectedColumnsDisplay.dataset.bound !== "1") {
            selectedColumnsDisplay.dataset.bound = "1";
            selectedColumnsDisplay.addEventListener('click', toggleDropdown);
            searchInput.addEventListener('input', filterCheckboxes);
        }


    } catch (error) {
        console.error('Error initializing clinical tab with data:', error);
        tableContainer.innerHTML = `<p style="color: red;">Failed to process the provided data.</p>`;
    }

    // Bind tooltip handlers once on a stable parent (works across re-renders)
    if (tableContainer && tableContainer.dataset.tooltipBound !== "1") {
        tableContainer.addEventListener('mouseover', (e) => {
            const span = e.target.closest('.header-label');
            if (span) showTooltip({ target: span });
        });

        tableContainer.addEventListener('mouseout', (e) => {
            const span = e.target.closest('.header-label');
            if (span) hideTooltip();
        });

        tableContainer.dataset.tooltipBound = "1";
    }


    // --- All other functions remain the same ---

    function renderAllColumnCheckboxes() {
        checkboxesWrapper.innerHTML = '';
        allHeaders.forEach(header => {
            const label = document.createElement('label');
            label.classList.add('column-checkbox-label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = header;
            checkbox.checked = selectedColumns.includes(header);
            
            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) {
                    if (!selectedColumns.includes(header)) {
                    selectedColumns.push(header);
                    }
                } else {
                    selectedColumns = selectedColumns.filter(col => col !== header);
                }

                sortSelectedColumns();     // ⭐ enforce column order
                updateSelectedItemsDisplay();
                renderTable();
            });


            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(getColumnLabel(header)));
            checkboxesWrapper.appendChild(label);
        });
    }

    function filterCheckboxes() {
        const searchTerm = searchInput.value.toLowerCase();
        const labels = checkboxesWrapper.querySelectorAll('.column-checkbox-label');
        labels.forEach(label => {
            const headerText = label.textContent.toLowerCase();
            if (headerText.includes(searchTerm)) {
                label.style.display = 'flex';
            } else {
                label.style.display = 'none';
            }
        });
    }

    function updateSelectedItemsDisplay() {
        if (selectedColumns.length === allHeaders.length) {
            selectedColumnsDisplay.textContent = 'All Columns Selected';
        } else if (selectedColumns.length === 0) {
            selectedColumnsDisplay.innerHTML = '<span class="placeholder-text">Click to select...</span>';
        } else {
            selectedColumnsDisplay.textContent = selectedColumns.map(getColumnLabel).join(', ');
        }
    }

    function openDropdown() {
        isDropdownOpen = true;
        checkboxListContainer.classList.add('active');
        selectedColumnsDisplay.classList.add('active');
        searchInput.focus();
        filterCheckboxes();
        clickOutsideListener = (event) => {
            if (!customDropdownWrapper.contains(event.target) && event.target !== selectedColumnsDisplay) {
                closeDropdown();
            }
        };
        document.addEventListener('click', clickOutsideListener);
    }

    function closeDropdown() {
        isDropdownOpen = false;
        checkboxListContainer.classList.remove('active');
        selectedColumnsDisplay.classList.remove('active');
        searchInput.value = '';
        filterCheckboxes();
        if (clickOutsideListener) {
            document.removeEventListener('click', clickOutsideListener);
            clickOutsideListener = null;
        }
    }

    function toggleDropdown() {
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function showTooltip(event) {
        const tooltipEl = document.getElementById('tooltip');
        if (!tooltipEl) return;

        const span = event.target;
        const headerText = span.dataset.col || span.textContent;
        const desc = columnInfo[headerText] || columnInfo[headerText.toLowerCase()] || 'No description available';

        tooltipEl.innerHTML = desc;
        tooltipEl.style.display = 'block'; // Make it visible to get its dimensions

        const spanRect = span.getBoundingClientRect();
        
        // Position tooltip to the right of the text, vertically centered
        // const top = spanRect.top + (spanRect.height / 2) - (tooltipEl.offsetHeight / 2);
        // const left = spanRect.right + 8; // 8px gap

        let left = spanRect.left + (spanRect.width / 2) - (tooltipEl.offsetWidth / 2);
        let top = spanRect.top - tooltipEl.offsetHeight - 8;
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipEl.offsetWidth - 8));

        tooltipEl.style.left = `${left + window.scrollX}px`;
        tooltipEl.style.top = `${top + window.scrollY}px`;
        tooltipEl.style.opacity = '1';
    }

    function hideTooltip() {
        const tooltipEl = document.getElementById('tooltip');
        if (tooltipEl) {
            tooltipEl.style.display = 'none';
            tooltipEl.style.opacity = '0';
        }
    }

    function renderTable() {
        tableContainer.innerHTML = '';
        if (allData.length === 0 || selectedColumns.length === 0) {
            tableContainer.innerHTML = `<p>No data to display or no columns selected.</p>`;
            return;
        }
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        selectedColumns.forEach(headerText => {
            const th = document.createElement('th');
            
            // Create a span to wrap the text. This is our hover target.
            // Display the plain-English label but keep the raw column name in
            // a data attribute so tooltip lookups still resolve.
            const span = document.createElement('span');
            span.className = 'header-label';
            span.dataset.col = headerText;
            span.textContent = getColumnLabel(headerText);
                        
            th.appendChild(span);
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        allData.forEach(row => {
            const tr = document.createElement('tr');
            selectedColumns.forEach(header => {
                const td = document.createElement('td');
                const cellValue = row[header] || '';

                // If the current column is 'Sample_ID', create a link.
                if (header === 'Sample_ID' && cellValue) {
                    const link = document.createElement('a');
                    // The link points to a new page, passing the sample ID as a URL parameter.
                    link.href = `sample_details.html?sample=${encodeURIComponent(cellValue)}`;
                    link.textContent = cellValue;
                    link.classList.add('text-blue-600', 'hover:underline'); // Tailwind classes for link styling
                    
                    link.addEventListener('click', () => {
                        sessionStorage.setItem('return_hash', location.hash || '#clinical');
                        sessionStorage.setItem('return_scrollY', String(window.scrollY));
                    });

                    td.appendChild(link);
                } else {
                    // For all other columns, just display the text as before.
                    td.textContent = cellValue;
                }

                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }

    // ✅ restore scroll position when coming back from sample_details
    const returnHash = sessionStorage.getItem('return_hash');
    const returnScrollY = sessionStorage.getItem('return_scrollY');

    if (returnHash) location.hash = returnHash;

    if (returnScrollY) {
    requestAnimationFrame(() => {
        window.scrollTo({ top: Number(returnScrollY), behavior: 'instant' });
        sessionStorage.removeItem('return_hash');
        sessionStorage.removeItem('return_scrollY');
    });
    }

}