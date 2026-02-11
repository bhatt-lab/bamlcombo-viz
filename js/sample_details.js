document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('sample');
    const header = document.getElementById('details-header');
    const backButton = document.getElementById('back-to-dashboard-btn');

    backButton.addEventListener('click', () => {
        const hash = sessionStorage.getItem('return_hash') || '#clinical';
        window.location.href = `index.html${hash}`;
    });

    if (!sampleId) {
        header.textContent = 'Error: No Sample ID provided';
        return;
    }
    
    header.style.color = "#fff";
    header.textContent = `Details for Sample: ${sampleId}`;

    const tabConfig = {
        'tab-clinical': {
            key: 'clinical', 
            path: `data/clinical_by_sample/${sampleId}.json`,
            initFunction: initializeClinicalDataTab,
            dataLoaded: false
        },
        'tab-mutations': {
            key: 'mutations', 
            path: `data/genomics_by_sample/${sampleId}.json`,
            initFunction: initializeMutationsTab,
            dataLoaded: false
        },
        'tab-sampledrug': {
            key: 'sampledrug',
            path: `data/unified_dss_by_sample/${sampleId}.json`,
            initFunction: initializeSampleDrugResponseTab,
            dataLoaded: false
        }
    };

    // Reverse lookup: hashKey -> tabId
    const keyToTabId = Object.fromEntries(
        Object.entries(tabConfig).map(([tabId, cfg]) => [cfg.key, tabId])
    );

    function handleTabActivation(key) {
        const tabId = keyToTabId[key];
        if (!tabId) return;

        const config = tabConfig[tabId];
        if (config && !config.dataLoaded && config.path) {
            loadDataForTab(config);
        }
    }

    const tabManager = window.DashboardUI?.createTabManager({
        defaultTab: 'clinical',
        onActivate: handleTabActivation
    });

    if (tabManager) {
        tabManager.activate(tabManager.current());
    } else {
        document.getElementById('tab-clinical')?.classList.add('active');
        document.getElementById('content-clinical')?.classList.add('active');
        handleTabActivation('clinical');
    }

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
                const container = document.querySelector(`#content-${config.key}`);
                if(container) container.innerHTML = `<p class="text-red-500 text-center">${err.message}</p>`;
            });
    }
    
    // --- LOGIC FOR DRUG RESPONSE TAB ---
    function initializeSampleDrugResponseTab(unifiedData) {
        const colorConfig = COLOR_CONFIG;

        const comboData = unifiedData.filter(row => row.Combination.includes('-'));
        const monoData = unifiedData.filter(row => !row.Combination.includes('-'));

        createWaterfallPlot({
            data: unifiedData,
            containerId: 'unified-dss-plot-container',
            title: `All Therapies Sensitivity for Sample ${sampleId}`,
            colorConfig: colorConfig 
        }, 'v');

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
        const patientColumns = Object.keys(patientData);
        createKeyValueTable(patientData, patientColumns); //patient container

        const allPatientSamples = data.related_samples;
        const samplesColumns = allPatientSamples.length > 0 ? Object.keys(allPatientSamples[0]) : [];
        createTransposedSamplesTable(allPatientSamples, samplesColumns); //samples container

        // --- HELPER FUNCTIONS FOR TABLES ---
        function createKeyValueTable(dataRow, headers) {
            patientContainer.innerHTML = '';
            const table = document.createElement('table');
            const tbody = document.createElement('tbody');
            headers.forEach(header => {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.className = 'text-left p-2 font-semibold w-1/4 key-cell';
                th.textContent = header;
                const td = document.createElement('td');
                td.className = 'text-left p-2';
                td.textContent = dataRow[header] !== null && dataRow[header] !== undefined ? dataRow[header] : 'N/A';
                tr.appendChild(th);
                tr.appendChild(td);
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            patientContainer.appendChild(table);
        }

        function createTransposedSamplesTable(dataRows, headers) {
            samplesContainer.innerHTML = '';
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            // Header row
            const headerRow = document.createElement('tr');
            const th = document.createElement('th');
            th.className = 'text-left p-2 font-semibold w-1/4';
            th.textContent = 'Attribute';
            headerRow.appendChild(th);

            dataRows.forEach(sample => {
                const th = document.createElement('th');
                th.className = 'text-left p-2 font-semibold';
                th.textContent = sample.Sample_ID;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Body rows
            headers.forEach(attribute => {
                const tr = document.createElement('tr');
                const tdLabel = document.createElement('td');
                tdLabel.className = 'p-2 font-semibold key-cell';
                tdLabel.textContent = attribute;
                tr.appendChild(tdLabel);

                dataRows.forEach(sample => {
                    const td = document.createElement('td');
                    td.className = 'p-2';
                    td.textContent = sample[attribute] ?? 'N/A';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            samplesContainer.appendChild(table);
        }

    }

    function createWaterfallPlot(options, orientation = 'h') {
        const { data, containerId, title, colorConfig } = options;
        const plotContainer = document.getElementById(containerId);

        if (!data || data.length === 0) {
            plotContainer.innerHTML = `<p class="text-gray-600 text-center">No data available for this view.</p>`;
            return;
        }

        plotContainer.innerHTML = '';

        // Don't mutate original data (optional but recommended)
        const sorted = [...data].sort((a, b) => b.DSS - a.DSS);

        const plotData = { x: [], y: [], hovertext: [], marker: { color: [] } };

        sorted.forEach(row => {
            const drugName = row.Combination;
            const dss = Number(row.DSS);

            const normalizedName = String(drugName).toLowerCase().replace(/\s/g, '');
            const drugClass = colorConfig.compoundToClass[normalizedName];
            const barColor = colorConfig.classColors[drugClass] || '#cccccc';

            // 👇 Assign x/y depending on orientation
            if (orientation === 'h') {
                plotData.x.push(dss);
                plotData.y.push(drugName);
            } else {
                plotData.x.push(drugName);
                plotData.y.push(dss);
            }

            plotData.marker.color.push(barColor);
            plotData.hovertext.push(
                `<b>Therapy:</b> ${drugName}<br><b>DSS:</b> ${dss.toFixed(3)}<br><b>Class:</b> ${drugClass || 'N/A'}`
            );
        });

        // Reverse so best is at top (for horizontal) or left (for vertical)
        if (orientation === 'h') {
            plotData.x.reverse();
            plotData.y.reverse();
            plotData.marker.color.reverse();
            plotData.hovertext.reverse();
        }

        // Axis configs depend on orientation
        const xaxis =
            orientation === 'h'
            ? { title: { text: 'DSS (Drug Sensitivity Score)', standoff: 5 }, range: [0, 50], automargin: true, side: 'top' }
            : { type: 'category', automargin: true, tickangle: -45 };

        const yaxis =
            orientation === 'h'
            ? { type: 'category', automargin: true }
            : { title: { text: 'DSS (Drug Sensitivity Score)', standoff: 5 }, range: [0, 50], automargin: true, side: 'top' };

        // Height logic: horizontal needs more height with many bars
        const height =
            orientation === 'h'
            ? Math.max(420, sorted.length * 22 + 180) // barHeight = 22; baseHeight = 180;
            : 520;

        const layout = {
            autosize: true,
            font: { family: 'Inter, sans-serif', size: 11, color: '#2c3e50' },
            title: { text: title },
            xaxis,
            yaxis,
            margin: orientation === 'h'
            ? { t: 100, b: 40, l: 220, r: 40 }   // more left space for long drug labels
            : { t: 60, b: 140, l: 60, r: 40 },  // more bottom space for rotated labels
            height
        };

        Plotly.newPlot(
            plotContainer,
            [{
            ...plotData,
            type: 'bar',
            orientation,
            hoverinfo: 'text',
            width: orientation === 'h' ? 0.7 : 0.6,
            textfont: { size: 12, color: '#2c3e50', family: 'Inter, sans-serif' }
            }],
            layout,
            { responsive: true, displayModeBar: false }
        );
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
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Header
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.className = 'p-2';
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Body
        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            //tr.className = 'border-b hover:bg-gray-50';
            headers.forEach(header => {
                const td = document.createElement('td');
                td.className = 'p-2 text-left';
                td.textContent = row[header] !== null && row[header] !== undefined ? row[header] : 'N/A';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    // Auto-load the default active tab
    // const activeTab = document.querySelector('.tab.active');
    // if (activeTab) {
    //     activeTab.click();
    // }
});