// js/clinical.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---

    // 1. Path to your clinical data CSV file
    const dataPath = '../data/clinical_summary.csv'; // IMPORTANT: Check this path

    // 2. Default columns to display on initial load
    const defaultColumns = ['patient_id', 'age', 'gender', 'disease_status', 'treatment_arm'];

    // 3. Placeholder descriptions for column headers (for the tooltip)
    // You can easily update these descriptions as requested.
    const columnInfo = {
        'patient_id': 'Unique identifier for each patient.',
        'age': 'Age of the patient at the time of diagnosis.',
        'gender': 'Gender of the patient.',
        'disease_status': 'The status of the disease at a specific time point (e.g., Relapsed, Refractory).',
        'treatment_arm': 'The specific treatment protocol the patient was assigned to.',
        'cytogenetic_risk': 'Risk classification based on cytogenetic analysis.',
        'wbc_count': 'White blood cell count at baseline.',
        'blast_percentage': 'Percentage of blast cells in the bone marrow.',
        // Add more descriptions for all other columns here
    };

    // --- APPLICATION LOGIC ---

    const columnSelector = document.getElementById('column-selector');
    const tableContainer = document.getElementById('table-container');
    const tooltip = document.getElementById('tooltip');
    
    let allData = [];
    let allHeaders = [];
    let selectedColumns = [...defaultColumns];

    // Main function to load data and initialize the view
    async function initializeClinicalTab() {
        try {
            const data = await d3.csv(dataPath);
            allData = data;
            // Get all headers from the first data row, excluding any empty ones
            allHeaders = data.columns.filter(h => h); 
            
            // Ensure default columns exist in the data
            selectedColumns = defaultColumns.filter(col => allHeaders.includes(col));

            renderColumnSelector();
            renderTable();
        } catch (error) {
            console.error('Error loading or parsing CSV data:', error);
            tableContainer.innerHTML = `<p style="color: red;">Failed to load data from ${dataPath}. Please check the file path and format.</p>`;
        }
    }

    // Renders the checkboxes for column selection
    function renderColumnSelector() {
        columnSelector.innerHTML = ''; // Clear existing checkboxes
        allHeaders.forEach(header => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = header;
            checkbox.checked = selectedColumns.includes(header);
            
            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) {
                    selectedColumns.push(header);
                } else {
                    selectedColumns = selectedColumns.filter(col => col !== header);
                }
                renderTable(); // Re-render the table with the new column selection
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(header));
            columnSelector.appendChild(label);
        });
    }

    // Renders the data table based on the selected columns
    function renderTable() {
        tableContainer.innerHTML = ''; // Clear previous table
        if (allData.length === 0) return;

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create table header
        const headerRow = document.createElement('tr');
        selectedColumns.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            
            // Add tooltip events
            th.addEventListener('mouseover', (event) => {
                const infoText = columnInfo[headerText] || 'No description available.';
                tooltip.innerHTML = infoText;
                tooltip.style.opacity = 1;
                tooltip.style.left = `${event.pageX + 10}px`;
                tooltip.style.top = `${event.pageY + 10}px`;
            });
            th.addEventListener('mouseout', () => {
                tooltip.style.opacity = 0;
            });
            th.addEventListener('mousemove', (event) => {
                tooltip.style.left = `${event.pageX + 10}px`;
                tooltip.style.top = `${event.pageY + 10}px`;
            });

            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Create table body
        allData.forEach(row => {
            const tr = document.createElement('tr');
            selectedColumns.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || ''; // Handle potential missing data
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }

    // Initialize the tab
    initializeClinicalTab();
});