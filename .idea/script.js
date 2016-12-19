/**
 * @method constructCech
 * @param {String} foo Argument 1
 * @param {Object} config A config object
 * @param {String} config.name The name on the config object
 * @param {Function} config.callback A callback function on the config object
 * @param {Boolean} [extra=false] Do extra, optional work
 * @return {Boolean} Returns true on success
 * Created by Tim on 11/10/2016.
 */
<!-- Common variables and functions used by all of the example plots -->
var width = 800;          //Width of each plot
var height = 600;         //Height of each plot
var buffer = 50;          //Buffer space to ensure points are adequately
                          // far from the edge of the plot
// var dataScale = d3.scaleLinear()
//     .domain([0,300])
//     .range([0,600]);


//Initialize the data
var filename = 'data.csv';
var locationData;
var xp=[];
var yp=[];
var complexType = 'cech';

var cechFaces = [];
var cechEdges = [];
var ripsFaces = [];
var ripsEdges = [];

var numSamples;      //Number of points to use
var complexRadius = 100;          //epsilon ball radius
// complexRadius = dataScale(complexRadius);

//background grid information
var cellSize = 50;
var gridWidth = Math.ceil(width / cellSize);
var gridHeight = Math.ceil(height / cellSize);
var grid = new Array(gridWidth * gridHeight);
var wasDragged = false;


//this function is called whenever the data are changed.

function updateComplex(newValue) {
    document.getElementById('complexRadius').innerHTML=newValue;
    complexRadius=newValue;
    d3.select('#complexCircles').selectAll('circle').attr('r',newValue)
    constructCech();
    constructRips();
    changeComplex();
}

//graphical highlighting
function highlightPoint() {

    d3.select('#complex_Point_'+arguments[1])
        .transition()
        .style('fill','#c33');

    //highlight the corresponding coverage circle
    d3.select('#complex_Circle_'+arguments[1])
        .transition()
        .style('fill', '#c33')
        .style('fill-opacity', 0.25)
        .style('stroke', '#c33')
        .style('stroke-opacity', 1);
}

function resetPoint() {

    //return point and coverage circle to default view
    d3.select('#complex_Point_'+arguments[1])
        .transition()
        .style('fill','#000');

    if (document.getElementById('coverCheckbox').checked) {
        fillColor = '#808080';
        fillOpacity = 0.25;
    } else {
        fillColor = '#fff';
        fillOpacity = 0;
    };

    d3.select('#complex_Circle_'+arguments[1])
        .transition()
        .style('fill', fillColor)
        .style('fill-opacity', fillOpacity)
        .style('stroke', '#000')
        .style('stroke-opacity', 0.15);
}

//highlight edge and corresponding points
function highlightEdge() {

    if (arguments.length>1) {
        edge = d3.select(this)
        highlightPoint([], cechEdges[arguments[1]].Pt1);
        highlightPoint([], cechEdges[arguments[1]].Pt2);
    } else {
        edge = d3.select(arguments[0]);
    }
    edge.transition()
        .style('stroke','#c33');


}

//restore default view
function resetEdge() {

    if (arguments.length>1) {
        edge = d3.select(this)
        resetPoint([], cechEdges[arguments[1]].Pt1);
        resetPoint([], cechEdges[arguments[1]].Pt2);
    } else {
        edge = d3.select(arguments[0])
    }
    edge.transition()
        .style('stroke','#000');

}

//highlight faces
function highlightFace() {

    face = d3.select(this);
    face.transition()
        .style('fill','#c33')
        .style('stroke','#c33')
        .style('stroke-width','4px')
        .style('stroke-opacity', 1);

//highlight corresponding edges
    highlightEdge('#complex_Edge_'+arguments[0].Pt1+'_'+arguments[0].Pt2);
    highlightEdge('#complex_Edge_'+arguments[0].Pt1+'_'+arguments[0].Pt3);
    highlightEdge('#complex_Edge_'+arguments[0].Pt2+'_'+arguments[0].Pt3);

    //highlight corresponding points
    highlightPoint([], arguments[0].Pt1);
    highlightPoint([], arguments[0].Pt2);
    highlightPoint([], arguments[0].Pt3);

}

//reset to default view
function resetFace() {

    d3.select(this)
        .transition()
        .style('fill','#000')
        .style('stroke-opacity',0);

    resetEdge('#complex_Edge_'+arguments[0].Pt1+'_'+arguments[0].Pt2);
    resetEdge('#complex_Edge_'+arguments[0].Pt1+'_'+arguments[0].Pt3);
    resetEdge('#complex_Edge_'+arguments[0].Pt2+'_'+arguments[0].Pt3);

    resetPoint([], arguments[0].Pt1);
    resetPoint([], arguments[0].Pt2);
    resetPoint([], arguments[0].Pt3);

}

//construct the Cech complex
function constructCech() {

    cechEdges = [];
    cechFaces = [];

    var sqDist;
    //calculate the squared diameter to compare each pair to. Use square diameter to compare to squared euclidean distanct
    //of each pair so save computation.
    sqDiameter = 4 * Math.pow(complexRadius, 2);

    //interate over all possible permutations (n-choose-3) of the location data.
    for (i = 0; i < numSamples; i++) {
        x1 = locationData[i].xf;
        y1 = locationData[i].yf;
        for (j = i + 1; j < numSamples; j++) {
            x2 = locationData[j].xf;
            y2 = locationData[j].yf;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameter) {
                //save the edge
                cechEdges.push({Pt1: i, Pt2: j});
                //compute distance to third point only if first 2 points are within coverage ball
                for (k = j + 1; k < numSamples; k++) {
                    x3 = locationData[k].xf;
                    y3 = locationData[k].yf;
                    d23 = sqEuclidDist([x2, y2], [x3, y3]);
                    // only continue computation if third point is pairwise within coverage ball of other 2 points
                    if (d23 <= sqDiameter) {
                        d13 = sqEuclidDist([x1, y1], [x3, y3]);

                        if (d13 <= sqDiameter) {

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
                                cechFaces.push({Pt1: i, Pt2: j, Pt3: k});
                            } else {
                                //otherwise determine triangle circumcircle radius is smaller than the coverage radius
                                a = Math.sqrt(d12);
                                b = Math.sqrt(d13);
                                c = Math.sqrt(d23);
                                testRadius = (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (a + c - b) * (a + b - c));
                                if (testRadius <= complexRadius) {
                                    cechFaces.push({Pt1: i, Pt2: j, Pt3: k})
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function constructRips() {

    ripsEdges = [];
    ripsFaces = [];

    var sqDist;
    //calculate the squared diameter to compare each pair to. Use square diameter to compare to squared euclidean distanct
    //of each pair so save computation.
    sqDiameter = 4 * Math.pow(complexRadius, 2);

    //interate over all possible permutations (n-choose-3) of the location data.
    for (i = 0; i < numSamples; i++) {
        x1 = locationData[i].xf;
        y1 = locationData[i].yf;
        for (j = i + 1; j < numSamples; j++) {
            x2 = locationData[j].xf;
            y2 = locationData[j].yf;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameter) {
                //save the edge
                ripsEdges.push({Pt1: i, Pt2: j});
                //compute distance to third point only if first 2 points are within coverage ball
                for (k = j + 1; k < numSamples; k++) {
                    x3 = locationData[k].xf;
                    y3 = locationData[k].yf;
                    d23 = sqEuclidDist([x2, y2], [x3, y3]);
                    if (d23 <= sqDiameter) {
                        d13 = sqEuclidDist([x1, y1], [x3, y3]);
                        if (d13 <= sqDiameter) {
                            //all three pairwise distances within coverage ball, save face
                            ripsFaces.push({Pt1: i, Pt2: j, Pt3: k})
                        }
                    }
                }
            }
        }
    };
}

function renderComplex(edges,faces) {


    //remove existing canvas elements
    complexCanvas.selectAll('.face').remove();
    complexCanvas.selectAll('.edge').remove();
    //add g for each layer, this makes it easier to toggle each component on and off
    var complexFaces = complexCanvas.append('g')
        .attr('id','complexFaces')
        .attr('class', 'face')
        .style('visibility','hidden');
    var complexEdges = complexCanvas.append('g')
        .attr('id','complexEdges')
        .attr('class', 'edge')
        .style('visibility','hidden');


//render faces, give each an id with corresponding vertex indices. This makes it easier to find and highlight the corresponding
    //points and edges, do the same for each edge. Start with everything hidden then render view according to what the user
    //has selected

    complexFaces.selectAll('polygon').data(faces)
        .enter().append('polygon')
        .attr('class','face')
        .attr('points',function (d, i) {
                return  locationData[d.Pt1].xf+','+locationData[d.Pt1].yf+
                    ' '+locationData[d.Pt2].xf+','+locationData[d.Pt2].yf+
                    ' '+locationData[d.Pt3].xf+','+locationData[d.Pt3].yf;
            }
        )
        .attr('id', function (d, i) {
            return 'complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3;
        })
        .on('mouseover',highlightFace)
        .on('mouseout', resetFace);

    complexEdges.selectAll('line').data(edges)
        .enter().append('line')
        .attr('class', 'edge')
        .attr('x1', function (d) {
            return locationData[d.Pt1].xf;
        })
        .attr('y1', function (d) {
            return locationData[d.Pt1].yf
        })
        .attr('x2', function (d) {
            return locationData[d.Pt2].xf;
        })
        .attr('y2', function (d) {
            return locationData[d.Pt2].yf;
        })
        .attr('id', function (d) {
            return 'complex_Edge_'+d.Pt1+'_'+d.Pt2;
        })
        .on('mouseover', highlightEdge)
        .on('mouseout', resetEdge);

    //Make sure points stay on top
    pts = d3.select('#complexPoints').node();
    pts.parentNode.appendChild(pts);

    renderView();

}

function renderPoints() {

    //render each point and coverage circle. The id simply corresponds to its index within locationData

    complexCanvas.selectAll('.circle').remove();
    complexCanvas.selectAll('.point').remove();
    var complexCircles = complexCanvas.append('g')
        .attr('class','circle')
        .attr('id','complexCircles')
    var complexPoints = complexCanvas.append('g').attr('class', 'point')
        .attr('class', 'point')
        .attr('id','complexPoints');

    complexPoints.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .style('visibility','hidden')
        .attr('class', 'point')
        .attr('r', 1e-6)
        .attr('cx', function (d) {
            return d.xf;
        })
        .attr('cy', function (d) {
            return d.yf;
        })
        .attr('id', function (d, i) {
            return 'complex_Point_' + i.toString();
        })
        .attr('r', 5)
        .on('mouseover', highlightPoint)
        .on('mouseout', resetPoint)
        .call(d3.drag()
            .on('drag', dragNode)
            .on('end', dragEnd))
        .on('click', selectNode);

    complexCircles.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .style('visibility','hidden')
        .attr('class', 'circle')
        .attr('r', 1e-6)
        .attr('cx', function (d) {
            return d.xf;
        })
        .attr('cy', function (d) {
            return d.yf;
        })
        .attr('id', function (d, i) {
            return 'complex_Circle_' + i.toString();
        })
        .attr('r', complexRadius);

    // complexPoints.selectAll('text')
    //     .data(locationData)
    //     .enter().append('text')
    //     .text( function (d, i) {
    //         return i.toString();
    //     })
    //     .attr('x', function (d) {
    //         return d.xf;
    //     })
    //     .attr('y', function (d) {
    //         return d.yf;
    //     })
    //     .attr('dx','10px')
    //     .attr('dy','10px');

    renderView()

}

function renderView() {
    //query the various view options toggle visibility of each "g" element accordingly
    f = document.getElementById('coverCheckbox');
    showCoverage(f.checked);
    f = document.getElementById('nodeCheckbox');
    show(f.checked,'.point');
    f = document.getElementById('edgeCheckbox');
    show(f.checked,'.edge');
    f = document.getElementById('faceCheckbox');
    show(f.checked,'.face');
}



function loadData() {

    //allow user to select file
    var selectedFile = document.getElementById('fileSelector');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    filename = selectedFile.files[0].name;
    fReader.onloadend = function(event) {

        d3.csv(event.target.result, function (csv) {

            csv.forEach(function (d) {

                // Convert numeric values to 'numbers'
                d.LocationID = +d.LocationID;
                d.xf = +d.xf;
                d.yf = +d.yf;
            });
            //read data into locationData array and update number of samples
            locationData = csv;
            var csvContent = d3.csvFormat(locationData, ['LocationID', 'xf', 'yf']);
            numSamples = locationData.length;

            //reset to default view and calculate complexes
            c = document.getElementById('coverCheckbox');
            c.disabled = false;
            c.checked = true;
            n = document.getElementById('nodeCheckbox');
            n.disabled = false;
            n.checked = true;
            document.getElementById('edgeCheckbox').disabled = 0;
            document.getElementById('faceCheckbox').disabled = 0;
            renderPoints();
            updateComplex(document.getElementById('complexInput').value);
        });
    }
}

function randomData() {
//generate uniform randaom data points
    n = document.getElementById('numSensors').value;
    numSamples = +n;

    locationData = [];

    for (i=0; i<numSamples; i++) {
        x = getRndInteger(100, 700);
        y = getRndInteger(100, 500);
        var newPoint = {LocationID: i, xf: x, yf: y};
        locationData.push(newPoint);
    }

    c = document.getElementById('coverCheckbox');
    c.disabled = false;
    c.checked = true;
    n = document.getElementById('nodeCheckbox');
    n.disabled = false;
    n.checked = true;
    document.getElementById('edgeCheckbox').disabled = 0;
    document.getElementById('faceCheckbox').disabled = 0;

    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

function saveData() {

    //save nodes
    var csvContent = d3.csvFormat(locationData, ['LocationID', 'xf', 'yf']);
    var encodedUri = encodeURI(csvContent);
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

    //save cech faces
    var filename2 = filename.replace(/(\.)/,'_cech_faces.')
    var csvContent = d3.csvFormat(cechFaces, ['Pt1', 'Pt2', 'Pt3']);
    var encodedUri = encodeURI(csvContent);
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename2);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename2);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    //save cech edges
    var filename3 = filename.replace(/(\.)/,'_cech__edges.')
    var csvContent = d3.csvFormat(cechEdges, ['Pt1', 'Pt2']);
    var encodedUri = encodeURI(csvContent);
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename3);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename3);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    //save rips faces
    var filename2 = filename.replace(/(\.)/,'_rips_faces.')
    var csvContent = d3.csvFormat(ripsFaces, ['Pt1', 'Pt2', 'Pt3']);
    var encodedUri = encodeURI(csvContent);
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename2);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename2);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    //save rips edges
    var filename3 = filename.replace(/(\.)/,'_rips_edges.')
    var csvContent = d3.csvFormat(ripsEdges, ['Pt1', 'Pt2']);
    var encodedUri = encodeURI(csvContent);
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename3);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename3);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function changeComplex() {

    d = document.getElementsByName('complexType');
    if (d[0].checked) {
        renderComplex(cechEdges, cechFaces);
    } else {
        renderComplex(ripsEdges, ripsFaces);
    }
}


function addNode() {

    complexCanvas.attr('cursor','crosshair')
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
    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
    complexCanvas.attr('cursor',null)
        .on('click',null);
}

function updateLocation(coords) {
    locationData[selectedNode].xf = coords[0];
    locationData[selectedNode].yf = coords[1];
    updateCech(document.getElementById('complexInput').value);
    window.addEventListener('keypress', function (evt) {
        complexCanvas.attr('cursor',null)
            .on('click',null);
    });
}

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
        fillColor = '#808080';
        fillOpacity = '0.25';
        complexCanvas.selectAll('.circle')
            .transition()
            .style('visibility','visible')
            .style('fill', fillColor)
            .style('fill-opacity', fillOpacity);
        if (document.getElementById('nodeCheckbox').checked) {
            complexCanvas.selectAll('circle')
                .style('stroke','#000')
                .style('stroke-opacity',0.15);
        }
    } else {
        complexCanvas.selectAll('.circle')
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
    i = this.id.match(/\d+/g);
    str = '#complex_Circle_'+i;
    d3.select(str)
        .attr('cx', d3.event.x)
        .attr('cy', d3.event.y);
    d3.select(this)
        .attr('cx', d3.event.x)
        .attr('cy', d3.event.y);
    locationData[i].xf = d3.event.x;
    locationData[i].yf = d3.event.y;
    wasDragged = true;
}

function dragEnd() {
    if (wasDragged) {
        updateComplex(document.getElementById('complexInput').value);
    }
    wasDragged = false;
}

function selectNode() {
    if (d3.event.defaultPrevented) return;
    i = this.id.match(/\d+/g);
    str = 'complex_Circle_'+i;

    d3.select('#complexCanvas').selectAll('circle')
        .on('mouseover',null)
        .on('mouseout',null);
    d3.select('#complexCanvas').selectAll('line')
        .on('mouseover',null)
        .on('mouseout',null);
    d3.select('#complexCanvas').selectAll('polygon')
        .on('mouseover',null)
        .on('mouseout',null);

    d3.select(str)
        .style('fill', '#c33')
        .style('fill-opacity', 0.25)
        .style('stroke', '#c33')
        .style('stroke-opacity', 1);

    d3.select(this)
        .style('fill','#c33');

    window.addEventListener('keydown', function (event) {
        if (event.code=='Delete') {
            locationData.splice(i,1);
            numSamples = locationData.length;
            renderPoints();
        } else if (event.code=='Escape') {

            renderPoints();
            updateComplex(document.getElementById('complexInput').value);
        }
    }, {once:true});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*                                This area for testing functions                                                     */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function testfun() {
    highlightPoint([],10)
}

function testfun3() {
    t1 = Date.now();
    var ripsFaces = [];
    var cechFaces = [];
    var sqDist;
    sqDiameter = 4*Math.pow(complexRadius, 2);
    sqRadius = Math.pow(complexRadius, 2);

    for (i=0; i<numSamples; i++) {
        x1 = locationData[i].xf;
        y1 = locationData[i].yf;
        for (j=i+1; j<numSamples; j++) {
            x2 = locationData[j].xf;
            y2 = locationData[j].yf;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameter) {
                for (k = j + 1; k < numSamples; k++) {
                    x3 = locationData[k].xf;
                    y3 = locationData[k].yf;
                    d23 = sqEuclidDist([x2, y2], [x3, y3]);
                    if (d23 <= sqDiameter) {
                        d13 = sqEuclidDist([x1, y1], [x3, y3]);

                        if (d12 >= d13 && d12 >= d23) {
                            xc = Math.abs(x2 - x1) / 2;
                            yc = Math.abs(y2 - y1) / 2;
                            sqDist = sqEuclidDist([x3, y3], [xc, yc]);
                        } else if (d13 >= d12 && d13 >= d23) {
                            xc = Math.abs(x3 - x1) / 2;
                            yc = Math.abs(y3 - y1) / 2;
                            sqDist = sqEuclidDist([x2, y2], [xc, yc]);
                        } else {
                            xc = Math.abs(x3 - x2) / 2;
                            yc = Math.abs(y3 - y2) / 2;
                            sqDist = sqEuclidDist([x1, y1], [xc, yc]);
                        }

                        if (sqDist <= sqRadius) {
                            cechFaces.push([i, j, k]);
                        } else {
                            a = Math.sqrt(d12);
                            b = Math.sqrt(d13);
                            c = Math.sqrt(d23);
                            testRadius = (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (a + c - b) * (a + b - c));
                            if (testRadius <= complexRadius) {
                                cechFaces.push([i, j, k])
                            }
                        }
                    }
                }
            }
        }
    };

// console.log(cechFaces)
    t5 = Date.now();
    console.log('My Elapsed time: '+(t5-t1)+' ms');
    testfun2();
}

function sqEuclidDist(pt1, pt2) {
    return Math.pow(pt2[0]-pt1[0],2) + Math.pow(pt2[1]-pt1[1],2);
}

function testfun2() {

    t1=Date.now();
    //Faces first
    for (var i = 0; i < numSamples; i++) {
        var x1 = locationData[i].xf;
        var y1 = locationData[i].yf;
        for (var j = i + 1; j < numSamples; j++) {
            var x2 = locationData[j].xf;
            var y2 = locationData[j].yf;
            var sqDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
            var sqDiameter = 4 * Math.pow(complexRadius, 2);
            if (sqDistance < sqDiameter) {
                for (var k = j + 1; k < numSamples; k++) {
                    var x3 = locationData[k].xf;
                    var y3 = locationData[k].yf;
                    var testRadius = minimumEnclosingBallRadius(x1, y1, x2, y2, x3, y3);
                    if (testRadius <= complexRadius) {
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

                        var idx = idx1.toString() + '_'
                            + idx2.toString() + '_'
                            + idx3.toString();
                    }
                }
            }
        }
    }
    t2 = Date.now();
    console.log('His Elapsed time: '+(t2-t1)+' ms')
}


function comb(n,k) {

    t1 = Date.now();
    // n -> [a] -> [[a]]
    function comb(n, lst) {
        if (!n) return [[]];
        if (!lst.length) return [];

        var x = lst[0],
            xs = lst.slice(1);

        return comb(n - 1, xs).map(function (t) {
            return [x].concat(t);
        }).concat(comb(n, xs));
    }

    // f -> f
    function memoized(fn) {
        m = {};
        return function (x) {
            var args = [].slice.call(arguments),
                strKey = args.join('-');

            v = m[strKey];
            if ('u' === (typeof v)[0])
                m[strKey] = v = fn.apply(null, args);
            return v;
        }
    }

    // [m..n]
    function range(m, n) {
        return Array.apply(null, Array(n - m + 1)).map(function (x, i) {
            return m + i;
        });
    }

    var fnMemoized = memoized(comb),
        lstRange = range(0, k-1);

    t2 = Date.now()-t1;
    console.log('comb time: '+t2+'ms');

    return fnMemoized(n, lstRange)

};