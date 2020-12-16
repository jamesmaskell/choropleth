window.addEventListener("DOMContentLoaded", (event) => {
	getGeoData().then((response) => {
		let geoData = response;

		getEduData().then((response) => {
			let eduData = response;
			let svg = d3.select("body").append("svg").attr("width", window.innerWidth).attr("height", window.innerHeight);

			svg
				.selectAll("path")
				.data(topojson.feature(geoData, geoData.objects.counties).features)
				.enter()
				.append("path")
				.attr("d", d3.geoPath())
				.attr("class", "county")
				.attr("fill", (d) => getColour(getEduAttributes(d, eduData, "bachelorsOrHigher")))
				.attr("data-fips", (d) => {
					return getEduAttributes(d, eduData, "fips");
				})
				.attr("data-education", (d) => {
					return getEduAttributes(d, eduData, "bachelorsOrHigher");
				})
				.on("mouseover", handleMouseOver)
				.on("mousemove", handleMouseMove)
				.on("mouseout", handleMouseOut);

			//svg.append("rect").attr("fill", "red").

			function handleMouseMove(e, d) {
				handleMouseOut(e, d);
				handleMouseOver(e, d);
			}

			function handleMouseOver(e, d) {
				console.log(e);
				d3.select("#tooltip")
					.html(`${getEduAttributes(d, eduData, "area_name")}, ${getEduAttributes(d, eduData, "state")}<br>${getEduAttributes(d, eduData, "bachelorsOrHigher")}%`)
					.style("background-color", "rgb(0,0,0,0.8)")
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

	function getColour(value) {
		if (value < 20.725) {
			return "red";
		}
		if (value < 38.85) {
			return "orangered";
		}
		if (value < 56.975) {
			return "orange";
		}
		return "yellow";
	}

	function getGeoData() {
		return fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json").then((response) => response.json());
	}

	function getEduData() {
		return fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json").then((response) => response.json());
	}
});
