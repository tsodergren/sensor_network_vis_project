/**

 * Created by Tim on 11/10/2016.
 */
<!-- Common variables and functions used by all of the example plots -->
var width = 1280;          //Width of each plot
var height = 720;         //Height of each plot
var buffer = 50;          //Buffer space to ensure points are adequately
                          // far from the edge of the plot
var dataScale = d3.scaleLinear()
    .domain([0,300])
    .range([0,720]);

var locationData;
var xp=[];
var yp=[];
var complexType = 'cech';

var numSamples = 12;      //Number of points to use
var cechRadius = 50;          //epsilon ball radius
cechRadius = dataScale(cechRadius);

//background grid information
var cellSize = 50;
var gridWidth = Math.ceil(width / cellSize);
var gridHeight = Math.ceil(height / cellSize);
var grid = new Array(gridWidth * gridHeight);

function cmp(a,b) {
    return a[0] - b[0];
}

function updateCech(newValue) {
    document.getElementById("cechRadius").innerHTML=newValue;
    cechRadius=newValue;
    constructCech(d3.select('body').select('#cechCanvas'));
    console.log('not done')
}

function updateRips(newValue) {
    document.getElementById("cechRadius").innerHTML=newValue;
    cechRadius=newValue;
    constructRips(d3.select('body').select('#cechCanvas'));
    console.log('updateRips');
}

function minimumEnclosingBallRadius(x1,y1,x2,y2,x3,y3) {
    var a = Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    var b = Math.sqrt((x1-x3)*(x1-x3)+(y1-y3)*(y1-y3));
    var c = Math.sqrt((x2-x3)*(x2-x3)+(y2-y3)*(y2-y3));

    var testRadius = Math.max(a,b,c)/2.;
    //Guaranteed to be set below in the if-conditional
    var xc;
    var yc;
    var dist;

    if (a >= b && a >= c)
    {
        xc = (x1+x2)/2.
        yc = (y1+y2)/2.
        dist = Math.sqrt((x3-xc)*(x3-xc)+(y3-yc)*(y3-yc));
    }
    else if (b >= a && b >= c)
    {
        xc = (x1+x3)/2.
        yc = (y1+y3)/2.
        dist = Math.sqrt((x2-xc)*(x2-xc)+(y2-yc)*(y2-yc));
    }
    else
    {
        xc = (x2+x3)/2.;
        yc = (y2+y3)/2.;
        dist = Math.sqrt((x1-xc)*(x1-xc)+(y1-yc)*(y1-yc));
    }

    //Test if the circumcircle around the largest edge
    // contains the third point, if not, then compute the
    // radius of the triangle's circumcircle
    if (testRadius < dist)
    {
        testRadius = (a*b*c)/Math.sqrt((a+b+c)*(b+c-a)*(a+c-b)*(a+b-c));
    }
    return testRadius;
}

function MaximumEdgeLength(x1,y1,x2,y2,x3,y3){
    var a = Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    var b = Math.sqrt((x1-x3)*(x1-x3)+(y1-y3)*(y1-y3));
    var c = Math.sqrt((x2-x3)*(x2-x3)+(y2-y3)*(y2-y3));
    return Math.max(a,b,c)/2.;
}

function resetAll() {
    d3.selectAll(".point")
        .transition()
        .style("fill", "#000");
    d3.selectAll(".edge")
        .transition()
        .style("stroke", "#000");
    d3.selectAll(".face")
        .transition()
        .style("fill", "#000");
    d3.selectAll(".circle")
        .transition()
        .style("fill", "#fff")
        .style("fill-opacity", "0")
        .style("stroke", "#000")
        .style("stroke-opacity", ".15");
}

function complexMouseOut(d) {
    toggleItem(this.id.toString(),false);
}
function complexMouseOver(d) {
    toggleItem(this.id.toString(),true);
}



function toggleItem(item, highlighted) {
    colorOn = '#c33'
    colorOff = '#000'
    var tokens = item.split('_');
    radius = cechRadius;

    //Point highlighted
    if (tokens.length == 3) {
        if (highlighted) {
            pointColor = colorOn;
            fillColor = colorOn;
            fillOpacity = '0.25';
            strokeColor = colorOn;
            strokeOpacity = '1';
        } else {
            pointColor = colorOff;
            fillColor = '#fff';
            fillOpacity = '0';
            strokeColor = colorOff;
            strokeOpacity = '0.15';
        }
        d3.selectAll("#"+item)
            .transition()
            .style("fill", pointColor);

        d3.selectAll("#"+tokens[0]+"_Circle_" + tokens[2])
            .transition()
            .style("fill", fillColor)
            .style("fill-opacity", fillOpacity)
            .style("stroke", strokeColor)
            .style("stroke-opacity", strokeOpacity);

        var i = parseInt(tokens[2]);
        var x1 = xp[i];
        var y1 = yp[i];
        for (var j = 0; j < numSamples; j++)
        {
            if (j != i)
            {
                var x2 = xp[j];
                var y2 = yp[j];
                var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
                var sqDiameter = 4*radius*radius;
                if(sqDistance < sqDiameter)
                {
                    toggleNeighbor(tokens[0],j,highlighted);
                }
            }
        }
    }
    else {
        if (highlighted) {
            strokeColor = colorOn;
            fillColor = colorOn;
        } else {
            strokeColor = colorOff;
            fillColor = colorOff;
        }
        d3.selectAll("#" + item)
            .transition()
            .style("stroke", strokeColor)
            .style("fill", fillColor);
        for (idx = 2; idx < tokens.length; idx++) {
            toggleNeighbor(tokens[0],parseInt(tokens[idx]),highlighted);
        }
    }
}

function toggleNeighbor(base,i,highlighted) {
    colorOff = '#000'
    var idx = i.toString();
    if (highlighted) {
        pointColor = colorOn;
        fillColor = colorOn;
        fillOpacity = '0.25';
        strokeColor = colorOn;
        strokeOpacity = '1';
    } else {
        pointColor = colorOff;
        fillColor = '#fff';
        fillOpacity = '0';
        strokeColor = colorOff;
        strokeOpacity = '.15';
    }
    d3.selectAll("#"+base+"_Point_" + idx)
        .transition()
        .style("fill", pointColor);

    d3.selectAll("#"+base+"_Circle_" + idx)
        .transition()
        .style("fill", fillColor)
        .style("fill-opacity", fillOpacity)
        .style("stroke", strokeColor)
        .style("stroke-opacity", strokeOpacity);
}

function constructCech(cechCanvas) {
    cechCanvas.selectAll('.circle').remove();
    cechCanvas.selectAll('.face').remove();
    cechCanvas.selectAll('.edge').remove();
    cechCanvas.selectAll('.point').remove();
    var cechCircles = cechCanvas.append("g").attr("class", "circle");
    var cechFaces = cechCanvas.append("g").attr("class", "face");
    var cechEdges = cechCanvas.append("g").attr("class", "edge");
    var cechPoints = cechCanvas.append("g").attr("class", "point");


    //Faces first
    for (var i = 0; i < numSamples; i++) {
        var x1 = locationData[i].xf;
        var y1 = locationData[i].yf;
        for (var j = i + 1; j < numSamples; j++) {
            var x2 = locationData[j].xf;
            var y2 = locationData[j].yf;
            var sqDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
            var sqDiameter = 4 * Math.pow(cechRadius, 2);
            if (sqDistance < sqDiameter) {
                for (var k = j + 1; k < numSamples; k++) {
                    var x3 = locationData[k].xf;
                    var y3 = locationData[k].yf;
                    var testRadius = minimumEnclosingBallRadius(x1, y1, x2, y2, x3, y3);
                    if (testRadius <= cechRadius) {
                        var idx1 = i;
                        var idx2 = j;
                        var idx3 = k;
                        if (k < i) {
                            idx1 = k;
                            idx2 = i;
                            idx3 = j;
                        }
                        else if (k < j) {
                            idx1 = i;
                            idx2 = k;
                            idx3 = j;
                        }
                        var pts = x1.toString() + ',' + y1.toString() + ','
                            + x2.toString() + ',' + y2.toString() + ','
                            + x3.toString() + ',' + y3.toString();

                        var idx = idx1.toString() + "_"
                            + idx2.toString() + "_"
                            + idx3.toString();

                        cechFaces.append("polygon")
                            .attr("points", pts)
                            .attr("class", "face")
                            .attr("id", "cech_Face_" + idx)
                            .on("mouseout", complexMouseOut)
                            .on("mouseover", complexMouseOver);
                    }
                }
            }
        }
    }

    //Edges second
    for (var i = 0; i < numSamples; i++) {
        var x1 = locationData[i].xf;
        var y1 = locationData[i].yf;
        for (var j = i + 1; j < numSamples; j++) {
            var x2 = locationData[j].xf;
            var y2 = locationData[j].yf;
            var sqDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
            var sqDiameter = 4 * Math.pow(cechRadius, 2);
            if ((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) < sqDiameter) {
                cechEdges.append("line")
                    .attr("class", "edge")
                    .attr("x1", x1)
                    .attr("y1", y1)
                    .attr("x2", x2)
                    .attr("y2", y2)
                    .attr("id", "cech_Edge_" + i.toString() + "_" + j.toString())
                    .on("mouseout", complexMouseOut)
                    .on("mouseover", complexMouseOver);
            }
        }
    }

    // // Points third
    // for (var i = 0; i < numSamples; i++)
    // {
    //     var x = xp[i];
    //     var y = yp[i];
    //
    //     cechCircles.append("circle")
    //         .attr("class", "circle")
    //         .attr("r", 1e-6)
    //         .attr("cx", x)
    //         .attr("cy", y)
    //         .attr("id","cech_Circle_"+i.toString())
    //         // .transition()
    //         .attr("r", cechRadius);
    //
    //     cechPoints.append("circle")
    //         .attr("class", "point")
    //         .attr("r", 1e-6)
    //         .attr("cx", x)
    //         .attr("cy", y)
    //         .attr("id",'point'+i.toString())
    //         .on("mouseover", complexMouseOver)
    //         .on("mouseout", complexMouseOut)
    //         // .transition()
    //         .attr("r", 5);
    // }

    cechPoints.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .attr("class", "point")
        .attr("r", 1e-6)
        .attr("cx", function (d) {
            return d.xf;
        })
        .attr("cy", function (d) {
            return d.yf;
        })
        .attr("id", function (d, i) {
            return 'cech_Point_' + i.toString();
        })
        .on("mouseover", complexMouseOver)
        .on("mouseout", complexMouseOut)
        .attr("r", 5);

    cechCircles.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .attr("class", "circle")
        .attr("r", 1e-6)
        .attr("cx", function (d) {
            return d.xf;
        })
        .attr("cy", function (d) {
            return d.yf;
        })
        .attr("id", function (d, i) {
            return 'cech_Circle_' + i.toString();
        })
        .attr("r", cechRadius);



}

function constructRips(cechCanvas) {
    cechCanvas.selectAll('.circle').remove();
    cechCanvas.selectAll('.face').remove();
    cechCanvas.selectAll('.edge').remove();
    cechCanvas.selectAll('.point').remove();
    var cechCircles = cechCanvas.append("g").attr("class", "circle");
    var cechFaces = cechCanvas.append("g").attr("class", "face");
    var cechEdges = cechCanvas.append("g").attr("class", "edge");
    var cechPoints = cechCanvas.append("g").attr("class", "point");

    //Faces first
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = xp[i];
        var y1 = yp[i];
        for (var j = i+1; j < numSamples; j++)
        {
            var x2 = xp[j];
            var y2 = yp[j];
            for (var k = j+1; k < numSamples; k++)
            {
                var x3 = xp[k];
                var y3 = yp[k];
                var testRadius = MaximumEdgeLength(x1,y1,x2,y2,x3,y3);
                if (testRadius <= cechRadius)
                {
                    var idx1 = i;
                    var idx2 = j;
                    var idx3 = k;
                    if (k < i)
                    {
                        idx1 = k;
                        idx2 = i;
                        idx3 = j;
                    }
                    else if (k < j)
                    {
                        idx1 = i;
                        idx2 = k;
                        idx3 = j;
                    }
                    var pts =   x1.toString() + ',' + y1.toString() + ','
                        + x2.toString() + ',' + y2.toString() + ','
                        + x3.toString() + ',' + y3.toString();
                    var idx =   idx1.toString() + "_"
                        + idx2.toString() + "_"
                        + idx3.toString();

                    cechFaces.append("polygon")
                        .attr("class","face")
                        .attr("points",pts)
                        .attr("id","cech_Face_"+idx)
                        .on("mouseout", complexMouseOut)
                        .on("mouseover",complexMouseOver);
                }
            }
        }
    }

    //Edges second
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = xp[i];
        var y1 = yp[i];
        for (var j = i+1; j < numSamples; j++)
        {
            var x2 = xp[j];
            var y2 = yp[j];
            var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
            var sqDiameter = 4*Math.pow(cechRadius,2);
            if(sqDistance < sqDiameter)
            {
                cechEdges.append("line")
                    .attr("class","edge")
                    .attr("x1",x1)
                    .attr("y1",y1)
                    .attr("x2",x2)
                    .attr("y2",y2)
                    .attr("id","cech_Edge_"+i.toString()+"_"+j.toString())
                    .on("mouseout", complexMouseOut)
                    .on("mouseover",complexMouseOver);
            }
        }
    }

    //Points third
    for (var i = 0; i < numSamples; i++)
    {
        var x = xp[i];
        var y = yp[i];

        cechCircles.append("circle")
            .attr("class", "circle")
            .attr("r", 1e-6)
            .attr("cx", x)
            .attr("cy", y)
            .attr("id","cech_Circle_"+i.toString())
            // .transition()
            .attr("r", cechRadius);

        cechPoints.append("circle")
            .attr("class", "point")
            .attr("r", 1e-6)
            .attr("cx", x)
            .attr("cy", y)
            .attr("id",'point'+i.toString())
            .on("mouseover", complexMouseOver)
            .on("mouseout", complexMouseOut)
            // .transition()
            .attr("r", 5);
    }
}



function loadData() {

    d3.csv("locations.csv", function (csv) {

        csv.forEach(function (d) {

            // Convert numeric values to 'numbers'
            d.LocationID = +d.LocationID;
            d.xf = dataScale(+d.xf);
            d.yf = dataScale(+d.yf);
        });
        locationData = csv;
        // xp = locationData.map( function (d) {
        //     return dataScale(d.xf);
        // });
        // yp = locationData.map( function (d) {
        //     return dataScale(d.yf)
        // });
        numSamples = locationData.length;
        updateCech(document.getElementById("cechInput").value);
        // updateRips(document.getElementById("cechInput").value);
    });
}

function randomData() {

    n = document.getElementById('numSensors').value;
    numSamples = +n;

    locationData = [];

    for (i=0; i<numSamples; i++) {
        x = dataScale(getRndInteger(50, 475));
        y = dataScale(getRndInteger(50, 250));
        var newPoint = {LocationID: i, xf: x, yf: y};
        locationData.push(newPoint);
    }
    updateCech(document.getElementById("cechInput").value);
    // updateRips(document.getElementById("ripsInput").value);

}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function changeComplex(value) {

    complexType = value;
    if (complexType=="cech") {
        document.getElementById("plotHeader").innerHTML='&#268;ech Complex';
        updateCech(document.getElementById("cechInput").value);
    } else {
        updateRips(document.getElementById("cechInput").value);
        document.getElementById("plotHeader").innerHTML='Vietoris-Rips Complex';
    }

}

function addNode() {

    cechCanvas.attr('cursor','crosshair')
        .on('click',function () {
            coords = d3.mouse(this);
            updateNode(coords);
        });
}

function updateNode(coords) {
    i = locationData.length;
    var newPoint = {LocationID: i, xf: coords[0], yf: coords[1]};
    locationData.push(newPoint);
    numSamples = numSamples+1;
    updateCech(document.getElementById("cechInput").value);
    cechCanvas.attr('cursor',null)
        .on('click',null);
}

function deleteNode() {
    d3.selectAll('.point').selectAll('circle')
        .on('click', function () {
            selectedNode = +this.id.match(/\d+/g);
            locationData.splice(selectedNode,1);
            numSamples = locationData.length;
            updateCech(document.getElementById("cechInput").value);
        });
}

function moveNode() {
    d3.selectAll('.point').selectAll('circle')
        .on('click', function () {
            selectedNode = +this.id.match(/\d+/g);
            getLocation(selectedNode);
        })
}

function getLocation(selectedNode) {
    window.alert('Select the new location')
    cechCanvas.attr('cursor','crosshair')
        .on('click', function () {
            coords = d3.mouse(this);
            updateLocation(coords);
        })
}

function updateLocation(coords) {
    locationData[selectedNode].xf = coords[0];
    locationData[selectedNode].yf = coords[1];
    updateCech(document.getElementById("cechInput").value);
    console.log('done');
    resetCanvas();
}

function resetCanvas() {
    console.log('here');
}