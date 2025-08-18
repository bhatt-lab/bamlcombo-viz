// js/clinical.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const dataPath = '../data/clinical_summary.csv';
    const defaultColumns = ['patient_id', 'age', 'gender', 'disease_status', 'treatment_arm'];
    const columnInfo = {
        'patient_id': 'Unique identifier for each patient.',
        'age': 'Age of the patient at the time of diagnosis.',
        'gender': 'Gender of the patient.',
        'disease_status': 'The status of the disease at a specific time point (e.g., Relapsed, Refractory).',
        'treatment_arm': 'The specific treatment protocol the patient was assigned to.',
        'cytogenetic_risk': 'Risk classification based on cytogenetic analysis.',
        'wbc_count': 'White blood cell count at baseline.',
        'blast_percentage': 'Percentage of blast cells in the bone marrow.',
        // Add more descriptions for all your columns here
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

    // NEW: Variable to hold the reference to the click-outside listener
    let clickOutsideListener = null;

    async function initializeClinicalTab() {
        try {
            const data = await d3.csv(dataPath);
            allData = data;
            allHeaders = data.columns.filter(h => h); 
            
            selectedColumns = defaultColumns.filter(col => allHeaders.includes(col));

            if (selectedColumns.length === 0 && allHeaders.length > 0) {
                selectedColumns = allHeaders.slice(0, Math.min(5, allHeaders.length)); 
            } else if (selectedColumns.length === 0 && allHeaders.length === 0) {
                console.warn("No columns found in CSV data.");
                tableContainer.innerHTML = `<p style="color: orange;">No data or columns found in the CSV file.</p>`;
                return; 
            }

            renderAllColumnCheckboxes();
            updateSelectedItemsDisplay(); 
            renderTable();

            // Add event listeners for the custom dropdown
            selectedColumnsDisplay.addEventListener('click', toggleDropdown);
            searchInput.addEventListener('input', filterCheckboxes);

            // The document.addEventListener('click') is now managed by openDropdown/closeDropdown.

        } catch (error) {
            console.error('Error loading or parsing CSV data:', error);
            tableContainer.innerHTML = `<p style="color: red;">Failed to load data from ${dataPath}. Please check the file path and format.</p>`;
        }
    }

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
                    selectedColumns.push(header);
                } else {
                    selectedColumns = selectedColumns.filter(col => col !== header);
                }
                updateSelectedItemsDisplay(); 
                renderTable(); 
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(header));
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
            selectedColumnsDisplay.textContent = selectedColumns.join(', ');
        }
    }

    // NEW: Function to open the dropdown
    function openDropdown() {
        isDropdownOpen = true;
        checkboxListContainer.classList.add('active');
        selectedColumnsDisplay.classList.add('active');
        searchInput.focus();
        filterCheckboxes();

        // Add the click-outside listener ONLY when the dropdown is open
        clickOutsideListener = (event) => {
            // Check if the click target is outside the dropdown wrapper
            // AND not the display area itself (to prevent immediate re-closing on open click)
            if (!customDropdownWrapper.contains(event.target) && event.target !== selectedColumnsDisplay) {
                closeDropdown();
            }
        };
        document.addEventListener('click', clickOutsideListener);
    }

    // NEW: Function to close the dropdown
    function closeDropdown() {
        isDropdownOpen = false;
        checkboxListContainer.classList.remove('active');
        selectedColumnsDisplay.classList.remove('active');
        searchInput.value = ''; // Clear search input when closing
        filterCheckboxes(); // Reset filter to show all when closed

        // Remove the click-outside listener when the dropdown is closed
        if (clickOutsideListener) {
            document.removeEventListener('click', clickOutsideListener);
            clickOutsideListener = null;
        }
    }

    // NEW: Toggle function that uses openDropdown/closeDropdown
    function toggleDropdown() {
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    // Renders the data table based on the selected columns (largely unchanged)
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
            th.textContent = headerText;
            
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

        allData.forEach(row => {
            const tr = document.createElement('tr');
            selectedColumns.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || ''; 
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }

    initializeClinicalTab();
});