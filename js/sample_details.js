document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('sample');
    const header = document.getElementById('details-header');
    const backButton = document.getElementById('back-to-dashboard-btn');

    backButton.addEventListener('click', () => { window.history.back(); });

    if (!sampleId) {
        header.textContent = 'Error: No Sample ID provided';
        return;
    }
    
    header.textContent = `Details for Sample: ${sampleId}`;

    const tabConfig = {
        'tab-clinical': {
            path: `data/clinical_by_sample/${sampleId}.json`,
            initFunction: initializeClinicalDataTab,
            dataLoaded: false
        },
        'tab-mutations': {
            path: `data/genomics_by_sample/${sampleId}.json`,
            initFunction: initializeMutationsTab,
            dataLoaded: false
        }
    };

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const contentId = 'content-' + tab.id.split('-')[1];
            document.getElementById(contentId).classList.add('active');
            
            const config = tabConfig[tab.id];
            if (config && !config.dataLoaded && config.path) {
                loadDataForTab(config);
            }
        });
    });

    function loadDataForTab(config) {
        fetch(config.path)
            .then(response => {
                if (!response.ok) throw new Error(`File not found: ${config.path}`);
                return response.json();
            })
            .then(data => {
                config.initFunction(data, sampleId);
                config.dataLoaded = true;
            }).catch(err => {
                console.error("Error loading tab data:", err);
                const tabId = config.initFunction.name.replace('initialize', '').replace('Tab', '').toLowerCase();
                const container = document.querySelector(`#content-${tabId} > div > div`);
                if(container) container.innerHTML = `<p class="text-red-500 text-center">${err.message}</p>`;
            });
    }

    // --- LOGIC FOR CLINICAL DATA TAB ---
    function initializeClinicalDataTab(data) {
        const patientContainer = document.getElementById('patient-table-container');
        const samplesContainer = document.getElementById('samples-table-container');

        const patientData = data.patient_data;
        const allPatientSamples = data.related_samples;

        const patientColumns = Object.keys(patientData);
        const samplesColumns = allPatientSamples.length > 0 ? Object.keys(allPatientSamples[0]) : [];

        const patientTable = createKeyValueTable(patientData, patientColumns);
        patientContainer.innerHTML = '';
        patientContainer.appendChild(patientTable);

        const samplesTable = createTransposedSamplesTable(allPatientSamples, samplesColumns);
        samplesContainer.innerHTML = '';
        samplesContainer.appendChild(samplesTable);
    }

    function initializeMutationsTab(data) {
        const mutations = data.mutations;
        const structuralVariants = data.structural_variants;

        // --- Build Mutations Table ---
        const mutContainer = document.getElementById('mutations-table-container');
        const mutTitle = document.getElementById('mutations-table-title');
        if (mutations && mutations.length > 0) {
            const mutHeaders = ['lab_id', 'capture_type', 't_vaf', 'variant_classification', 'gene', 'symbol', 'biotype'];
            const mutTable = createStandardTable(mutations, mutHeaders);
            mutContainer.innerHTML = '';
            mutContainer.appendChild(mutTable);
            // Set dynamic title
            const uniqueSymbols = new Set(mutations.map(m => m.symbol)).size;
            mutTitle.textContent = `Mutations`;
        } else {
            mutContainer.innerHTML = '<p class="text-gray-600">No mutation data available for this sample.</p>';
        }

        // --- Build Structural Variants Table ---
        const svContainer = document.getElementById('sv-table-container');
        const svTitle = document.getElementById('sv-table-title');
        if (structuralVariants && structuralVariants.length > 0) {
            const svHeaders = ['Sample_ID', 'karyotype', 'otherCytogenetics', 'consensusAMLfusion'];
            const svTable = createStandardTable(structuralVariants, svHeaders);
            svContainer.innerHTML = '';
            svContainer.appendChild(svTable);
            // Set dynamic title
            const validSVs = structuralVariants.filter(sv => sv.consensusAMLfusion !== 'Not detected' && sv.consensusAMLfusion !== 'Not available' && sv.consensusAMLfusion !== 'None');
            if (validSVs.length > 0) {
                svTitle.textContent = `Structural Variants`;
            } else {
                svTitle.textContent = 'Structural Variants';
            }
        } else {
            svContainer.innerHTML = '<p class="text-gray-600">No structural variant data available for this sample.</p>';
        }
    }

    // --- A generic helper to build a standard data table ---
    function createStandardTable(dataRows, headers) {
        const table = document.createElement('table');
        table.className = 'w-full text-sm border-collapse';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Header
        const headerRow = document.createElement('tr');
        headerRow.className = 'bg-gray-100';
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.className = 'text-left p-2 border font-semibold';
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Body
        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            headers.forEach(header => {
                const td = document.createElement('td');
                td.className = 'p-2 border';
                td.textContent = row[header] !== null && row[header] !== undefined ? row[header] : 'N/A';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    // --- HELPER FUNCTIONS FOR TABLES ---
    function createKeyValueTable(dataRow, headers) {
        const table = document.createElement('table');
        table.className = 'w-full text-sm';
        const tbody = document.createElement('tbody');
        headers.forEach(header => {
            const tr = document.createElement('tr');
            tr.className = 'border-b';
            const th = document.createElement('th');
            th.className = 'text-left p-2 bg-gray-50 font-semibold w-1/3';
            th.textContent = header;
            const td = document.createElement('td');
            td.className = 'text-left p-2';
            td.textContent = dataRow[header] !== null && dataRow[header] !== undefined ? dataRow[header] : 'N/A';
            tr.appendChild(th);
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
    }

    function createTransposedSamplesTable(dataRows, headers) {
        const table = document.createElement('table');
        table.className = 'w-full text-sm';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        headerRow.className = 'border-b bg-gray-100';
        let th = document.createElement('th');
        th.className = 'text-left p-2 font-semibold';
        th.textContent = 'Attribute';
        headerRow.appendChild(th);
        dataRows.forEach(sample => {
            th = document.createElement('th');
            th.className = 'text-left p-2 font-semibold';
            th.textContent = sample.Sample_ID;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        headers.forEach(attribute => {
            const tr = document.createElement('tr');
            tr.className = 'border-b';
            let td = document.createElement('td');
            td.className = 'p-2 font-semibold bg-gray-50';
            td.textContent = attribute;
            tr.appendChild(td);
            dataRows.forEach(sample => {
                td = document.createElement('td');
                td.className = 'p-2';
                td.textContent = sample[attribute] !== null && sample[attribute] !== undefined ? sample[attribute] : 'N/A';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    // Auto-load the default active tab
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        activeTab.click();
    }
});