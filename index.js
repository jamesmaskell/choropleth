window.addEventListener("DOMContentLoaded", (event) => {
	getGeoData().then((response) => {
		let geoData = response;

		getEduData().then((response) => {
			let eduData = response;

			let width = window.innerWidth * 0.6;
			// Don't let the width of the chart be any less than 600px
			if (width < 700) width = 700;

			let geoJSON = topojson.feature(geoData, geoData.objects.counties);

			let path = d3.geoPath();
			let scaling = getScaling(geoJSON, width, path);

			let svg = d3.select("#chart").append("svg").attr("width", scaling.width).attr("height", scaling.height);

			let max = d3.max(eduData, (d) => d.bachelorsOrHigher);
			max = Math.ceil(max / 10) * 10;
			let getColor = d3.scaleQuantize().domain([0, max]).range(d3.schemeBlues[8]);

			// draw map
			svg
				.selectAll("path")
				.data(geoJSON.features)
				.enter()
				.append("path")
				.attr("d", d3.geoPath(scale(scaling)))
				.attr("class", "county")
				.attr("fill", (d) => getColor(getPercentage(d, eduData)))
				.attr("data-fips", (d) => getId(d, eduData))
				.attr("data-education", (d) => getPercentage(d, eduData))
				.on("mouseover", handleMouseOver)
				.on("mousemove", handleMouseMove)
				.on("mouseout", handleMouseOut);

			svg.append("g").attr("id", "legend");
			let colorRange = d3.range(max);
			let legendScale = d3
				.scaleLinear()
				.domain([0, max / 100])
				.range([0, max * 3]);
			let legendAxis = d3.axisBottom(legendScale).tickSize(15).tickFormat(d3.format(".0%")).tickValues(getTickArray(max));
			let legend = svg.select("#legend");
			legend
				.selectAll("rect")
				.data(colorRange)
				.enter()
				.append("rect")
				.attr("y", 10)
				.attr("height", 10)
				.attr("x", (d, i) => width * (1 / 2) + i * 3)
				.attr("id", (d, i) => {
					return `${i}%`;
				})
				.attr("width", 4)
				.attr("fill", (d) => getColor(d));
			svg
				.append("g")
				.attr("id", "x-axis")
				.attr("transform", "translate(" + width * (1 / 2) + ",10)")
				.attr("class", "axis")
				.call(legendAxis);
			d3.select(".domain").remove();

			function handleMouseMove(e, d) {
				handleMouseOut(e, d);
				handleMouseOver(e, d);
			}

			function handleMouseOver(e, d) {
				d3.select("#tooltip")
					.html(`${getAreaName(d, eduData)}, ${getState(d, eduData)}<br>${getPercentage(d, eduData)}%`)
					.style("background-color", "rgb(0,0,0,0.7)")
					.style("color", "whitesmoke")
					.style("padding", "10px")
					.style("border-radius", "3px")
					.style("top", `${e.pageY + 15}px`)
					.style("left", `${e.pageX + 15}px`)
					.attr("data-education", getPercentage(d, eduData))
					.style("display", "block");
			}

			function handleMouseOut(e, d) {
				d3.select("#tooltip").html("").style("display", "none");
			}
		});
	});

	function scale(scaling) {
		return d3.geoTransform({
			point: function (x, y) {
				this.stream.point((x + scaling.xAdjustment) * scaling.scaleFactor, (y + scaling.yAdjustment) * scaling.scaleFactor);
			},
		});
	}

	function getId(countyDataPoint, eduData) {
		return getEduAttributes(countyDataPoint, eduData, "fips");
	}

	function getPercentage(countyDataPoint, eduData) {
		return getEduAttributes(countyDataPoint, eduData, "bachelorsOrHigher");
	}

	function getState(countyDataPoint, eduData) {
		return getEduAttributes(countyDataPoint, eduData, "state");
	}

	function getAreaName(countyDataPoint, eduData) {
		return getEduAttributes(countyDataPoint, eduData, "area_name");
	}

	function getEduAttributes(countyDataPoint, eduData, property) {
		let eduMap = [...eduData];
		let county = eduMap.filter((eduDataObj) => eduDataObj.fips === countyDataPoint.id)[0];
		return county[property];
	}

	function getGeoData() {
		return fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json").then((response) => response.json());
	}

	function getEduData() {
		return fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json").then((response) => response.json());
	}

	function getScaling(geoJSON, width, path) {
		let mapBounds = path.bounds(geoJSON);
		return {
			width: width,
			scaleFactor: getScaleFactor(mapBounds, width),
			yAdjustment: getAdjustment(mapBounds, 1),
			xAdjustment: getAdjustment(mapBounds, 0),
			height: mapBounds[1][1] * getScaleFactor(mapBounds, width),
		};
	}

	function getScaleFactor(mapBounds, width) {
		let minXValue = mapBounds[0][0],
			maxXValue = mapBounds[1][0];
		let xRange = maxXValue - minXValue;
		return width / xRange;
	}

	function getAdjustment(mapBounds, idx) {
		return mapBounds[idx][0] < 0 ? Math.abs(mapBounds[idx][0]) : 0;
	}

	function getTickArray(max) {
		return [0, (max * (1 / 8)) / 100, (max * (2 / 8)) / 100, (max * (3 / 8)) / 100, (max * (4 / 8)) / 100, (max * (5 / 8)) / 100, (max * (6 / 8)) / 100, (max * (7 / 8)) / 100, max / 100];
	}
});
