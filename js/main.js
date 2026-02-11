// js/main.js - Updated to load all new data files for custom plotting

document.addEventListener('DOMContentLoaded', function() {
    // js/main.js - Corrected paths with spaces removed

    const dataPaths = {
        clinical: d3.csv("data/S2_Clinical_summary.csv"),
        mutation: d3.csv("data/S3_Mutation.csv"),
        surfaceAntigen: d3.csv("data/S4_Surface_antigen.csv"),       // <-- CHANGED
        amlFusion: d3.csv("data/S5_Consensus_AML_fusion.csv"),      // <-- CHANGED
        rnaSeq: d3.csv("data/S6_RNA_sequencing_VST.csv"),         // <-- CHANGED
        dssMono: d3.csv("data/S10_DSS-Monotherapy.csv"),
        dssCombo: d3.csv("data/S11_DSS-Combination.csv"),
        proteomics: d3.csv("data/S12_GlobalProteomics.csv"),
        comboDss: d3.json("data/summary/baml_ida_predictions.json"),
        hsaSynergy: d3.csv("data/CombinationIndex.csv"),
    };

    Promise.all(Object.entries(dataPaths).map(([key, promise]) => promise.then(data => ({key, data}))))
        .then(function(results) {
            const appData = results.reduce((acc, {key, data}) => {
                acc[key] = data;
                return acc;
            }, {});

       
        // Initialize tab behavior first to ensure content is correctly shown/hidden
        initializeTabs(appData);

    }).catch(function(error) {
        console.error("Fatal Error: Could not load required dashboard data.", error);
        summaryContainer.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Failed to load critical data!</strong>
            <span class="block sm:inline">Please check that all required files are in the 'data' folder and the server is running correctly.</span>
        </div>`;
    });
});


// --- Tab Initialization and Switching Logic ---
function initializeTabs(appData) {
    // Track which tabs have been initialized
    const tabInitialized = {
        summary: false,
        clinical: false,
        drug: false,
        custom: false
        // add more keys if you have more tabs
    };

    function initTabIfNeeded(key) {
        if (tabInitialized[key]) return;

        if (key === 'summary') {
            // --- Initialize Dashboard Components --- Build summary DOM 
            const summaryContainer = document.getElementById('content-summary');
            summaryContainer.innerHTML = `<p class="text-center text-gray-500 p-8">Loading all datasets, please wait...</p>`;

            summaryContainer.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-2xl font-semibold text-center mb-6 text-gray-700">Dataset Summary</h3>
                    <div id="plots-container" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div id="gender-plot" class="plot-container border rounded-lg p-2"></div>
                        <div id="vital-plot" class="plot-container border rounded-lg p-2"></div>
                        <div id="age-plot" class="plot-container border rounded-lg p-2"></div>
                        <div id="fab-plot" class="plot-container border rounded-lg p-2"></div>
                    </div>
                </div>`;

            createSummaryPlots(appData.clinical);
            tabInitialized.summary = true;
            return;
        }

        if (key === 'clinical') {
            initializeClinicalTab(appData.clinical);
            tabInitialized.clinical = true;
            return;
        }

        if (key === 'drug') {
            if (typeof initializeDrugResponseTab === 'function') {
                initializeDrugResponseTab(appData.hsaSynergy, appData.comboDss);
                tabInitialized.drug = true;
            } else {
                console.error("initializeDrugResponseTab function not found.");
            }
            return;
        }

        if (key === 'custom') {
            initCustomPlots(appData);
            tabInitialized.custom = true;
            return;
        }
    }

    const tabManager = window.DashboardUI?.createTabManager({
        defaultTab: 'summary',
        onActivate: initTabIfNeeded
    });

    if (tabManager) {
        tabManager.activate(tabManager.current());
    } else {
        initTabIfNeeded('summary');
    }
    
    // Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}



// --- Summary Plots Function ---
function createSummaryPlots(clinicalData) {
    // Premium color palettes with gradients
    const premiumColors = {
        // Gender - Soft, modern palette
        gender: ['#f093fb', '#667eea', '#764ba2', '#4facfe', '#00f2fe', '#a8edea', '#fed6e3'],
        // Vital Status - Meaningful colors (green=alive, red=deceased, etc.)
        vital: ['#00b894', '#e17055', '#fdcb6e', '#6c5ce7', '#74b9ff', '#a29bfe'],
        // Gradient scales for continuous data
        gradientBlue: [[0, '#e3f2fd'], [0.5, '#64b5f6'], [1, '#1976d2']],
        gradientPurple: [[0, '#f3e5f5'], [0.5, '#ba68c8'], [1, '#7b1fa2']],
        gradientTeal: [[0, '#e0f2f1'], [0.5, '#4db6ac'], [1, '#00695c']]
    };

    // Enhanced base layout with premium styling
    const baseLayout = {
        autosize: true,
        font: {
            family: 'Inter, sans-serif',
            size: 11,
            color: '#2c3e50'
        },
        title: {
            font: {
                size: 16,
                color: '#1a283e',
                family: 'Inter, sans-serif',
                weight: '600'
            },
            x: 0.5,
            xanchor: 'center',
            pad: { t: 10, b: 20 }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 70, b: 50, l: 60, r: 40 },
        showlegend: true,
        legend: {
            font: { 
                size: 11, 
                family: 'Inter, sans-serif',
                color: '#34495e'
            },
            bgcolor: 'rgba(255,255,255,0.95)',
            bordercolor: 'rgba(0,0,0,0.15)',
            borderwidth: 1.5,
            x: 0.98,
            y: 0.5,
            xanchor: 'right',
            yanchor: 'middle',
            itemclick: false,
            itemdoubleclick: false
        }
    };

    const getValueCounts = (data, column) => {
        const counts = {};
        for (const row of data) {
            const value = row[column];
            if (value !== null && value !== undefined && value !== '') {
                counts[value] = (counts[value] || 0) + 1;
            }
        }
        return counts;
    };

    // Gender Distribution - Premium donut chart with enhanced styling
    const genderCounts = getValueCounts(clinicalData, 'gender');
    const genderLabels = Object.keys(genderCounts);
    const genderValues = Object.values(genderCounts);
    const totalGender = genderValues.reduce((a, b) => a + b, 0);
    
    Plotly.newPlot('gender-plot', [{
        values: genderValues,
        labels: genderLabels,
        type: 'pie',
        hole: 0.6,
        rotation: 45,
        marker: {
            colors: premiumColors.gender.slice(0, genderLabels.length),
            line: {
                color: '#ffffff',
                width: 3
            },
            opacity: 0.95
        },
        textinfo: 'label+percent',
        textposition: 'outside',
        textfont: {
            size: 12,
            color: '#2c3e50',
            family: 'Inter, sans-serif'
        },
        hovertemplate: '<b>%{label}</b><br>' +
                      '<span style="color: #667eea">●</span> Count: <b>%{value}</b><br>' +
                      '<span style="color: #667eea">●</span> Percentage: <b>%{percent}</b><br>' +
                      '<span style="color: #667eea">●</span> Total: <b>' + totalGender + '</b><extra></extra>',
        pull: 0.02 // Slight separation for visual appeal
    }], {
        ...baseLayout,
        title: {
            ...baseLayout.title,
            text: 'Gender Distribution'
        },
        height: 380,
        annotations: [{
            text: `<b>${totalGender}</b><br>Total Patients`,
            showarrow: false,
            font: {
                size: 14,
                color: '#667eea',
                family: 'Inter, sans-serif'
            },
            x: 0.5,
            y: 0.5
        }]
    }, {responsive: true, displayModeBar: false});

    // Vital Status - Premium donut chart with meaningful colors
    const vitalCounts = getValueCounts(clinicalData, 'vitalStatus');
    const vitalLabels = Object.keys(vitalCounts);
    const vitalValues = Object.values(vitalCounts);
    const totalVital = vitalValues.reduce((a, b) => a + b, 0);
    
    // Map vital status to meaningful colors
    const vitalColorMap = {
        'Alive': '#00b894',
        'Dead': '#e17055',
        'Unknown': '#fdcb6e',
        'Lost to Follow-up': '#6c5ce7'
    };
    const vitalColors = vitalLabels.map(label => 
        vitalColorMap[label] || premiumColors.vital[vitalLabels.indexOf(label) % premiumColors.vital.length]
    );
    
    Plotly.newPlot('vital-plot', [{
        values: vitalValues,
        labels: vitalLabels,
        type: 'pie',
        hole: 0.6,
        rotation: 45,
        marker: {
            colors: vitalColors,
            line: {
                color: '#ffffff',
                width: 3
            },
            opacity: 0.95
        },
        textinfo: 'label+percent',
        textposition: 'outside',
        textfont: {
            size: 12,
            color: '#2c3e50',
            family: 'Inter, sans-serif'
        },
        hovertemplate: '<b>%{label}</b><br>' +
                      '<span style="color: #00b894">●</span> Count: <b>%{value}</b><br>' +
                      '<span style="color: #00b894">●</span> Percentage: <b>%{percent}</b><br>' +
                      '<span style="color: #00b894">●</span> Total: <b>' + totalVital + '</b><extra></extra>',
        pull: 0.02
    }], {
        ...baseLayout,
        title: {
            ...baseLayout.title,
            text: 'Patient Vital Status'
        },
        height: 380,
        annotations: [{
            text: `<b>${totalVital}</b><br>Total Patients`,
            showarrow: false,
            font: {
                size: 14,
                color: '#00b894',
                family: 'Inter, sans-serif'
            },
            x: 0.5,
            y: 0.5
        }]
    }, {responsive: true, displayModeBar: false});

    // Age Distribution - Premium histogram with beautiful gradient
    const ages = clinicalData.map(row => parseFloat(row.ageAtDiagnosis)).filter(age => !isNaN(age));
    const ageMean = ages.reduce((a, b) => a + b, 0) / ages.length;
    const ageMedian = ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)];
    
    Plotly.newPlot('age-plot', [{
        x: ages,
        type: 'histogram',
        nbinsx: 25,
        marker: {
            color: ages,
            colorscale: [
                [0, '#e3f2fd'],
                [0.3, '#64b5f6'],
                [0.6, '#42a5f5'],
                [1, '#1976d2']
            ],
            line: {
                color: '#ffffff',
                width: 2
            },
            opacity: 0.85
        },
        hovertemplate: '<b>Age Range</b>: %{x} years<br>' +
                      '<span style="color: #1976d2">●</span> Count: <b>%{y}</b><br>' +
                      '<span style="color: #1976d2">●</span> Mean Age: <b>' + ageMean.toFixed(1) + '</b> years<extra></extra>',
        histnorm: '',
        xbins: {
            size: 5
        }
    }], {
        ...baseLayout,
        title: {
            ...baseLayout.title,
            text: 'Distribution of Age at Diagnosis'
        },
        xaxis: {
            title: {
                text: 'Age (years)',
                font: { 
                    size: 12, 
                    family: 'Inter, sans-serif',
                    color: '#2c3e50'
                }
            },
            showgrid: true,
            gridcolor: 'rgba(102, 126, 234, 0.15)',
            gridwidth: 1,
            zeroline: false,
            showline: true,
            linecolor: 'rgba(0,0,0,0.1)',
            linewidth: 1
        },
        yaxis: {
            title: {
                text: 'Number of Patients',
                font: { 
                    size: 12, 
                    family: 'Inter, sans-serif',
                    color: '#2c3e50'
                }
            },
            showgrid: true,
            gridcolor: 'rgba(102, 126, 234, 0.15)',
            gridwidth: 1,
            zeroline: false,
            showline: true,
            linecolor: 'rgba(0,0,0,0.1)',
            linewidth: 1
        },
        showlegend: false,
        height: 380,
        shapes: [{
            type: 'line',
            x0: ageMean,
            x1: ageMean,
            y0: 0,
            y1: 1,
            yref: 'paper',
            line: {
                color: '#e17055',
                width: 2,
                dash: 'dash'
            }
        }],
        annotations: [{
            x: ageMean,
            y: 0.95,
            yref: 'paper',
            text: `Mean: ${ageMean.toFixed(1)} yrs`,
            showarrow: true,
            arrowhead: 2,
            arrowcolor: '#e17055',
            font: {
                size: 10,
                color: '#e17055',
                family: 'Inter, sans-serif'
            },
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#e17055',
            borderwidth: 1
        }]
    }, {responsive: true, displayModeBar: false});

    // AML Subtype Distribution - Premium horizontal bar chart with gradient
    const fabCounts = getValueCounts(clinicalData, 'AML_subtype');
    const sortedFab = Object.entries(fabCounts).sort(([,a],[,b]) => b - a); // Sort descending
    const fabLabels = sortedFab.map(item => item[0]);
    const fabValues = sortedFab.map(item => item[1]);
    const maxFabValue = Math.max(...fabValues);
    
    Plotly.newPlot('fab-plot', [{
        y: fabLabels,
        x: fabValues,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: fabValues,
            colorscale: [
                [0, '#f3e5f5'],
                [0.3, '#ce93d8'],
                [0.6, '#ba68c8'],
                [1, '#7b1fa2']
            ],
            line: {
                color: '#ffffff',
                width: 2
            },
            opacity: 0.9,
            showscale: true,
            colorbar: {
                title: {
                    text: 'Count',
                    font: { size: 10, family: 'Inter, sans-serif' }
                },
                thickness: 8,
                len: 0.5,
                x: 1.05
            }
        },
        text: fabValues.map(v => v.toString()),
        textposition: 'outside',
        textfont: {
            size: 11,
            color: '#7b1fa2',
            family: 'Inter, sans-serif',
            weight: '600'
        },
        hovertemplate: '<b>%{y}</b><br>' +
                      '<span style="color: #7b1fa2">●</span> Count: <b>%{x}</b><br>' +
                      '<span style="color: #7b1fa2">●</span> Percentage: <b>%{customdata}%</b><extra></extra>',
        customdata: fabValues.map(v => ((v / fabValues.reduce((a,b) => a+b, 0)) * 100).toFixed(1))
    }], {
        ...baseLayout,
        title: {
            ...baseLayout.title,
            text: 'AML Subtype Distribution'
        },
        xaxis: {
            title: {
                text: 'Number of Patients',
                font: { 
                    size: 12, 
                    family: 'Inter, sans-serif',
                    color: '#2c3e50'
                }
            },
            showgrid: true,
            gridcolor: 'rgba(123, 31, 162, 0.15)',
            gridwidth: 1,
            zeroline: true,
            zerolinecolor: 'rgba(123, 31, 162, 0.3)',
            zerolinewidth: 2,
            showline: true,
            linecolor: 'rgba(0,0,0,0.1)',
            linewidth: 1
        },
        yaxis: {
            title: {
                text: 'AML Subtype',
                font: { 
                    size: 12, 
                    family: 'Inter, sans-serif',
                    color: '#2c3e50'
                }
            },
            showgrid: false,
            automargin: true,
            showline: true,
            linecolor: 'rgba(0,0,0,0.1)',
            linewidth: 1
        },
        showlegend: false,
        margin: { ...baseLayout.margin, r: 80 }, // Extra space for colorbar
        height: Math.max(380, fabLabels.length * 30) // Dynamic height with better spacing
    }, {responsive: true, displayModeBar: false});
}