// js/sample_details.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Get the Sample ID from the URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('sample');
    
    const header = document.getElementById('details-header');

    if (sampleId) {
        // Update the page header to show which sample we're looking at
        header.textContent = `Details for Sample: ${sampleId}`;
        console.log(`Page loaded for sample: ${sampleId}`);
        // Now we have the sampleId, we can fetch and display its specific data.
        // We will add that logic later.
    } else {
        header.textContent = 'Error: No Sample ID provided';
        console.error("No 'sample' parameter found in the URL.");
    }

    // --- 2. Set up Tab Switching Logic for this page ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and content
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate the clicked tab and its corresponding content
            tab.classList.add('active');
            const contentId = 'content-' + tab.id.split('-')[1];
            document.getElementById(contentId).classList.add('active');
        });
    });

});