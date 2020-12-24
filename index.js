window.addEventListener("DOMContentLoaded", (event) => {
	getGeoData().then((response) => {
		let geoData = response;

		getEduData().then((response) => {
			let eduData = response;

			let width = window.innerWidth * 0.6;
			// Don't let the width of the chart be any less than 600px
			if (width < 700) width = 700;

			let path = d3.geoPath();
			let scaling = getScaling(topojson.feature(geoData, geoData.objects.counties), width, path);

			let svg = d3.select("#chart").append("svg").attr("width", scaling.width).attr("height", scaling.height);

			let max = d3.max(eduData, (d) => d.bachelorsOrHigher);
			max = Math.ceil(max / 10) * 10;

			let rangeColor = d3.range(max);
			let color = d3.scaleQuantize().domain([0, max]).range(d3.schemeBlues[8]);

			console.log(getTickArray(max));
			let v = d3
				.scaleLinear()
				.domain([0, max / 100])
				.range([0, max * 3]);
			let rangeAxis = d3.axisBottom(v).tickSize(15).tickFormat(d3.format(".0%")).tickValues(getTickArray(max));

			function getTickArray(max) {
				return [0, (max * (1 / 8)) / 100, (max * (2 / 8)) / 100, (max * (3 / 8)) / 100, (max * (4 / 8)) / 100, (max * (5 / 8)) / 100, (max * (6 / 8)) / 100, (max * (7 / 8)) / 100, max / 100];
			}

			// draw map
			svg
				.selectAll("path")
				.data(topojson.feature(geoData, geoData.objects.counties).features)
				.enter()
				.append("path")
				.attr("d", d3.geoPath(scale(scaling.scaleFactor)))
				.attr("class", "county")
				.attr("fill", (d) => {
					let perc = getEduAttributes(d, eduData, "bachelorsOrHigher");
					return color(perc);
				})
				.attr("data-fips", (d) => {
					return getEduAttributes(d, eduData, "fips");
				})
				.attr("data-education", (d) => {
					return getEduAttributes(d, eduData, "bachelorsOrHigher");
				})
				.on("mouseover", handleMouseOver)
				.on("mousemove", handleMouseMove)
				.on("mouseout", handleMouseOut);

			svg.append("g").attr("id", "legend");

			let legend = svg.select("#legend");
			legend
				.selectAll("rect")
				.data(rangeColor)
				.enter()
				.append("rect")
				.attr("y", 10)
				.attr("height", 10)
				.attr("x", (d, i) => width * (1 / 2) + i * 3)
				.attr("id", (d, i) => {
					return `${i}%`;
				})
				.attr("width", 4)
				.attr("fill", (d) => color(d));

			svg
				.append("g")
				.attr("id", "x-axis")
				.attr("transform", "translate(" + width * (1 / 2) + ",10)")
				.attr("class", "axis")
				.call(rangeAxis);

			d3.select(".domain").remove();

			function handleMouseMove(e, d) {
				handleMouseOut(e, d);
				handleMouseOver(e, d);
			}

			function scale(scaleFactor) {
				return d3.geoTransform({
					point: function (x, y) {
						this.stream.point((x + scaling.xAdjustment) * scaling.scaleFactor, (y + scaling.yAdjustment) * scaling.scaleFactor);
					},
				});
			}

			function handleMouseOver(e, d) {
				d3.select("#tooltip")
					.html(`${getEduAttributes(d, eduData, "area_name")}, ${getEduAttributes(d, eduData, "state")}<br>${getEduAttributes(d, eduData, "bachelorsOrHigher")}%`)
					.style("background-color", "rgb(0,0,0,0.7)")
					.style("color", "whitesmoke")
					.style("padding", "10px")
					.style("top", `${e.pageY + 15}px`)
					.style("left", `${e.pageX + 15}px`)
					.attr("data-education", getEduAttributes(d, eduData, "bachelorsOrHigher"))
					.style("display", "block");
			}

			function handleMouseOut(e, d) {
				d3.select("#tooltip").html("").style("display", "none");
			}
		});
	});

	function getEduAttributes(d, eduData, property) {
		let eduMap = [...eduData];
		let county = eduMap.filter((obj) => obj.fips === d.id)[0];
		return county[property];
	}

	function getGeoData() {
		return fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json").then((response) => response.json());
	}

	function getEduData() {
		return fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json").then((response) => response.json());
	}

	function getScaling(geoJSON, width, path) {
		let scaling = {
			width: width,
		};
		let mapBounds = path.bounds(geoJSON);
		let minXValue = mapBounds[0][0],
			maxXValue = mapBounds[1][0];
		let xRange = maxXValue - minXValue;
		scaling.scaleFactor = width / xRange;

		scaling.height = mapBounds[1][1] * scaling.scaleFactor;

		scaling.yAdjustment = mapBounds[1][0] < 0 ? Math.abs(mapBounds[1][0]) : 0;
		scaling.xAdjustment = mapBounds[0][0] < 0 ? Math.abs(mapBounds[0][0]) : 0;

		return scaling;
	}
});
