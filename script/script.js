
d3.csv('csv/artist_birth_death.csv').then(data => {
    // Process data to store birth and death counts separately with genders
    const processedData = data.map(d => ({
        name: d.name,
        birthYear: +d.birth_year,
        deathYear: +d.death_year,
        gender: d.gender,
        country: d.nationality,
        placeofbirth:d.placeofbirth,
        placeofdeath:d.placeofdeath
    }));

    const countrySelect = d3.select("#country-select");
let selectedCountry = ""; // Keep track of the selected country

countrySelect.on("change", function() {
selectedCountry = d3.select(this).property("value");
updateChartAndTable(); // Call the update function when the dropdown changes
});

const updateTable = (startYear, endYear) => {
let filteredData = processedData.filter(d => {
const isBirthInRange = d.birthYear >= startYear && d.birthYear <= endYear;
const isDeathInRange = d.deathYear >= startYear && d.deathYear <= endYear;
return isBirthInRange || (d.deathYear !== undefined && d.deathYear !== null && isDeathInRange);
})
if (selectedCountry) {
    filteredData = filteredData.filter(d => d.country === selectedCountry);
}

// Get the table body element
const tableBody = d3.select("#table-body");

// Clear the existing table rows
tableBody.selectAll("tr").remove();

// Add a new row for each filtered record
filteredData.forEach(d => {
// Check if any field is "N/A", and skip adding the row if so
const birthYearDisplay = (d.birthYear >= startYear && d.birthYear <= endYear) ? d.birthYear : "N/A";
const deathYearDisplay = (d.deathYear !== undefined && d.deathYear !== null && d.deathYear >= startYear && d.deathYear <= endYear) ? d.deathYear : "N/A";

if (birthYearDisplay !== "N/A" && deathYearDisplay !== "N/A") {
    tableBody.append("tr")
        .html(`
            <td>${d.name || "Unknown"}</td>
            <td>${d.gender || "Unknown"}</td>
            <td>${d.country || "Unknown"}</td>
            <td>${birthYearDisplay}</td>
            <td>${deathYearDisplay}</td>
<td>${d.placeofbirth || "Unknown"}</td> <!-- Corrected -->
<td>${d.placeofdeath || "Unknown"}</td> <!-- Corrected -->
        `);
}});
};




    // Count the number of births and deaths per year, split by gender
    const yearCounts = d3.rollups(
        processedData.flatMap(d => [
            { year: d.birthYear, type: 'birth', gender: d.gender },
            { year: d.deathYear, type: 'death', gender: d.gender }
        ]), 
        v => ({
            total: v.length,
            male: v.filter(d => d.gender === 'M').length,
            female: v.filter(d => d.gender === 'F').length
        }),
        d => d.year,
        d => d.type
    ).map(([year, typeData]) => {
        const birthData = typeData.find(d => d[0] === 'birth')?.[1] || { total: 0, male: 0, female: 0 };
        const deathData = typeData.find(d => d[0] === 'death')?.[1] || { total: 0, male: 0, female: 0 };
        return { year, birthData, deathData };
    });

    const width = 1400;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 100, left: 50 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(yearCounts, d => d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(yearCounts, d => d.birthData.total + d.deathData.total)])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    // X and Y Axis Labels
    chartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
    chartGroup.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 70})`)
        .style("text-anchor", "middle")
        .text("Year of Birth/ Death");

    chartGroup.append("g")
        .attr("class", "y-axis")
        .call(yAxis);
    chartGroup.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .text("Count");

    const timeline = svg.append("g")
        .attr("class", "timeline")
        .attr("transform", `translate(${margin.left},${margin.top + height + 60})`);

    timeline.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width", 15);

    let startYear = xScale.domain()[0];
    let endYear = xScale.domain()[1];

    const handleWidth = 60;
    const handleHeight = 30;

    // Add a line before the year 1900 on the x-axis
    const xPosition1900 = xScale(1899); // Get the position for the year 1900 on the x-axis

    // Append a line at the desired position
    chartGroup.append("line")
        .attr("x1", xPosition1900)  // X position of the line (before 1900)
        .attr("x2", xPosition1900)  // X position of the line (same as x1 for vertical line)
        .attr("y1", 0)  // Y position to start the line from (top)
        .attr("y2", height)  // Y position to end the line at (bottom)
        .attr("stroke", "#000")  // Color of the line (black)
        .attr("stroke-width", 2);  // Width of the line
        const updateChartAndTable = () => {
updateChart();
updateTable(startYear, endYear);
updateGenderCounts(startYear, endYear);
};
    // Declare variables for birth and death years
    let birthYear = 0;
    let deathYear = 0;

    // For the startHandle (Birth Year)
    const startHandle = timeline.append("rect")
        .attr("class", "handle")
        .attr("x", xScale(startYear) - handleWidth / 2)
        .attr("y", -15)
        .attr("width", handleWidth)
        .attr("height", handleHeight)
        .style("fill", "#BFBFBF")
        .style("stroke", "black")
        .style("stroke-width", 4)
        .call(d3.drag()
            .on("drag", function (event) {
                startYear = Math.min(endYear, Math.max(xScale.invert(event.x), xScale.domain()[0]));
                d3.select(this).attr("x", xScale(startYear) - handleWidth / 2);
                updateChart();
                updateTable(startYear, endYear);  // Update the table with filtered data
                updateGenderCounts(startYear, endYear);
                updateChartAndTable();

                // Get the closest year data for birth
                const birthYearData = yearCounts.find(d => d.year === Math.round(startYear)); // Specific to birth year
                if (birthYearData) {
                    birthYear = birthYearData.year; // Update birthYear variable
                    d3.select("#birth-year").text(`Year: ${birthYear}`);
                }
            })
        );

    // For the endHandle (Death Year)
    const endHandle = timeline.append("rect")
        .attr("class", "handle")
        .attr("x", xScale(endYear) - handleWidth / 2)
        .attr("y", -15)
        .attr("width", handleWidth)
        .attr("height", handleHeight)
        .style("fill", "#BFBFBF")
        .style("stroke", "black")
        .style("stroke-width", 4)
        .call(d3.drag()
            .on("drag", function (event) {
                endYear = Math.max(startYear, Math.min(xScale.invert(event.x), xScale.domain()[1]));
                d3.select(this).attr("x", xScale(endYear) - handleWidth / 2);
                updateChart();
                updateChartAndTable();
                updateTable(startYear, endYear);  // Update the table with filtered data
                updateGenderCounts(startYear, endYear);

                // Get the closest year data for death
                const deathYearData = yearCounts.find(d => d.year === Math.round(endYear)); // Specific to death year
                if (deathYearData) {
                    deathYear = deathYearData.year; // Update deathYear variable
                    d3.select("#death-year").text(`Year: ${deathYear}`);
                }
            })
        );

    const tooltip = d3.select("#tooltip");

    // Function to update the gender-based counts
    const updateGenderCounts = (startYear, endYear) => {
        const filteredData = yearCounts.filter(d => d.year >= startYear && d.year <= endYear);

        const birthStats = filteredData.reduce((acc, d) => ({
            total: acc.total + d.birthData.total,
            male: acc.male + d.birthData.male,
            female: acc.female + d.birthData.female,
        }), { total: 0, male: 0, female: 0 });

        const deathStats = filteredData.reduce((acc, d) => ({
            total: acc.total + d.deathData.total,
            male: acc.male + d.deathData.male,
            female: acc.female + d.deathData.female,
        }), { total: 0, male: 0, female: 0 });

        d3.select("#birth-total").text(`Total: ${birthStats.total}`);
        d3.select("#birth-male").text(`Male: ${birthStats.male}`);
        d3.select("#birth-female").text(`Female: ${birthStats.female}`);

        d3.select("#death-total").text(`Total: ${deathStats.total}`);
        d3.select("#death-male").text(`Male: ${deathStats.male}`);
        d3.select("#death-female").text(`Female: ${deathStats.female}`);
    };

    // Function to update the chart based on the selected range
    const updateChart = () => {
        const filteredData = yearCounts.filter(d => d.year >= startYear && d.year <= endYear);

        // Dynamically update the yScale based on the filtered data
        yScale.domain([0, d3.max(filteredData, d => d.birthData.total + d.deathData.total)]);

        chartGroup.select(".y-axis").transition().duration(800).call(yAxis);

        // Update the chart bars
        const bars = chartGroup.selectAll(".bar")
            .data(filteredData, d => d.year);

        bars.exit().transition().duration(800).attr("y", yScale(0)).attr("height", 0).remove();

        const newBars = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.year) - 5)
            .attr("y", yScale(0))
            .attr("width", width / (endYear - startYear + 1) - 2)
            .attr("height", 0)
            .style("fill", "#964c5d") // Color for birth years
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .html(`Year: ${d.year}<br>Total Count: ${d.birthData.total + d.deathData.total}<br>Births: ${d.birthData.total}<br>Deaths: ${d.deathData.total}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
                const bar = d3.select(event.currentTarget);
                bar.style("fill", "orange"); // Change to hover color
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", (event) => {
                const bar = d3.select(event.currentTarget);
                bar.style("fill", "#964c5d"); // Restore original color
                tooltip.style("display", "none");
            })
            .on("click", (event, d) => {
                // Update gender counts or any other part of the UI
                d3.select("#birth-total").text(`Total: ${d.birthData.total}`);
                d3.select("#birth-male").text(`Male: ${d.birthData.male}`);
                d3.select("#birth-female").text(`Female: ${d.birthData.female}`);
                d3.select("#birth-year").text(`Year: ${d.year}`);

                d3.select("#death-year").text(`Year: ${d.year}`);
                d3.select("#death-total").text(`Total: ${d.deathData.total}`);
                d3.select("#death-male").text(`Male: ${d.deathData.male}`);
                d3.select("#death-female").text(`Female: ${d.deathData.female}`);
            });

        newBars.merge(bars)
            .transition().duration(800)
            .attr("x", d => xScale(d.year) - 5)
            .attr("y", d => yScale(d.birthData.total + d.deathData.total))
            .attr("width", width / (endYear - startYear + 1) - 2)
            .attr("height", d => height - yScale(d.birthData.total + d.deathData.total));

            updateTable(startYear, endYear);  // Update the table with filtered data
            updateGenderCounts(startYear, endYear);  // Update the table with filtered data

    };

    timeline.selectAll(".year-label").remove();
    const yearLabels = timeline.selectAll(".year-label")
        .data(d3.range(Math.floor(startYear / 20) * 20, endYear + 20, 20))
        .enter().append("text")
        .attr("class", "year-label")
        .attr("x", d => xScale(d))
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text(d => d);

    updateTable(startYear, endYear);
    updateChart(); // Initial chart update
});
