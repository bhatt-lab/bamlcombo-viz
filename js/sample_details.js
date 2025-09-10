// js/sample_details.js

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
        'tab-drug': {
            path: `data/unified_dss_by_sample/${sampleId}.json`,
            initFunction: initializeDrugResponseTab,
            dataLoaded: false
        },
        'tab-mutations': {
            dataLoaded: true // No data to load
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
                config.initFunction(data);
                config.dataLoaded = true;
            }).catch(err => {
                console.error("Error loading tab data:", err);
                const tabId = config.initFunction.name.replace('initialize', '').replace('Tab', '').toLowerCase();
                const container = document.querySelector(`#content-${tabId} > div > div`);
                if(container) container.innerHTML = `<p class="text-red-500 text-center">${err.message}</p>`;
            });
    }
    
    // --- LOGIC FOR DRUG RESPONSE TAB ---
    function initializeDrugResponseTab(unifiedData) {
        const colorConfig = COLOR_CONFIG;

        const comboData = unifiedData.filter(row => row.Combination.includes('-'));
        const monoData = unifiedData.filter(row => !row.Combination.includes('-'));

        createWaterfallPlot({
            data: unifiedData,
            containerId: 'unified-dss-plot-container',
            title: `All Therapies Sensitivity for Sample ${sampleId}`,
            colorConfig: colorConfig 
        });

        createWaterfallPlot({
            data: comboData,
            containerId: 'combo-dss-plot-container',
            title: `Combination Therapy Sensitivity`,
            colorConfig: colorConfig
        });

        createWaterfallPlot({
            data: monoData,
            containerId: 'mono-dss-plot-container',
            title: `Monotherapy Sensitivity`,
            colorConfig: colorConfig
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

    // --- REUSABLE HELPER FUNCTIONS ---
    function createWaterfallPlot(options) {
        const { data, containerId, title, colorConfig } = options;
        const plotContainer = document.getElementById(containerId);

        if (!data || data.length === 0) {
            plotContainer.innerHTML = `<p class="text-gray-600 text-center">No data available for this view.</p>`;
            return;
        }

        data.sort((a, b) => b.DSS - a.DSS);

        const plotData = { x: [], y: [], hovertext: [], marker: { color: [] } };
        data.forEach(row => {
            const drugName = row.Combination;
            plotData.x.push(row.DSS);
            plotData.y.push(drugName);
            const normalizedName = String(drugName).toLowerCase().replace(/\s/g, '');
            const drugClass = colorConfig.compoundToClass[normalizedName];
            const barColor = colorConfig.classColors[drugClass] || '#cccccc';
            plotData.marker.color.push(barColor);
            plotData.hovertext.push(`<b>Therapy:</b> ${drugName}<br><b>DSS:</b> ${row.DSS.toFixed(3)}<br><b>Class:</b> ${drugClass || 'N/A'}`);
        });

        plotData.x.reverse();
        plotData.y.reverse();
        plotData.marker.color.reverse();
        plotData.hovertext.reverse();

        const layout = {
            title: title,
            xaxis: { title: 'DSS (Drug Sensitivity Score)' },
            yaxis: { type: 'category' },
            margin: { l: 250 }
        };

        Plotly.newPlot(plotContainer, [{ ...plotData, type: 'bar', orientation: 'h', hoverinfo: 'text' }], layout, { responsive: true });
        Plotly.Plots.resize(plotContainer);
    }

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