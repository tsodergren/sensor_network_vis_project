/**
 * Created by Tim on 12/9/2016.
 */

// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 15,
        center: new google.maps.LatLng(40.762074, -111.828819),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

// Load the station data. When the data comes back, create an overlay.
d3.json("stations.json", function(error, data) {
    if (error) throw error;

    var overlay = new google.maps.OverlayView();

    // Add the container when the overlay is added to the map.
    overlay.onAdd = function() {
        var layer = d3.select(this.getPanes().overlayLayer).append("div")
            .attr("class", "stations")
            .attr("id","nodelayer");

        var layer2 = d3.select(this.getPanes().overlayLayer).append("div")
            .attr("class", "lines")
            .attr("id", "edgelayer");

        // Draw each marker as a separate SVG element.
        // We could use a single SVG, but what size would it have?
        overlay.draw = function() {
            var projection = this.getProjection(),
                padding = 10;

            var vertices = data.vertices;

            var marker = layer.selectAll("svg")
                .data(data.vertices)
                .each(transform) // update existing markers
                .enter().append("svg")
                .each(transform)
                .attr("class", "marker");

            // Add a circle.
            marker.append("circle")
                .attr("r",6 )
                .attr("cx", padding)
                .attr("cy", padding);

            // Add a label.
            marker.append("text")
                .attr("x", padding + 7)
                .attr("y", padding)
                .attr("dy", ".31em")
                .text(function(d) { return d.ID.toString(); });

            var longs = vertices.map( function(a) {return a.long;});
            var lats = vertices.map( function(a) {return a.lat;});

            x1 = d3.max(lats);
            x2 = d3.min(lats);
            y1 = d3.min(longs);
            y2 = d3.max(longs);

            // console.log("upper left = "+x1+" "+y1);
            // console.log("lower right = "+x2+" "+y2);

            var upperLeft = new google.maps.LatLng(d3.max(lats), d3.min(longs));
            var lowerRight = new google.maps.LatLng(d3.min(lats), d3.max(longs));

            upperLeft = projection.fromLatLngToDivPixel(upperLeft);
            lowerRight = projection.fromLatLngToDivPixel(lowerRight);

            // console.log("upper left = "+upperLeft.x+" "+upperLeft.y);
            // console.log("lower right = "+lowerRight.x+" "+lowerRight.y);

            var testdata = 1;

            var edgesSVG = layer2.append("svg")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 1000+"px")
                .attr("height", 1000+"px")
                .attr("class","edgesSVG");

            console.log(edgesSVG)

            var edges = edgesSVG.selectAll("line")
                .data(data.edges)
                .each(transformEdges)
                .enter().append("line")
                .each(transformEdges)
                .attr("class","edge");

            console.log(edges)

            function transformEdges(d) {

                var pt1 = new google.maps.LatLng(vertices[d.A].lat, vertices[d.A].long);
                pt1 = projection.fromLatLngToDivPixel(pt1);
                var pt2 = new google.maps.LatLng(vertices[d.B].lat, vertices[d.B].long);
                pt2 = projection.fromLatLngToDivPixel(pt2);
                return d3.select(this)
                    .attr("x1",pt1.x)
                    .attr("y1",pt1.y)
                    .attr("x2",pt2.x)
                    .attr("y2",pt2.y)
                    .style("stroke-width","3px")
                    .style("stroke","#000000");
            }

            function transform(d) {
                c = new google.maps.LatLng(d.lat, d.long);
                d = projection.fromLatLngToDivPixel(c);
                return d3.select(this)
                    .style("left", (d.x - padding) + "px")
                    .style("top", (d.y - padding) + "px");
            }

            // function transformLines(d, i) {
            //     c1 = new google.maps.LatLng(vertices[d.A].lat, vertices[d.A].long);
            //     d1 = projection.fromLatLngToDivPixel(c1);
            //     c2 = new google.maps.LatLng(vertices[d.B].lat, vertices[d.B].long);
            //     d2 = projection.fromLatLngToDivPixel(c2);
            //
            //     var x = [d1.x, d2.x];
            //     xm = Math.min(...x);
            //     var y = [d1.y, d2.y];
            //     ym = Math.min(...y);
            //
            //     d3.select(this).selectAll("line")
            //         .attr("x2", (padding+d2.x-d1.x)+"px")
            //         .attr("y2", (padding+d2.y-d1.y)+"px");
            //
            //     return d3.select(this)
            //         .style("top", (ym-padding)+"px")
            //         .style("left", (xm-padding)+"px")
            //         .style("width", 2*padding+d2.x-d1.x)
            //         .style("height", 2*padding+d2.y-d1.y);
            // }
            //
            // function transformLine(d) {
            //     c1 = new google.maps.LatLng(vertices[d.A].lat, vertices[d.A].long);
            //     d1 = projection.fromLatLngToDivPixel(c1);
            //     c2 = new google.maps.LatLng(vertices[d.B].lat, vertices[d.B].long);
            //     d2 = projection.fromLatLngToDivPixel(c2);
            //     return d3.select(this)
            //         .attr("x2", (padding+d2.x-d1.x)+"px")
            //         .attr("y2", (padding+d2.y-d1.y)+"px");
            //
            // }
            google.maps.event.addListener(map, 'click', function(event) {
                var point = projection.fromLatLngToDivPixel(event.latLng);
                console.log(point)
            })
        };



    };


    // Bind our overlay to the map…
    overlay.setMap(map);
});



// google.maps.event.addListener(map, 'click', function(event) {
//     placeMarker(map, event.latLng);
// });
//
// function placeMarker(map, location) {
//     var marker = new google.maps.Marker({
//         position: location,
//         map: map
//     });
//     console.log(location.lat()+" "+location.lng())
// }