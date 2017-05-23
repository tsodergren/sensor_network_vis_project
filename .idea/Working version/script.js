/*
 * Created by Tim on 11/10/2016.
 */
<!-- Common variables and functions used by all of the example plots -->
var width = document.getElementById('plotArea').offsetWidth;          //Width of each plot
var height = document.getElementById('plotArea').offsetHeight;         //Height of each plot
var padding = 30;          //Buffer space to ensure points are adequately


//Initialize the data
var filename = 'data.json';
var locationData = [];
var complexType;
var selectedNodes = [];
var newZscale = 1;
var newxScale, newyScale;
var linew = 4;
var pad = padding;

var cechFaces = [];
var cechEdges = [];
var ripsFaces = [];
var ripsEdges = [];
var allEdges = [];
var dataMin = 0;
var distances = [];

var numSamples = 0;      //Number of points to use
var complexRadius = 20;          //epsilon ball radius
var dataRadius = 10; //radius of uncertainty
var numPoints = 8; //number of possible data locations per node
var originalDataRadius = 10;

//background grid information
var cellSize = 50;
var gridWidth = Math.ceil( (width+padding*2) / cellSize);
var gridHeight = Math.ceil( (height+padding*2) / cellSize);
var grid = new Array(gridWidth * gridHeight);
var wasDragged = false;
var zoomOn = false;

//Construct the main plot area and add gridlines
var complexSVG = d3.select("#plotArea").append('svg')
    .attr("class", "cech")
    .attr("id", "complexSVG")
    .attr("width", width+padding*2)
    .attr("height", height+padding*2)
    .style("margin", "auto")
    .style("border", "1px solid black");

var xScale = d3.scaleLinear()
    .domain([0,100])
    .range([0, width]);

var xAxis = d3.axisTop()
    .scale(xScale);

var gX = complexSVG.append('g')
    .attr('transform','translate('+padding+','+padding+')')
    .call(xAxis);

var yScale = d3.scaleLinear()
    .domain([0,100])
    .range([0, height]);

var yAxis = d3.axisLeft()
    .scale(yScale);

var gY = complexSVG.append('g')
    .attr('transform','translate('+padding+','+padding+')')
    .call(yAxis);

var lightGreen = "#99ff99";
var darkGreen = "#006600";
var orange = "#ff9400";
var lightOrange = "#ffd8a3";
var blue = "#00f";
var yellow = "#ff0";
var lightGray = "#aaa";
var gray = "#595959";
var tan = "#ffffbf";
var start = lightGreen;
var end = darkGreen;

var faceGreenScale = d3.scaleLinear().range([lightGreen, darkGreen]).domain([0.01, 1]);
var faceOrangeScale = d3.scaleLinear().range([lightOrange, orange]).domain([0.01, 1]);
var faceBlueYellowScale = d3.scaleLinear().range([blue, yellow]).domain([0.01, 1]);
var faceOrangeBlueScale = d3.scaleLinear().range([orange, tan, blue])
    .domain([0.01, 0.5, 1]);
var faceGrayScale = d3.scaleLinear().range([lightGray, gray]).domain([0.01, 1]);

var faceColorScale = faceGreenScale;
var faceOpacityScale = d3.scaleLinear().range([0.3, 0.75]).domain([0.01, 1]);
var edgeOpacityScale = d3.scaleLinear().range([0.2, 1]).domain([0.01, 1]);
var edgeWidthScale = d3.scaleLinear().range([2, 6]).domain([0.01, 1]);


var complexCanvas = complexSVG.append('g')
    .attr('class','cech')
    .attr('id','complexCanvas');

complexSVG.append('rect')
    .attr('x', padding)
    .attr('y', padding)
    .attr('width', width)
    .attr('height', height)
    .style('fill','none')
    .style('stroke','#000')
    .style('stroke-opacity',1);

var zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on('zoom', zoomed);

var zoombox = complexSVG.append("rect")
    .attr("width", width+padding*2)
    .attr("height", height+padding*2)
    .attr('id','zoomBox')
    .style("fill", "none")
    .style("pointer-events", "none")
    .style('visibility','off')
    .call(zoom);

window.addEventListener('keydown', function (event) {
    if (event.key=='z') {
        if (zoomOn) {
            d3.select('#zoomBox')
                .attr('cursor','auto')
                .style('pointer-events','none')
                .style('visibility','off');
            zoomOn = false;
        } else {
            d3.select('#zoomBox')
                .attr('cursor','move')
                .style('pointer-events','all')
                .style('visibilty','on')
            zoomOn = true;
        }

    }
});

renderGrid();

dataLoader('data/data.json')

createLegends();

function createLegends() {
    createFaceLengend();
    createEdgeLegend();
}

function createEdgeLegend() {
    var edgeLegend = d3.select('#edge_legend');
    edgeLegend.append("g")
        .attr("class", "legendSizeLine")
        .attr("transform", "translate(0, 20)");

    var legendSizeLine = d3.legendSize()
        .scale(edgeWidthScale)
        .shape("line")
        .orient("horizontal").labels(["0.01",
            "0.25", "0.50", "0.75", "1.00"])
        .labelWrap(30)
        .shapeWidth(40)
        .labelAlign("start")
        .shapePadding(10);

    edgeLegend.select(".legendSizeLine")
        .call(legendSizeLine);

    var lines = edgeLegend.selectAll("line");
    lines.attr('stroke', "black")
        .attr('opacity', function (d, i) {
            if (i == 0) {
                return edgeOpacityScale(0.01);
            }
            if (i == 1) {
                return edgeOpacityScale(0.25);
            }
            if (i == 2) {
                return edgeOpacityScale(0.5);
            }
            if (i == 3) {
                return edgeOpacityScale(0.75);
            }
            if (i == 4) {
                return edgeOpacityScale(1);
            }
        });
}

function createFaceLengend() {
    var legend = d3.select("#face_legend").append('g');
    legend.selectAll('*').remove();
    var gradient = legend.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');


    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', start)
        .attr('stop-opacity', 1);
    if(faceColorScale == faceOrangeBlueScale){
        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', tan)
            .attr('stop-opacity', 1);
    }
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', end)
        .attr('stop-opacity', 1);

    legend.append('rect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', '300px')
        .attr('height', '40px')
        .attr("transform", "translate(10,0)")
        .style('fill', 'url(#gradient)');

    var legendScale = d3.scaleLinear()
        .domain([0.01, 1])
        .range([0, 300]);

    var legendAxis = d3.axisBottom(legendScale)
        .tickValues([0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
        .tickFormat(d3.format(".2f"));;

    legend.append("g")
        .attr("class", "legend axis")
        .attr("transform", "translate(10, 40)")
        .call(legendAxis);
}

function changeColorScale(selected){
    switch (selected){
        case "orange" :
            faceColorScale = faceOrangeScale;
            start = lightOrange;
            end = orange;
            break;
        case "green" :
            faceColorScale = faceGreenScale;
            start = lightGreen;
            end = darkGreen;
            break;
        case "gray" :
            faceColorScale = faceGrayScale;
            start = lightGray;
            end = gray;
            break;
        case "blueYellow" :
            faceColorScale = faceBlueYellowScale;
            start = blue;
            end = yellow;
            break;
        case "orangeBlue" :
            faceColorScale = faceOrangeBlueScale;
            start = orange;
            end = blue;
            break;
    }
    renderFaces();
    renderView();
    createFaceLengend();
}


function renderGrid() {

    d3.select('#xlines').remove();
    d3.select('#ylines').remove();

    var xt = xAxis.scale().ticks();

    var xticks = (newxScale) ?
        xt.map( function (d) {
            return newxScale(d) + padding;
        }) :
        xt.map( function (d) {
            return xScale(d) + padding;
        });

    var xlines = complexSVG.append('g')
        .attr('class','grid')
        .attr('id','xlines');


    xlines.selectAll('line').data(xticks)
        .enter().append('line')
        .attr('id','xline')
        .attr('class','grid')
        .attr('x1', function (d) { return d })
        .attr('y1', padding)
        .attr('x2', function (d) { return d })
        .attr('y2', height+padding);

    var yt = yAxis.scale().ticks();

    var yticks = (newyScale) ?
        yt.map( function (d) {
            return newyScale(d) + padding;
        }) :
        yt.map( function (d) {
            return yScale(d) + padding;
        });

    var ylines = complexSVG.append('g')
        .attr('class','grid')
        .attr('id','ylines');


    ylines.selectAll('line').data(yticks)
        .enter().append('line')
        .attr('id','yline')
        .attr('class','grid')
        .attr('y1', function (d) { return d })
        .attr('x1', padding)
        .attr('y2', function (d) { return d })
        .attr('x2', width+padding);
}

function zoomed() {
    complexCanvas.attr("transform", d3.event.transform)
    newxScale = d3.event.transform.rescaleX(xScale);
    newyScale = d3.event.transform.rescaleY(yScale);
    newZscale = d3.event.transform.k;

    linew = 4/newZscale;
    pad = padding/newZscale;

    gX.call(xAxis.scale(newxScale));
    gY.call(yAxis.scale(newyScale));
    if (locationData.length != 0) {
        if (d3.event.sourceEvent.type == 'wheel') {
            d3.select('#complexPoints').selectAll('circle')
                .attr('r', 5 / newZscale);
            d3.select('#complexEdges').selectAll('line')
                .style('stroke-width', 4 / newZscale);
        }
        if (d3.event.sourceEvent.type == 'wheel') {
            renderPoints();
            changeComplex();
        }
    }
    renderGrid();
}

//this function is called whenever the data are changed.

function updateComplex(newValue) {
    complexRadius=+newValue;
    d3.select('#complexRadius').node().value =  complexRadius;
    d3.select('#complexInput').node().value = complexRadius;
    xMin = xScale.domain()[0];
    screenRadius = xScale(complexRadius + xMin);
    d3.select('#complexCircles').selectAll('circle').attr('r',screenRadius);
    d3.select('#complexDataCircle').selectAll('circle').attr('r',screenRadius + dataRadius);
    constructRips();
    changeComplex();
}

//graphical highlighting
function highlightPoint() {

    if ( arguments.length == 3 ) {
        d3.select('#complex_Point_' + arguments[1])
            .transition()
            .style('fill', '#c33');

        //highlight the corresponding coverage circle
        d3.select('#complex_Circle_' + arguments[1])
            .transition()
            .style('fill', '#c33')
            .style('fill-opacity', 0.25);

        // highlight the star of the vertex
        edges = complexType == 'Cech' ? cechEdges : ripsEdges;
        faces = complexType == 'Cech' ? cechFaces : ripsFaces;

        arguments[0].star.edges.forEach(function (d) {
            highlightEdge('#complex_Edge_' + edges[d].Pt1 + '_' + edges[d].Pt2);
        })

        arguments[0].star.faces.forEach(function (d) {
            highlightFace(d,'star');
        })

        arguments[0].link.points.forEach(function (d) {
            highlightPoint(d,'link');
        })

        arguments[0].link.edges.forEach(function (d) {
            highlightEdge('#complex_Edge_'+d[0]+'_'+d[1], 'link')
        })

    } else if (arguments.length == 2 && arguments[1]=='star' ) {
        d3.select('#complex_Point_' + arguments[0])
            .transition()
            .style('fill', '#c33');
    } else {
        d3.select('#complex_Point_' + arguments[0])
            .transition()
            .style('fill', '#00c');
    }

}

function resetPoint() {

    if ( arguments.length == 3 ) { //return point and coverage circle to default view
        d3.select('#complex_Point_' + arguments[1])
            .transition()
            .style('fill', '#9370db');

        if (document.getElementById('coverCheckbox').checked) {
            fillColor = '#9370db';
            fillOpacity = 0.2;
        } else {
            fillColor = '#fff';
            fillOpacity = 0;
        }

        d3.select('#complex_Circle_' + arguments[1])
            .transition()
            .style('fill', fillColor)
            .style('fill-opacity', fillOpacity);

        arguments[0].star.edges.forEach(function (d) {
            resetEdge('#complex_Edge_' + edges[d].Pt1 + '_' + edges[d].Pt2);
        })

        arguments[0].star.faces.forEach(function (d) {
            resetFace(d);
        })

        arguments[0].link.points.forEach(function (d) {
            resetPoint(d);
        })

        arguments[0].link.edges.forEach(function (d) {
            resetEdge('#complex_Edge_'+d[0]+'_'+d[1])
        })

    } else {
        d3.select('#complex_Point_' + arguments[0])
            .transition()
            .style('fill', '#9370db');

    }
}

//highlight edge and corresponding points
function highlightEdge() {

    var data;

    if (arguments.length == 3) {
        data = arguments[0]
        d3.select(this)
            .transition()
            .style('stroke','#c33');
        highlightPoint(data.Pt1, 'star');
        highlightPoint(data.Pt2, 'star');
    } else if (arguments.length == 2) {
        d3.select(arguments[0])
            .transition()
            .style('stroke','#00c');
    } else {
        d3.select(arguments[0])
            .transition()
            .style('stroke','#c33');
    }


}

//restore default view
function resetEdge() {

    var data;

    if (arguments.length == 3) {
        edge = d3.select(this)
        data = arguments[0]
        resetPoint(data.Pt1);
        resetPoint(data.Pt2);
        edge.transition()
            .style('stroke', "black")
            .style('opacity', edgeOpacityScale(arguments[0].Pedge));
    } else {
        edge = d3.select(arguments[0]);
        var points = arguments[0].replace(/#complex_Edge_/, '');
        for (i = 0; i < ripsEdges.length; i++){
            var possibleEdge = ripsEdges[i];
            if(points == possibleEdge.Pt1 + "_" + possibleEdge.Pt2){
                edge.transition()
                    .style('stroke', "black")
                    .style('opacity', edgeOpacityScale(possibleEdge.Pedge));
                return;
            }
        }


    }

}

//highlight faces
function highlightFace() {


    if ( arguments.length == 3) {
        d3.select(this)
            .transition()
            .style('fill','#c33');

        //highlight corresponding edges
        highlightEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
        highlightEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
        highlightEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

        //highlight corresponding points
        highlightPoint([], arguments[0].Pt1);
        highlightPoint([], arguments[0].Pt2);
        highlightPoint([], arguments[0].Pt3);
    } else {
        faces = complexType == 'Cech' ? cechFaces : ripsFaces;


        d3.selection.prototype.moveToFront = function() {
            return this.each(function(){
                this.parentNode.appendChild(this);
            });
        };

        faceColor = arguments[1] == 'link' ? '#00c' : '#fcc'

        d3.select('#complex_Face_'+faces[arguments[0]].Pt1+'_'+faces[arguments[0]].Pt2+'_'+faces[arguments[0]].Pt3)
            .transition()
            .style('fill', faceColor)
            .attr('opacity', 1);

        d3.select('#complex_Face_'+faces[arguments[0]].Pt1+'_'+faces[arguments[0]].Pt2+'_'+faces[arguments[0]].Pt3)
            .moveToFront();

    }


}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

//reset to default view
function resetFace() {

    if ( arguments.length > 1) {
        d3.select(this)
            .transition()
            .attr('opacity', faceOpacityScale(arguments[0].Pface))
            .style('fill', faceColorScale(arguments[0].Pface));

        resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
        resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
        resetEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

        resetPoint([], arguments[0].Pt1);
        resetPoint([], arguments[0].Pt2);
        resetPoint([], arguments[0].Pt3);
    } else {
        faces = complexType == 'Cech' ? cechFaces : ripsFaces;
        d3.select('#complex_Face_'+faces[arguments[0]].Pt1+'_'+faces[arguments[0]].Pt2+'_'+faces[arguments[0]].Pt3)
            .transition()
            .attr('opacity', faceOpacityScale(faces[arguments[0]].Pface))
            .style('fill', faceColorScale(faces[arguments[0]].Pface));

        faces.forEach( function (d) {
            d3.select('#complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3)
                .moveToFront()
        })
    }

}

//construct the Cech complex
function constructCech() {

    cechEdges = ripsEdges.slice();
    tempFaces = ripsFaces.slice();
    cechFaces = [];

    var sqDist;
    //calculate the squared diameter to compare each pair to. Use square diameter to compare to squared euclidean distanct
    //of each pair so save computation.
    sqDiameter = 4 * Math.pow(complexRadius, 2);

    tempFaces.forEach( function(d, i) {
        d.Pface = 0;
        count = 0;
        for (j=0; j<d.allFaces.length; j++) {
            x1 = locationData[d.Pt1].points[d.allFaces[j][0]].x;
            y1 = locationData[d.Pt1].points[d.allFaces[j][0]].y;
            x2 = locationData[d.Pt2].points[d.allFaces[j][1]].x;
            y2 = locationData[d.Pt2].points[d.allFaces[j][1]].y;
            x3 = locationData[d.Pt3].points[d.allFaces[j][2]].x;
            y3 = locationData[d.Pt3].points[d.allFaces[j][2]].y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            d23 = sqEuclidDist([x2, y2], [x3, y3]);
            d13 = sqEuclidDist([x1, y1], [x3, y3]);

            //determine longest edge
            if (d12 >= d13 && d12 >= d23) {
                xc = (x2 + x1) / 2;
                yc = (y2 + y1) / 2;
                dist = Math.sqrt(sqEuclidDist([x3, y3], [xc, yc]));
                testRadius = Math.sqrt(d12) / 2;
            } else if (d13 >= d12 && d13 >= d23) {
                xc = (x3 + x1) / 2;
                yc = (y3 + y1) / 2;
                dist = Math.sqrt(sqEuclidDist([x2, y2], [xc, yc]));
                testRadius = Math.sqrt(d13) / 2;
            } else {
                xc = (x3 + x2) / 2;
                yc = (y3 + y2) / 2;
                dist = Math.sqrt(sqEuclidDist([x1, y1], [xc, yc]));
                testRadius = Math.sqrt(d23) / 2;
            }

            if (dist <= testRadius) {
                //determine if third point is within circumcircle of longest edge
                count++
            } else {
                //otherwise determine if circumcircle radius is smaller than the coverage radius
                a = Math.sqrt(d12);
                b = Math.sqrt(d13);
                c = Math.sqrt(d23);
                testRadius = (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (a + c - b) * (a + b - c));
                if (testRadius <= complexRadius) {
                    count++
                }
            }
        }
        p = count/Math.pow(numPoints,3);
        if (p > 0) {
            d.Pface = p;
            cechFaces.push(d)
        }
    })


}

function constructEdges() {

    var sqDiameter = 4 * Math.pow(complexRadius, 2);
    var sqDiameterMin = 4 * Math.pow(complexRadius-dataRadius, 2);
    var sqDiameterMax = 4 * Math.pow(complexRadius+dataRadius, 2);
    var edgeProb = [];
    var tempEdges = [];
    var count, p, pFlag;

    locationData.forEach( function (d) {
        d.star = {edges: [], faces: []};
        d.link = {points: [], edges: []}
    })


    for (i = 0; i < numSamples - 1; i++) {
        x1 = locationData[i].anchor.x;
        y1 = locationData[i].anchor.y;
        edgeProb.push([0]);
        for (j = i + 1; j < numSamples; j++) {
            x2 = locationData[j].anchor.x;
            y2 = locationData[j].anchor.y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameterMin) {
                edgeProb[i].push({p: 1, edgeInd: tempEdges.length})
                locationData[i].star.edges.push(tempEdges.length)
                locationData[i].link.points.push([j])
                locationData[j].star.edges.push(tempEdges.length)
                locationData[j].link.points.push([i])
                tempEdges.push({Pt1: i, Pt2: j, Pedge: 1})
            } else if (d12 > sqDiameterMax){
                edgeProb[i].push({p: 0})
            } else {
                count = 0;
                pFlag = [];
                iEdges = [];
                for (m=0; m<numPoints; m++) {
                    x1 = locationData[i].points[m].x;
                    y1 = locationData[i].points[m].y;
                    for (n=0; n<numPoints; n++) {
                        x2 = locationData[j].points[n].x;
                        y2 = locationData[j].points[n].y;
                        d12 = sqEuclidDist([x1, y1],[x2,y2]);
                        if (d12 <= sqDiameter) {
                            count++
                            pFlag.push(true)
                            iEdges.push({Pt1: m, Pt2: n})
                        } else {
                            pFlag.push(false)
                        }
                    }
                }
                p = count/(numPoints*numPoints);
                edgeProb[i].push({p: p, pFlag: pFlag, edgeInd: tempEdges.length})
                if (p>0) {
                    locationData[i].star.edges.push(tempEdges.length)
                    locationData[i].link.points.push([j])
                    locationData[j].star.edges.push(tempEdges.length)
                    locationData[j].link.points.push([i])
                    tempEdges.push({Pt1: i, Pt2: j, Pedge: p, iEdges: iEdges})
                }
            }
        }
    }



    //Put all individual edges into a single structure for easier access.
    allEdges = [];
    tempEdges.forEach( function(d) {
        if (d.Pedge == 1) {
            for (i=0; i<numPoints; i++) {
                for (j=0; j<numPoints; j++) {
                    x1 = locationData[d.Pt1].points[i].x;
                    y1 = locationData[d.Pt1].points[i].y;
                    x2 = locationData[d.Pt2].points[j].x;
                    y2 = locationData[d.Pt2].points[j].y;
                    allEdges.push({x1: x1, y1: y1, x2: x2, y2: y2})
                }
            }
        } else {
            for (i=0; i<d.iEdges.length; i++) {
                x1 = locationData[d.Pt1].points[d.iEdges[i].Pt1].x;
                y1 = locationData[d.Pt1].points[d.iEdges[i].Pt1].y;
                x2 = locationData[d.Pt2].points[d.iEdges[i].Pt2].x;
                y2 = locationData[d.Pt2].points[d.iEdges[i].Pt2].y;
                allEdges.push({x1: x1, y1: y1, x2: x2, y2: y2})
            }
        }
    })

    return {edges: tempEdges, edgeProb: edgeProb}

}

function constructRips() {

    tempFaces = [];
    ripsFaces = [];
    var tmp = constructEdges();
    ripsEdges = tmp.edges.slice();
    var edgeProb = tmp.edgeProb.slice();


    for (i=0; i<numSamples-2; i++) {
        for (j=i+1; j<numSamples-1; j++) {
            if (edgeProb[i][j-i].p > 0) {
                for (k=j+1; k<numSamples; k++) {
                    if (edgeProb[j][k-j].p == 1 && edgeProb[i][k-i].p == 1 && edgeProb[i][j-i].p == 1){
                        tempFaces.push({Pt1: i, Pt2: j, Pt3: k, Pface: 1})
                    } else if (edgeProb[j][k-j].p > 0 && edgeProb[i][k-i].p > 0){
                        tempFaces.push({Pt1: i, Pt2: j, Pt3: k, p12: edgeProb[i][j-i], p13: edgeProb[i][k-i], p23: edgeProb[j][k-j],  Pface: 0})
                    }
                }
            }
        }
    }

    tempFaces.forEach( function (d) {
        count = 0;
        allFaces = [];
        for (i=0; i<numPoints; i++) {
            for (j=0; j<numPoints; j++) {
                for (k=0; k<numPoints; k++) {
                    isEdge = [true, true, true];
                    if (d.Pface == 0) {
                        if (d.p12.p < 1) {
                            isEdge[0] = d.p12.pFlag[i * numPoints + j] ? true : false;
                        }
                        if (d.p13.p < 1) {
                            isEdge[1] = d.p13.pFlag[i * numPoints + k] ? true : false;
                        }
                        if (d.p23.p < 1) {
                            isEdge[2] = d.p23.pFlag[j * numPoints + k] ? true : false;
                        }
                    }
                    if (isEdge[0] && isEdge[1] && isEdge[2]) {
                        allFaces.push([i, j, k])
                        count++
                    }
                }
            }
        }
        p = count/Math.pow(numPoints,3);
        if (p>0) {
            d.Pface = p;
            d.allFaces = allFaces;
            ripsFaces.push(d)
        }

    })

    constructCech();

}


function renderComplex(edges,faces) {

    if (edges.length==0) {
        constructRips()
        if (complexType=='Cech') {
            edges = cechEdges
            faces = cechFaces
        } else if (complexType=='Vietoris-Rips') {
            edges = ripsEdges;
            faces = ripsFaces;
        }
    };

    // edges.forEach( function (d,i) {
    //     d.star = {points: [], faces: []};
    //     d.link = {points: [], edges: [], faces: []}
    //     t = locationData[d.Pt1].star.faces.forEach( function (e) {
    //         var testArray = [faces[e].Pt1, faces[e].Pt2, faces[e].Pt3];
    //         if (testArray.indexOf(d.Pt2) != -1) {
    //             d.star.faces.push(e)
    //         } else {
    //             d.link.faces.push(e)
    //         }
    //         return
    //     })
    //
    //     locationData[d.Pt2].star.faces.forEach( function (e) {
    //         if (d.star.faces.indexOf(e) == -1 && d.link.faces.indexOf(e) == -1) {
    //             d.link.faces.push(e)
    //         }
    //     })
    // })


    //remove existing canvas elements
    complexCanvas.selectAll('.edge').remove();
    var complexEdges = complexCanvas.append('g')
        .attr('id','complexEdges')
        .attr('class', 'edge')
        .style('visibility','hidden');

    complexCanvas.select('#complexFaces').remove();
    complexCanvas.append('g')
        .attr('id','complexFaces')
        .style('visibility','hidden');
    renderFaces();


//render faces, give each an id with corresponding vertex indices. This makes it easier to find and highlight the corresponding
    //points and edges, do the same for each edge. Start with everything hidden then render view according to what the user
    //has selected

    complexEdges.selectAll('line').data(edges)
        .enter().append('line')
        .attr('class', 'edge')
        .style('stroke-width', function(d){
            return edgeWidthScale(d.Pedge)/newZscale;
        })
        .attr('x1', function (d) {
            return xScale(locationData[d.Pt1].anchor.x) + pad;
        })
        .attr('y1', function (d) {
            return yScale(locationData[d.Pt1].anchor.y) + pad;
        })
        .attr('x2', function (d) {
            return xScale(locationData[d.Pt2].anchor.x) + pad;
        })
        .attr('y2', function (d) {
            return yScale(locationData[d.Pt2].anchor.y) + pad;
        })
        .attr('id', function (d) {
            return 'complex_Edge_'+d.Pt1+'_'+d.Pt2;
        })
        .attr('stroke', 'black')
        .attr('opacity', function (d) {
            return edgeOpacityScale(d.Pedge);
        })
        .on('mouseover', highlightEdge)
        .on('mouseout', resetEdge);


    //Make sure points stay on top
    pts = d3.select('#complexPoints').node();
    pts.parentNode.appendChild(pts);

    renderAllEdges();
    renderView();


}

function renderFaces(){
    var faces;
    if (complexType=='Cech') {
        faces = cechFaces;
    } else if (complexType=='Vietoris-Rips') {
        faces = ripsFaces;
    }
    faces.sort( function (a, b) { return a.Pface - b.Pface } )
    faces.forEach( function (d, i) {
        locationData[d.Pt1].link.edges.push([d.Pt2, d.Pt3])
        locationData[d.Pt1].star.faces.push(i)
        locationData[d.Pt2].link.edges.push([d.Pt1, d.Pt3])
        locationData[d.Pt2].star.faces.push(i)
        locationData[d.Pt3].link.edges.push([d.Pt1, d.Pt2])
        locationData[d.Pt3].star.faces.push(i)
    })

    complexCanvas.selectAll('.face').remove();
    var complexFaces = complexCanvas.select('g#complexFaces');
    complexFaces.selectAll('polygon').data(faces)
        .enter().append('polygon')
        .attr('class','face')
        .attr('points',function (d, i) {
                return  (xScale(locationData[d.Pt1].anchor.x)+padding/newZscale)+','+(yScale(locationData[d.Pt1].anchor.y)+padding/newZscale)+
                    ' '+(xScale(locationData[d.Pt2].anchor.x)+padding/newZscale)+','+(yScale(locationData[d.Pt2].anchor.y)+padding/newZscale)+
                    ' '+(xScale(locationData[d.Pt3].anchor.x)+padding/newZscale)+','+(yScale(locationData[d.Pt3].anchor.y)+padding/newZscale);
            }
        )
        .attr('id', function (d, i) {
            return 'complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3;
        })
        .attr('opacity', function(d){
            return faceOpacityScale(d.Pface);
        })
        .attr('fill', function (d) {
            return faceColorScale(d.Pface);
        })
        .on('mouseover',highlightFace)
        .on('mouseout', resetFace);
}

function renderAllEdges(){
    complexCanvas.selectAll('#allEdges').remove();
    var allEdgesGroup = complexCanvas.append('g')
        .attr('id','allEdges')
        .attr('class', 'all_edges');
    allEdgesGroup.selectAll('line').data(allEdges)
        .enter().append('line')
        .attr('class', 'individual_edge')
        .attr('x1', function (d) {
            return xScale(d.x1) + pad;
        })
        .attr('y1', function (d) {
            return yScale(d.y1) + pad;
        })
        .attr('x2', function (d) {
            return xScale(d.x2) + pad;
        })
        .attr('y2', function (d) {
            return yScale(d.y2) + pad;
        })
        .attr('id', function (d) {
            return 'complex_individual_Edge_'+d.x1+'_'+d.x2+d.y1+'_'+d.y2;
        })
        .attr('stroke', 'black')
        .attr('opacity', function (d) {
            return edgeOpacityScale(d.Pedge);
        })
        .on('mouseover', highlightEdge)
        .on('mouseout', resetEdge);
}

function renderPoints() {

    //render each point and coverage circle. The id simply corresponds to its index within locationData

    complexCanvas.selectAll('.circle').remove();
    complexCanvas.selectAll('.point').remove();
    var complexCircles = complexCanvas.append('g')
        .attr('class','circle')
        .attr('id','complexCircles')
    var complexPoints = complexCanvas.append('g')
        .attr('class', 'point')
        .attr('id','complexPoints');
    var complexAndDataCircle = complexCanvas.append('g')
        .attr('class', 'circle')
        .attr('id', 'complexDataCircle');

    var pts = complexPoints.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .style('visibility','hidden')
        .attr('class', 'point')
        .attr('cx', function (d) {
            if (newxScale && newyScale) {
                return xScale(d.anchor.x) + padding/newZscale;
            }
            else {
                return xScale(d.anchor.x) + padding;
            }
        })
        .attr('cy', function (d) {
            if (newxScale && newyScale) {
                return yScale(d.anchor.y) + padding/newZscale;
            }
            else {
                return yScale(d.anchor.y) + padding / newZscale;
            }
        })
        .attr('id', function (d, i) {
            return 'complex_Point_' + i.toString();
        })
        .attr('r', xScale(dataRadius + xScale.domain()[0]))
        .on('click', selectNode)
        .on('mouseover', highlightPoint)
        .on('mouseout', resetPoint)
        .call(d3.drag()
            .on('drag', dragNode)
            .on('end', dragEnd))
        .each(function(d, j){
            complexPoints.selectAll('small_circle').data(d.points)
                .enter()
                .append('circle')
                .attr('class', 'small_circle')
                .attr('cx', function (d) {
                    if (newxScale && newyScale) {
                        return xScale(d.x) + padding/newZscale;
                    }
                    else {
                        return xScale(d.x) + padding;
                    }
                })
                .attr('cy', function (d) {
                    if (newxScale && newyScale) {
                        return yScale(d.y) + padding/newZscale;
                    }
                    else {
                        return yScale(d.y) + padding / newZscale;
                    }
                })
                .attr('id', function (d, i) {5
                    return 'complex_small_Point_' + j.toString() + '_' + i.toString();
                })
                .attr('r', 2/newZscale);
        });

    complexCircles.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .style('visibility','hidden')
        .attr('class', 'circle')
        .attr('cx', function (d) {
            return xScale(d.anchor.x) + padding/newZscale;
        })
        .attr('cy', function (d) {
            return yScale(d.anchor.y) + padding/newZscale;
        })
        .attr('id', function (d, i) {
            return 'complex_Circle_' + i.toString();
        })
        .attr('r', xScale(complexRadius + xScale.domain()[0]));



    complexAndDataCircle.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .attr('class', 'circle')
        .attr('cx', function (d) {
            return xScale(d.anchor.x) + padding/newZscale;
        })
        .attr('cy', function (d) {
            return yScale(d.anchor.y) + padding/newZscale;
        })
        .attr('id', function (d, i) {
            return 'data_Circle_' + i.toString();
        })
        .attr('fill', '#9370db')
        .attr('fill-opacity', 0.1)
        .attr('r', xScale(dataRadius + complexRadius + xScale.domain()[0]));

    r = xScale(dataRadius + xScale.domain()[0])+5;
    textOffset = -r * Math.cos( 3*Math.PI/4 );

    complexPoints.selectAll('text')
        .data(locationData)
        .enter().append('text')
        .text( function (d, i) {
            return i.toString();
        })
        .attr('x', function (d) {
            return xScale(d.anchor.x) + padding/newZscale;
        })
        .attr('y', function (d) {
            return yScale(d.anchor.y) + padding/newZscale;
        })
        .attr('dx',textOffset)
        .attr('dy',textOffset);

    renderView()

}

function renderView() {
    //query the various view options toggle visibility of each "g" element accordingly
    f = document.getElementById('coverCheckbox');
    showCoverage(f.checked);
    f = document.getElementById('nodeCheckbox');
    show(f.checked,'.small_circle');
    f = document.getElementById('nodeRadiusCheckbox');
    show(f.checked,'.point');
    f = document.getElementById('edgeCheckbox');
    show(f.checked,'.edge');
    f = document.getElementById('allEdgeCheckbox');
    show(f.checked,'.individual_edge');
    f = document.getElementById('faceCheckbox');
    show(f.checked,'.face');
}

function updateScales(xMin, yMin, dataRange){
    var aspectMin = Math.min(width, height);
    var aspect, yScaleMax, xScaleMax;
    var dataPadding = 0.1*dataRange;
    if(aspectMin == height){
        aspect = width / height;
        yScaleMax = yMin+dataRange;
        xScaleMax = yScaleMax * aspect;
        xScale.domain([xMin-dataPadding, xScaleMax + dataPadding]);
        yScale.domain([yMin-dataPadding, yScaleMax + dataPadding]);
    } else {
        aspect = height / width;
        xScaleMax = xMin+dataRange;
        yScaleMax = xScaleMax * aspect;
        xScale.domain([xMin-dataPadding, xScaleMax + dataPadding]);
        yScale.domain([yMin-dataPadding, yScaleMax + dataPadding]);
    }

}


function importData() {

    //allow user to select file
    var selectedFile = document.getElementById('fileSelector');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function(event) {

        d3.csv(event.target.result, function (csv) {

            //read data into locationData array and update number of samples
            locationData = [];
            csv.forEach(function (d) {

                // Convert numeric values to 'numbers'
                locationData.push({anchor: {x: +d.xf, y: +d.yf} });
            });
            numSamples = locationData.length;
            perturbData();

            //set data scale
            xMin = d3.min(locationData.map( function (d) {
                return d.anchor.x;
            }));
            xMax = d3.max(locationData.map( function (d) {
                return d.anchor.x;
            }));
            xRange = xMax-xMin;
            yMin = d3.min(locationData.map( function (d) {
                return d.anchor.y;
            }));
            yMax = d3.max(locationData.map( function (d) {
                return d.anchor.y;
            }));
            yRange = yMax-yMin;

            dataRange = d3.max([xRange, yRange]);
            updateScales(xMin, yMin, dataRange);

            d3.select('#complexInput')
                .attr('min', 0.05*dataRange)
                .attr('max', 0.5*dataRange)
                .attr('value', 0.2*dataRange);



            complexCanvas.attr("transform", d3.zoomIdentity)
            newxScale = false;
            newyScale = false;
            newZscale = 1;

            gX.call(xAxis.scale(xScale));
            gY.call(yAxis.scale(yScale));
            renderGrid()

            //reset to default view and calculate complexes
            resetCheckboxes();
            renderPoints();
            updateComplex(document.getElementById('complexInput').value);
        });
    }
}

function resetCheckboxes(){
    c = document.getElementById('coverCheckbox');
    c.disabled = false;
    c.checked = true;
    r = document.getElementById('nodeRadiusCheckbox');
    r.disabled = false;
    r.checked = true;
    n = document.getElementById('nodeCheckbox');
    n.disabled = false;
    n.checked = true;
    document.getElementById('edgeCheckbox').disabled = 0;
    document.getElementById('faceCheckbox').disabled = 0;
}

function randomData() {
//generate uniform random data points

    var xd = (newxScale) ? newxScale.domain() : xScale.domain();
    var xmin = xd[0] + 0.1*(xd[1]-xd[0]);
    var xmax = xd[1] - 0.1*(xd[1]-xd[0]);

    var yd = (newyScale) ? newyScale.domain() : yScale.domain();
    var ymin = yd[0] + 0.1*(yd[1]-yd[0]);
    var ymax = yd[1] - 0.1*(yd[1]-yd[0]);


    numSamples = +document.getElementById('numSensors').value;

    locationData = [];

    for (i=0; i<numSamples; i++) {
        var xi = Math.random() * (xmax - xmin + 1)  + xmin;
        var yi = Math.random() * (ymax - ymin + 1)  + ymin;
        locationData.push({ anchor: {x: xi, y: yi}});
    };

    perturbData();

    dataRange = d3.max([xd[1]-xd[0], yd[1]-yd[0]]);
    dataPadding = 0.1*dataRange;

    d3.select('#complexInput')
        .attr('min', 0.05*dataRange)
        .attr('max', 0.5*dataRange)
        .attr('value', 0.2*dataRange);

    resetCheckboxes();

    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

function saveData() {

    var data = {n: numSamples, k: numPoints, r: complexRadius, eps: dataRadius, sensors: locationData,
                cechComplex: [cechEdges, cechFaces], ripsComplex: [ripsEdges, ripsFaces]};
    var tempData = JSON.stringify(data, null, 2);


    var blob = new Blob([tempData], { type: 'text/plain;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}


function loadData() {

    //allow user to select file
    var selectedFile = document.getElementById('openButton');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function(event) {
        dataLoader(event.target.result)
    }

}

function dataLoader(file){
    d3.json(file, function(data) {


        dataRadius = data.eps;
        numPoints = data.k;
        numSamples = data.n;
        complexRadius = data.r;
        locationData = data.sensors;
        ripsEdges = data.ripsComplex[0];
        ripsFaces = data.ripsComplex[1];
        cechEdges = data.cechComplex[0];
        cechFaces = data.cechComplex[1];


        //set data scale
        var xMin = d3.min(locationData.map( function (d) {
            return d.anchor.x;
        }));
        var xMax = d3.max(locationData.map( function (d) {
            return d.anchor.x;
        }));
        var xRange = xMax-xMin;
        var yMin = d3.min(locationData.map( function (d) {
            return d.anchor.y;
        }));
        var yMax = d3.max(locationData.map( function (d) {
            return d.anchor.y;
        }));
        var yRange = yMax-yMin;

        var dataRange = d3.max([xRange, yRange]);
        var rmax = d3.max([complexRadius, Math.ceil(0.5*dataRange)]);

        updateScales(xMin, yMin, dataRange);

        complexCanvas.attr("transform", d3.zoomIdentity)
        newxScale = false;
        newyScale = false;
        newZscale = 1;

        gX.call(xAxis.scale(xScale));
        gY.call(yAxis.scale(yScale));
        renderGrid()

        //adjust radius slider
        d3.select('#complexInput')
            .attr('min', 1)
            .attr('max', rmax);
        d3.select('#complexInput').node().value = complexRadius;
        d3.select('#complexRadius')
            .attr('min', 1)
            .attr('max', rmax);
        d3.select('#complexRadius').attr('value',complexRadius)

        resetCheckboxes();

        addSampleSensors();

    })

}

function changeNumberSampleSensors(){
    var numSamplesSensors = parseInt(document.getElementById('numSampleSensors').value);
    if(numPoints != numSamplesSensors) {
        numPoints = +numSamplesSensors;
    }
    perturbData();
    addSampleSensors();
}

function changeDataRadius(val){
    dataRadius = parseInt(val);
    d3.select('#complexRadiusInput').node().value =  dataRadius;
    d3.select('#complexDataRadius').node().value = dataRadius;
    if(dataRadius < originalDataRadius) {
        perturbData();
        originalDataRadius = dataRadius;
        addSampleSensors();
    } else {
        d3.select('#complexDataCircle').selectAll('circle')
            .attr('r', xScale(dataRadius + complexRadius + xScale.domain()[0]));
        d3.select('#complexPoints').selectAll('.point')
            .attr('r', xScale(dataRadius + xScale.domain()[0]));

    }
}

function addSampleSensors(){

    renderPoints();

    if (complexType=='Cech') {
        constructCech();
    } else if (complexType=='Vietoris-Rips') {
        constructRips();
    }
    changeComplex();
}

function perturbData() {

    var r, theta, xj, yj, tmp;

    if (arguments.length == 0) {
    locationData.forEach( function (d) {
        tmp = [];
        for (j=0; j<numPoints; j++) {
            r = Math.random() * dataRadius;
            theta = Math.random() * 2 * Math.PI;
            xj = d.anchor.x + Math.floor( r * Math.cos(theta));
            yj = d.anchor.y + Math.floor( r * Math.sin(theta));
            tmp.push( { x: xj, y: yj} )
        }
        d.points = tmp;
    })} else {
        data = arguments[0]
        tmp = [];
        for (j=0; j<numPoints; j++){
            r = Math.random() * dataRadius;
            theta = Math.random() * 2 * Math.PI;
            xj = data.anchor.x + Math.floor(r * Math.cos(theta));
            yj = data.anchor.y + Math.floor(r * Math.sin(theta));
            tmp.push( { x: xj, y: yj} )
        }
        data.points = tmp;
    }

}

function changeComplex() {

    d = document.getElementsByName('complexType');
    if (d[0].checked) {
        console.log('here')
        complexType = 'Cech'
        renderComplex(cechEdges, cechFaces);
    } else {
        complexType = 'Vietoris-Rips'
        renderComplex(ripsEdges, ripsFaces);
    }
}

function addNode() {

    complexSVG.attr('cursor','crosshair')
        .on('click',function () {
            coords = d3.mouse(d3.select('#complexSVG').node());
            updateNode(coords);
        });

    window.addEventListener('keydown', function(event) {
        if (event.code=='Escape') {
            complexSVG.attr('cursor', null)
                .on('click', null);
        }
    });
}

function updateNode(coords) {
    console.log("update radius:"+complexRadius)

    if (locationData.length==0) {
        resetCheckboxes();
    };

    i = locationData.length;
    var x,y;
    if (newxScale && newyScale) {
        x = newxScale.invert(coords[0] - padding);
        y = newyScale.invert(coords[1] - padding);
    } else {
        x = xScale.invert(coords[0] - padding);
        y = yScale.invert(coords[1] - padding);
    };


    var newPoint = {anchor: {x: x, y: y}};
    newpoint = perturbData(newPoint)
    locationData.push(newPoint);
    numSamples++;
    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

// function updateLocation(coords) {
//     locationData[selectedNode].anchor.x = coords[0];
//     locationData[selectedNode].anchor.y = coords[1];
//     updateCech(document.getElementById('complexInput').value);
//     window.addEventListener('keypress', function (evt) {
//         complexCanvas.attr('cursor',null)
//             .on('click',null);
//     });
// }

function myMap() {
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(40.762,-111.839),
        zoom: 16
    };
    var map = new google.maps.Map(mapCanvas, mapOptions);
}

function showCoverage(d) {
    if (d) {
        fillColor = '#9370db';
        fillOpacity = '0.1';
        d3.select('#complexCircles').selectAll('circle')
            .transition()
            .style('visibility','visible')
            .style('fill', fillColor)
            .style('fill-opacity', 0.2);
        d3.select('#complexDataCircle').selectAll('circle')
            .transition()
            .style('visibility','visible')
            .style('fill', fillColor)
            .style('fill-opacity', 0.1);
    } else {
        d3.select('#complexCircles').selectAll('circle')
            .transition()
            .style('fill', 'none');
        d3.select('#complexDataCircle').selectAll('circle')
            .transition()
            .style('fill', 'none');
    }
}

function show(state, type) {
    if (state) {str='visible'} else {str='hidden'};
    complexCanvas.selectAll(type)
        .style('visibility', str);
}

function dragNode() {
    coords = d3.mouse(this)
    i = this.id.match(/\d+/g);
    str = '#complex_Circle_'+i;

    dx = locationData[i].anchor.x - coords[0];
    dy = locationData[i].anchor.y - coords[1];


    d3.selectAll(".small_circle").filter( function () {
        var re = new RegExp('complex_small_Point_'+i+'_\d*');
        return re.test(this.id)
    })
        .attr('cx', function(d) {
            return d.x - dx
        })
        .attr('cy', function(d) {
            return d.y - dy
        })




    d3.select(str)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);
    d3.select(this)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);

    wasDragged = true;
}

function dragEnd() {
    if (wasDragged) {
        coords = d3.mouse(d3.select('#complexSVG').node());
        i = this.id.match(/\d+/g);
        var x,y;
        if (newxScale && newyScale) {
            x = newxScale.invert(coords[0] - padding);
            y = newyScale.invert(coords[1] - padding);
        } else {
            x = xScale.invert(coords[0] - padding);
            y = yScale.invert(coords[1] - padding);
        };


        dx = locationData[i].anchor.x - x;
        dy = locationData[i].anchor.y - y;

        locationData[i].anchor.x = x;
        locationData[i].anchor.y = y;

        locationData[i].points.forEach( function (d) {
            d.x = d.x - dx;
            d.y = d.y - dy;
        })

        renderPoints();
        updateComplex(document.getElementById('complexInput').value);
    }
    wasDragged = false;
    for (i=0; i<selectedNodes.length; i++) {
        highlightPoint([],selectedNodes[i])
    }
}

function selectNode() {
    if (d3.event.defaultPrevented) {
        return;
    }
    i = +this.id.match(/\d+/g);

    selectedNodes.push(i);
    highlightPoint([],i);

    d3.select('#complex_Point_'+i)
        .on('mouseover',null)
        .on('mouseout',null)
        .on('click',null);


    highlightPoint([],i);

    if (selectedNodes.length==1) {
        window.addEventListener('keydown', nodeSelector);
    }
}

function nodeSelector() {
    if (event.code=='Delete' || event.code=='Backspace') {
        console.log(event.code)
        window.removeEventListener('keydown', nodeSelector)
        selectedNodes = selectedNodes.sort(function(a, b){return a-b});
        for (j = 0; j < selectedNodes.length; j++) {
            locationData.splice(selectedNodes[j]-j, 1);
        }
        numSamples = locationData.length;
        selectedNodes = [];
        renderPoints();
        updateComplex(document.getElementById('complexInput').value);
    } else if (event.code == 'Escape') {
        window.removeEventListener('keydown', nodeSelector)
        selectedNodes = [];
        renderPoints();
        changeComplex();
    }

}

function sqEuclidDist(pt1, pt2) {
    return Math.pow(pt2[0]-pt1[0],2) + Math.pow(pt2[1]-pt1[1],2);
}

function clearScreen() {
    complexCanvas.selectAll('.face').remove();
    complexCanvas.selectAll('.edge').remove();
    complexCanvas.selectAll('.circle').remove();
    complexCanvas.selectAll('.point').remove();
    locationData = [];
    selectedNodes = [];
    newZscale = 1;
    updateScales(0,0,0);
    gX.call(xAxis.scale(xScale));
    gY.call(yAxis.scale(yScale));
    newxScale = false;
    newyScale = false;
    renderGrid();

    complexRadius = 10;
    numSamples = 0;

    d3.select('#complexInput')
        .attr('min', 1)
        .attr('max', 50);
    d3.select('#complexInput').node().value = complexRadius;
    document.getElementById('complexRadius').innerHTML = complexRadius.toString();
}

function setMax() {

    var rmax = d3.select('#complexInput').node().max.toString();
    var maxval = prompt('Enter maximum radius value',rmax)
    d3.select('#complexInput').attr('max', maxval);
    d3.select('#complexRadius').attr('max', maxval);
}