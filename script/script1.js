
const map = L.map('map', {
center: [0, 0],  // Center the map on (0, 0) (near the equator and prime meridian)
zoom: 5,          // Set zoom level to 1 for world view (zoom: 1 should be global)
zoomControl: true // Enable zoom control buttons
});

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);

let fullData = []; // To hold the full dataset
let filteredData = []; // To hold filtered data
let selectedTopN = 10; // Default Top N painters to 10

// Initialize noUiSlider timeline
const timelineSlider = document.getElementById('timeline-slider');
noUiSlider.create(timelineSlider, {
start: [1902, 1915], // Initial range
connect: true,
range: {
min: 1902,
max: 1915
},
step: 1,
tooltips: [true, true],
format: {
to: value => Math.round(value),
from: value => Math.round(value)
}
});

// Function to update the year range display
function updateYearRangeDisplay(values) {
const yearRangeDisplay = document.getElementById('selected-year-range');
yearRangeDisplay.textContent = `Selected Year Range: ${Math.round(values[0])} - ${Math.round(values[1])}`;
yearRangeDisplay.style.display = 'none'; // This hides the element
}

// Function to update visualization
function updateVisualization(data) {
markerCluster.clearLayers(); // Clear existing markers

// Initialize an empty array to hold the marker positions for the bounds
const markers = [];

data.forEach(d => {
const marker = L.marker([d['e.latitude'], d['e.longitude']])
  .bindPopup(`<b>${d['a.name']}</b><br>Year of Event: ${d['e.startdate']}`);
markerCluster.addLayer(marker);

// Add each marker's position to the markers array
markers.push([d['e.latitude'], d['e.longitude']]);
});

// Adjust map bounds to fit the markers
if (markers.length > 0) {
const bounds = L.latLngBounds(markers);
map.fitBounds(bounds, { padding: [50, 50] });

// Check if bounds are too large or small, and adjust zoom level
if (map.getZoom() > 15) {
  map.setZoom(8); // Set a fallback zoom if too close
} else if (map.getZoom() < 2) {
  map.setZoom(2); // Set a fallback zoom if too zoomed out
}
}
}

// Function to update the total events count
function updateTotalEvents(count) {
document.getElementById('total-events').textContent = count;
}

// Function to update the solo/group events count
function updateSoloGroupCount(soloCount, groupCount) {
document.getElementById('solo-count').textContent = soloCount;
document.getElementById('group-count').textContent = groupCount;
}

// Function to update the top N painters in pie chart
function updatePieChart(data, topN) {
const painterCount = {};

// Count occurrences of each painter's name
data.forEach(d => {
const painter = d['a.name'];
painterCount[painter] = (painterCount[painter] || 0) + 1;
});

// Get the top N painters sorted by their frequency
const topPainters = Object.entries(painterCount)
.sort((a, b) => b[1] - a[1])
.slice(0, topN);

// Prepare the data for the pie chart
const labels = topPainters.map(painter => painter[0]);
const values = topPainters.map(painter => painter[1]);
const totalEvents = values.reduce((sum, val) => sum + val, 0);
// Destroy the existing chart if it exists
if (window.pieChartInstance) {
window.pieChartInstance.destroy();
}

const ctx = document.getElementById('pie-chart').getContext('2d');

// Prefix to be added before each value
const prefix = 'Number of events participated: ';

// Modify the labels to include the prefix dynamically
const updatedLabels = labels.map((label, index) => `${label}`);


// Create the pie chart
window.pieChartInstance = new Chart(ctx, {
type: 'doughnut',
data: {
labels: updatedLabels, // Use the updated labels
datasets: [{
  data: values, // Values remain unchanged
  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40', '#36F3F2', '#F1C232', '#F29C11', '#54B8FF', '#D441F2'],
  hoverBackgroundColor: ['#FF4384', '#36A1EB', '#FFAE56', '#4BC0F0', '#FF9F60', '#36F3F3', '#F1D232', '#F2A011', '#54B8F0', '#D441F1']
}]
},
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const dataset = tooltipItem.dataset.data;
              const value = dataset[tooltipItem.dataIndex];
              const percentage = ((value / totalEvents) * 100).toFixed(2);
              const label = tooltipItem.label; 
              return `${prefix}${value}`;
            }
          }
        }
      }
    },
plugins: [
{
  id: 'percentageLabels',
  afterDraw(chart) {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    chart.data.datasets[0].data.forEach((value, index) => {
      const meta = chart.getDatasetMeta(0).data[index];
      const percentage = ((value / totalEvents) * 100).toFixed(2);
      const position = meta.tooltipPosition();
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${percentage}%`, position.x, position.y - 10);
      ctx.restore();
    });
  }
}
]
});
}
// Handle tab-based file selection
let selectedFile = document.querySelector('.tab.active').dataset.file;

function activateTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  selectedFile = tab.dataset.file;
}

document.querySelectorAll('.tab').forEach(tab => {
// Listen for the click event on each tab
tab.addEventListener('click', () => {
// Remove 'active' class from all tabs
document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

// Add 'active' class to the clicked tab
tab.classList.add('active');

// Update the selected file based on the clicked tab's data attribute
selectedFile = tab.dataset.file;
document.getElementById('City').textContent = tab.textContent;

// Optional: Automatically trigger the file loading after selecting a tab
loadCSVFile(); // Automatically loads the file for the selected tab
});
});


// Load selected CSV file
function loadCSVFile(event) {
// Prevent default link behavior
event.preventDefault();

// Get the selected file and min/max years from the clicked link
const selectedLink = event.target;
const selectedFile = selectedLink.getAttribute('data-file');
const minYear = +selectedLink.getAttribute('data-min');
const maxYear = +selectedLink.getAttribute('data-max');

d3.csv(selectedFile)
.then(data => {
  // Parse the CSV data
  fullData = data.map(d => ({
    ...d,
    'e.latitude': +d['e.latitude'],
    'e.longitude': +d['e.longitude'],
    'e.startdate': +d['e.startdate']
  }));

  // Update the timeline slider with the new range
  timelineSlider.noUiSlider.updateOptions({
    range: {
      min: minYear,
      max: maxYear
    }
  });
  timelineSlider.noUiSlider.set([minYear, maxYear]);

  // Reset type filter to "all"
  document.getElementById("type-filter").value = "all";

  // Update visualization with the new data
  filteredData = fullData;
  filterData("all", [minYear, maxYear]);
  updateVisualization(fullData);
  updateTotalEvents(fullData.length);
  updateSoloGroupCountForFilteredData(fullData);
  updateSoloGroupCount(0, 0);
  updatePieChart(fullData, 10);
})
.catch(error => {
  console.error('Error loading file:', error);
});
}

// Add event listeners to all dropdown links
document.querySelectorAll('.dropdown-content .tab').forEach(link => {
link.addEventListener('click', loadCSVFile);
});

document.getElementById('loadFileButton').addEventListener('click', loadCSVFile);

// Filter data by type and date range
function filterData(type, dateRange) {
const [startYear, endYear] = dateRange.map(Number);

// Filter data based on type and year range
filteredData = fullData.filter(d => {
const year = d['e.startdate'];
const matchesType = type === "all" || d['e.type'].toLowerCase() === type.toLowerCase();
const matchesDate = year >= startYear && year <= endYear;
return matchesType && matchesDate;
});



// Count solo and group events based on the filtered data
const soloCount = filteredData.filter(d => d['e.type'].toLowerCase() === 'solo').length;
const groupCount = filteredData.filter(d => d['e.type'].toLowerCase() === 'group').length;
updateSoloGroupCount(soloCount, groupCount); // Update the displayed solo and group counts


// Update the map, total events count, solo/group count, and pie chart
updateVisualization(filteredData);
updateTotalEvents(filteredData.length);
updateSoloGroupCount(soloCount, groupCount);
updatePieChart(filteredData, selectedTopN); // Update the pie chart with the selected top N painters
}

// Set up filters
document.getElementById("type-filter").addEventListener("change", (event) => {
const dateRange = timelineSlider.noUiSlider.get();
filterData(event.target.value, dateRange);
});

timelineSlider.noUiSlider.on("update", (values) => {
const type = document.getElementById("type-filter").value;
filterData(type, values);
updateYearRangeDisplay(values); // Update the year range display
});
// Function to dynamically add year labels
function addYearLabels(startYear, endYear, step = 5) {
// Remove any existing year labels to avoid duplication
d3.selectAll(".year-label").remove();

// Dynamically calculate the year labels based on the range and step
const yearLabelsData = d3.range(Math.floor(startYear / step) * step, endYear + step, step);

// Select the timeline container (assumes you have an SVG element for the timeline)


}

timelineSlider.noUiSlider.on("update", (values) => {
const startYear = Math.round(values[0]);
const endYear = Math.round(values[1]);

// Update year labels dynamically based on the new range
addYearLabels(startYear, endYear, 1); // Adjust the step as needed
});



// Set up the top painters button-based selection
document.querySelectorAll('.top-painter-button').forEach(button => {
button.addEventListener('click', (event) => {
  const topN = event.target.getAttribute('data-top');
  
  // Remove the 'selected' attribute from all buttons
  document.querySelectorAll('.top-painter-button').forEach(btn => {
    btn.removeAttribute('selected');
  });

  // Add the 'selected' attribute to the clicked button
  event.target.setAttribute('selected', '');

  // Update the selected Top N painters value
  selectedTopN = parseInt(topN, 'selected');

  // Update the pie chart with the selected top N painters
  updatePieChart(filteredData, selectedTopN);
});
});

