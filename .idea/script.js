/**
 * Created by Tim on 11/10/2016.
 */
<!-- Common variables and functions used by all of the example plots -->
var width = 300;          //Width of each plot
var height = 300;         //Height of each plot
var buffer = 50;          //Buffer space to ensure points are adequately
                          // far from the edge of the plot

var locationData;

var numSamples = 12;      //Number of points to use
var cechRadius = 50;          //epsilon ball radius
var ripsRadius = 50;          //epsilon ball radius

//background grid information
var cellSize = 50;
var gridWidth = Math.ceil(width / cellSize);
var gridHeight = Math.ceil(height / cellSize);
var grid = new Array(gridWidth * gridHeight);

//The sample point set used by all of the examples
var points = new Array(2*numSamples);

//Randomly sample the input points
// for (var i = 0; i < numSamples; i++)
// {
//   points[2*i] = Math.random() * (width-2*buffer) + buffer;
//   points[2*i+1] = Math.random() * (height-2*buffer) + buffer;
// }

//Fixed points ensure a good test case
points[0] = 96; points[1] = 172;
points[2] = 164; points[3] = 245;
points[4] = 174; points[5] = 166;
points[6] = 188; points[7] = 215;
points[8] = 245; points[9] = 180;
points[10] = 219; points[11] = 119;
points[12] = 160; points[13] = 67;
points[14] = 180; points[15] = 53;
points[16] = 110; points[17] = 50;
points[18] = 70; points[19] = 250;
points[20] = 50; points[21] = 150;
points[22] = 90; points[23] = 100;


loadData();
console.log(locationData);

var k = 4;
var beta = 1;

function cmp(a,b) {
    return a[0] - b[0];
}

function updateCech(newValue) {
    document.getElementById("cechRadius").innerHTML=newValue;
    cechRadius=newValue;
    constructCech(d3.select('body').select('#cechCanvas'));
}

function updateRips(newValue) {
    document.getElementById("ripsRadius").innerHTML=newValue;
    ripsRadius=newValue;
    constructRips(d3.select('body').select('#ripsCanvas'));
}
function updateKNN(newValue) {
    document.getElementById("k").innerHTML=newValue;
    k=newValue;
    constructKNN(d3.select('body').select('#knnCanvas'));
}
function updateERG(newValue) {
    document.getElementById("beta").innerHTML=newValue;
    beta=newValue;
    constructERG(d3.select('body').select('#ergCanvas'));
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

function knnMouseOut(d) {
    knnToggleItem(this.id.toString(),false);
}
function knnMouseOver(d) {
    knnToggleItem(this.id.toString(),true);
}

function ergMouseOut(d) {
    ergToggleItem(this.id.toString(),false);
}
function ergMouseOver(d) {
    ergToggleItem(this.id.toString(),true);
}

function knnToggleItem(item, highlighted) {
    colorOn = '#c33'
    colorOff = '#000'
    var tokens = item.split('_');
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

        var i = parseInt(tokens[2]);
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        distances = [];
        for (var j = 0; j < numSamples; j++)
        {
            if(i == j)
            {
                continue;
            }
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
            distances.push([sqDistance,j]);
        }
        distances.sort(cmp);
        for (var j = 0; j < k; j++ )
        {
            idx = distances[j][1];
            if (i < idx)
            {
                idx1 = i;
                idx2 = idx;
            }
            else {
                idx1 = idx;
                idx2 = i;
            }
            d3.selectAll("#" + tokens[0] + '_Edge_' + idx1.toString() + '_' + idx2.toString())
                .transition()
                .style("stroke", strokeColor)
                .style("fill", fillColor);
            toggleNeighbor(tokens[0],idx,highlighted);
            if (j == k-1) {
                d3.selectAll("#" + tokens[0] + '_Circle_' + i.toString() + '_' + idx.toString())
                    .transition()
                    .style("fill", fillColor)
                    .style("fill-opacity", fillOpacity)
                    .style("stroke", strokeColor)
                    .style("stroke-opacity", strokeOpacity);
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

function ergToggleItem(item, highlighted) {
    colorOn = '#c33'
    colorOff = '#000'
    var tokens = item.split('_');
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
    }
    else {
        if (highlighted) {
            strokeColor = colorOn;
            fillColor = colorOn;
            fillOpacity = '0.25';
            strokeOpacity = '1';
        } else {
            strokeColor = colorOff;
            fillColor = colorOff;
            fillOpacity = '0';
            strokeOpacity = '0.15';
        }
        d3.selectAll("#" + item)
            .transition()
            .style("stroke", strokeColor)
            .style("fill", fillColor);
        d3.selectAll("#"+tokens[0]+"_Circle_" + tokens[2]+'_'+tokens[3])
            .transition()
            .style("fill", fillColor)
            .style("fill-opacity", fillOpacity)
            .style("stroke", strokeColor)
            .style("stroke-opacity", strokeOpacity);

        for (idx = 2; idx < tokens.length; idx++) {
            toggleNeighbor(tokens[0],parseInt(tokens[idx]),highlighted);
        }
    }
}

function toggleItem(item, highlighted) {
    colorOn = '#c33'
    colorOff = '#000'
    var tokens = item.split('_');
    if(tokens[0] == 'cech')
    {
        radius = cechRadius;
    }
    else
    {
        radius = ripsRadius;
    }

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
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        for (var j = 0; j < numSamples; j++)
        {
            if (j != i)
            {
                var x2 = points[2*j];
                var y2 = points[2*j+1];
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
    colorOn = '#933'
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
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        for (var j = i+1; j < numSamples; j++)
        {
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
            var sqDiameter = 4*Math.pow(cechRadius,2);
            if(sqDistance < sqDiameter)
            {
                for (var k = j+1; k < numSamples; k++)
                {
                    var x3 = points[2*k];
                    var y3 = points[2*k+1];
                    var testRadius = minimumEnclosingBallRadius(x1,y1,x2,y2,x3,y3);
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
                            .attr("points",pts)
                            .attr("class","face")
                            .attr("id","cech_Face_"+idx)
                            .on("mouseout", complexMouseOut)
                            .on("mouseover",complexMouseOver);
                    }
                }
            }
        }
    }

    //Edges second
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        for (var j = i+1; j < numSamples; j++)
        {
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
            var sqDiameter = 4*Math.pow(cechRadius,2);
            if((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) < sqDiameter)
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
        var x = points[2*i];
        var y = points[2*i+1];

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
            .attr("id","cech_Point_"+i.toString())
            .on("mouseover", complexMouseOver)
            .on("mouseout", complexMouseOut)
            // .transition()
            .attr("r", 5);
    }
    // function sample(idx, x, y)
    // {
    //   var s = [x, y];

    //   cechCircles.append("circle")
    //       .attr("r", 1e-6)
    // //              .attr("class", "circle")
    //       .attr("cx", x)
    //       .attr("cy", y)
    //       .attr("id","cech_Circle_"+idx.toString())
    //     .transition()
    //       .attr("r", cechRadius);

    //   cechPoints.append("circle")
    //       .datum(s)
    // //              .attr("class", "point")
    //       .attr("r", 1e-6)
    //       .attr("cx", x)
    //       .attr("cy", y)
    //       .attr("id","cech_Point_"+idx.toString())
    //       .on("mouseover", mapMouseOver)
    //       .on("mouseout", mapMouseOut)
    //     .transition()
    //       .attr("r", 5);
    //   return s;
    // }
}

function constructRips(ripsCanvas) {
    ripsCanvas.selectAll('.circle').remove();
    ripsCanvas.selectAll('.face').remove();
    ripsCanvas.selectAll('.edge').remove();
    ripsCanvas.selectAll('.point').remove();
    var ripsCircles = ripsCanvas.append("g").attr("class", "circle");
    var ripsFaces = ripsCanvas.append("g").attr("class", "face");
    var ripsEdges = ripsCanvas.append("g").attr("class", "edge");
    var ripsPoints = ripsCanvas.append("g").attr("class", "point");

    //Faces first
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        for (var j = i+1; j < numSamples; j++)
        {
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            for (var k = j+1; k < numSamples; k++)
            {
                var x3 = points[2*k];
                var y3 = points[2*k+1];
                var testRadius = MaximumEdgeLength(x1,y1,x2,y2,x3,y3);
                if (testRadius <= ripsRadius)
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

                    ripsFaces.append("polygon")
                        .attr("class","face")
                        .attr("points",pts)
                        .attr("id","rips_Face_"+idx)
                        .on("mouseout", complexMouseOut)
                        .on("mouseover",complexMouseOver);
                }
            }
        }
    }

    //Edges second
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        for (var j = i+1; j < numSamples; j++)
        {
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
            var sqDiameter = 4*Math.pow(ripsRadius,2);
            if(sqDistance < sqDiameter)
            {
                ripsEdges.append("line")
                    .attr("class","edge")
                    .attr("x1",x1)
                    .attr("y1",y1)
                    .attr("x2",x2)
                    .attr("y2",y2)
                    .attr("id","rips_Edge_"+i.toString()+"_"+j.toString())
                    .on("mouseout", complexMouseOut)
                    .on("mouseover",complexMouseOver);
            }
        }
    }

    //Points third
    for (var i = 0; i < numSamples; i++)
    {
        var x = points[2*i];
        var y = points[2*i+1];

        ripsCircles.append("circle")
            .attr("class", "circle")
            .attr("r", 1e-6)
            .attr("cx", x)
            .attr("cy", y)
            .attr("id","rips_Circle_"+i.toString())
            // .transition()
            .attr("r", ripsRadius);

        ripsPoints.append("circle")
            .attr("class", "point")
            .attr("r", 1e-6)
            .attr("cx", x)
            .attr("cy", y)
            .attr("id","rips_Point_"+i.toString())
            .on("mouseover", complexMouseOver)
            .on("mouseout", complexMouseOut)
            // .transition()
            .attr("r", 5);
    }
}

function constructKNN(canvas) {
    canvas.selectAll('.circle').remove();
    canvas.selectAll('.edge').remove();
    canvas.selectAll('.point').remove();
    var knnCircles = canvas.append("g").attr("class", "circle");
    var knnEdges = canvas.append("g").attr("class", "edge");
    var knnPoints = canvas.append("g").attr("class", "point");

    //Edges first
    //Brute force approach, this problem is small enough.
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        distances = [];
        for (var j = 0; j < numSamples; j++)
        {
            if (i == j)
            {
                continue;
            }
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            var sqDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
            distances.push([sqDistance,j]);
        }
        distances.sort(cmp);
        for (var j = 0; j < k; j++ )
        {
            idx = distances[j][1];
            if (i < idx)
            {
                idx1 = i;
                idx2 = idx;
            }
            else {
                idx1 = idx;
                idx2 = i;
            }
            var x2 = points[2*idx];
            var y2 = points[2*idx+1];
            knnEdges.append("line")
                .attr("class","edge")
                .attr("x1",x1)
                .attr("y1",y1)
                .attr("x2",x2)
                .attr("y2",y2)
                .attr("id","knn_Edge_"+idx1.toString()+"_"+idx2.toString())
                .on("mouseout", knnMouseOut)
                .on("mouseover",knnMouseOver);
            if (j == k-1) {
                radius = Math.sqrt(distances[j][0]);
                knnCircles.append("circle")
                    .attr("class", "circle")
                    .attr("r", 1e-6)
                    .attr("cx", x1)
                    .attr("cy", y1)
                    .attr("id","knn_Circle_"+i.toString()+'_'+idx.toString())
                    // .transition()
                    .attr("r", radius);
            }
        }
    }

    //Points second
    for (var i = 0; i < numSamples; i++)
    {
        var x = points[2*i];
        var y = points[2*i+1];

        knnPoints.append("circle")
            .attr("class", "point")
            .attr("r", 1e-6)
            .attr("cx", x)
            .attr("cy", y)
            .attr("id","knn_Point_"+i.toString())
            .on("mouseover", knnMouseOver)
            .on("mouseout", knnMouseOut)
            // .transition()
            .attr("r", 5);
    }
}

function constructERG(canvas) {
    canvas.selectAll('.circle').remove();
    canvas.selectAll('.face').remove();
    canvas.selectAll('.edge').remove();
    canvas.selectAll('.point').remove();
    var ergCircles = canvas.append("g").attr("class", "circle");
    var ergEdges = canvas.append("g").attr("class", "edge");
    var ergPoints = canvas.append("g").attr("class", "point");

    //Edges first
    //Brute force approach, this problem is small enough.
    for (var i = 0; i < numSamples; i++)
    {
        var x1 = points[2*i];
        var y1 = points[2*i+1];
        distances = [];
        for (var j = 0; j < numSamples; j++)
        {
            if (i == j) {
                continue;
            }
            var x2 = points[2*j];
            var y2 = points[2*j+1];
            var radius = 0.5*Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
            var xC = 0.5*(points[2*j]+points[2*i]);
            var yC = 0.5*(points[2*j+1]+points[2*i+1]);
            var valid = true;
            for (var k = 0; k < numSamples; k++) {
                if (i == k || j == k) {
                    continue;
                }
                var x3 = points[2*k];
                var y3 = points[2*k+1];
                if (beta < 1)
                {
                    r2 = Math.pow(radius,2) / (Math.pow(beta,2));
                    delta = Math.sqrt(r2 - (Math.pow(radius,2)));

                    rp = [x3-x1,y3-y1];
                    qp = [x2-x1,y2-y1];
                    t = (rp[0]*qp[0] + rp[1]*qp[1]) / (qp[0]*qp[0]+qp[1]*qp[1]);
                    proj = [t*x2+(1-t)*x1, t*y2+(1-t)*y1];

                    dproj = Math.sqrt(Math.pow(x3-proj[0],2) + Math.pow(y3-proj[1],2));
                    dprojmidsqr = Math.pow(proj[0]- 0.5*(x1+x2),2) + Math.pow(proj[1]- 0.5*(y1+y2),2);
                    d2 = dprojmidsqr + (dproj + delta)*(dproj + delta);
                    if (d2 < r2)
                    {
                        valid = false;
                        break;
                    }
                }
                else
                {
                    c1 = [(1-beta/2)*x1+(beta/2)*x2,(1-beta/2)*y1+(beta/2)*y2];
                    c2 = [(beta/2)*x1+(1-beta/2)*x2,(beta/2)*y1+(1-beta/2)*y2];
                    r2 = Math.pow(radius,2)*Math.pow(beta,2);
                    d1 = Math.pow(x3-c1[0],2)+Math.pow(y3-c1[1],2);
                    d2 = Math.pow(x3-c2[0],2)+Math.pow(y3-c2[1],2);
                    if (Math.max(d1,d2) < r2) {
                        valid = false;
                        break;
                    }
                }
            }
            if (valid) {
                ergEdges.append("line")
                    .attr("class","edge")
                    .attr("x1",x1)
                    .attr("y1",y1)
                    .attr("x2",x2)
                    .attr("y2",y2)
                    .attr("id","erg_Edge_"+i.toString()+"_"+j.toString())
                    .on("mouseout", ergMouseOut)
                    .on("mouseover", ergMouseOver);
                if (beta < 1) {
                    a = Math.sqrt(Math.pow(radius/beta,2)-Math.pow(radius,2));
                    xc1 = xC + a*(y2-y1)/Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
                    yc1 = yC + a*(x1-x2)/Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
                    // ergCircles.append("circle")
                    //   .attr("class", "circle")
                    //   .attr("r", 1e-6)
                    //   .attr("cx", xc1)
                    //   .attr("cy", yc1)
                    //   .attr("id","erg_Circle_"+i.toString()+'_'+j.toString()+'_a')
                    //   .transition()
                    //     .attr("r", radius/beta);

                    // xc2 = xC - a*(y2-y1)/Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
                    // yc2 = yC - a*(x1-x2)/Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
                    // ergCircles.append("circle")
                    //   .attr("class", "circle")
                    //   .attr("r", 1e-6)
                    //   .attr("cx", xc2)
                    //   .attr("cy", yc2)
                    //   .attr("id","erg_Circle_"+i.toString()+'_'+j.toString()+'_b')
                    //   .transition()
                    //     .attr("r", radius/beta);

                    ergCircles.append("path")
                        .attr("class", "circle")
                        .attr("id","erg_Circle_"+i.toString()+'_'+j.toString())
                        .attr("d", "M " + x1 + ' ' + y1
                            + ' A ' + radius/beta + ' ' + radius/beta + ' 0 0 0 ' + x2 + ' ' + y2
                            + ' A ' + radius/beta + ' ' + radius/beta + ' 0 0 0 ' + x1 + ' ' + y1 );
                }
                else
                {
                    // ergCircles.append("circle")
                    //   .attr("class", "circle")
                    //   .attr("r", 1e-6)
                    //   .attr("cx", c1[0])
                    //   .attr("cy", c1[1])
                    //   // .attr("cx", (2-beta)*xC + (beta-1)*x1)
                    //   // .attr("cy", (2-beta)*yC + (beta-1)*y1)
                    //   .attr("id","erg_Circle_"+i.toString()+'_'+j.toString()+'_a')
                    //   .transition()
                    //     .attr("r", radius*beta);

                    // ergCircles.append("circle")
                    //   .attr("class", "circle")
                    //   .attr("r", 1e-6)
                    //   .attr("cx", c2[0])
                    //   .attr("cy", c2[1])
                    //   // .attr("cx", (2-beta)*xC + (beta-1)*x2)
                    //   // .attr("cy", (2-beta)*yC + (beta-1)*y2)
                    //   .attr("id","erg_Circle_"+i.toString()+'_'+j.toString()+'_b')
                    //   .transition()
                    //     .attr("r", radius*beta);

                    a = Math.sqrt(Math.pow(c1[0]-0.5*(x1+x2),2)+Math.pow(c1[1]-0.5*(y1+y2),2));
                    b = Math.sqrt(Math.pow(radius*beta,2)-Math.pow(a,2));
                    //Intersection points:
                    xi1 = 0.5*(x1+x2) + b*(y2-y1)/(2*radius);
                    yi1 = 0.5*(y1+y2) + b*(x1-x2)/(2*radius);
                    xi2 = 0.5*(x1+x2) - b*(y2-y1)/(2*radius);
                    yi2 = 0.5*(y1+y2) - b*(x1-x2)/(2*radius);

                    ergCircles.append("path")
                        .attr("class", "circle")
                        .attr("id","erg_Circle_"+i.toString()+'_'+j.toString())
                        .attr("d", "M " + xi1 + ' ' + yi1
                            + ' A ' + radius*beta + ' ' + radius*beta + ' 0 0 1 ' + xi2 + ' ' + yi2
                            + ' A ' + radius*beta + ' ' + radius*beta + ' 0 0 1 ' + xi1 + ' ' + yi1);
                }
            }
        }
    }

    //Points second
    for (var i = 0; i < numSamples; i++)
    {
        var x = points[2*i];
        var y = points[2*i+1];

        ergPoints.append("circle")
            .attr("class", "point")
            .attr("r", 1e-6)
            .attr("cx", x)
            .attr("cy", y)
            .attr("id","erg_Point_"+i.toString())
            .on("mouseover", ergMouseOver)
            .on("mouseout", ergMouseOut)
            // .transition()
            .attr("r", 5);
    }
}

function loadData() {

    d3.csv("locations.csv", function (csv) {

        csv.forEach(function (d) {

            // Convert numeric values to 'numbers'
            d.xf = +d.xf;
            d.yf = +d.yf;
        });
        locationData = csv;
        console.log(locationData);
    });

    console.log(locationData)
}