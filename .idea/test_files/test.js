/**
 * Created by Tim on 11/11/2016.
 */
var locationData;

loadData();
// test();

console.log(locationData);

function test() {
    console.log(locationData);
}

function loadData() {

    d3.csv("locations.csv", function (csv) {

        locationData = csv.forEach(function (d) {

            // Convert numeric values to 'numbers'
            d.xf = +d.xf;
            d.yf = +d.yf;
        });
        locationData = csv;
        test();
    });

}
