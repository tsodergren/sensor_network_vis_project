var today = new Date();
var s1 = today.getSeconds();
x = returnComb();
today = new Date();
var s2 = today.getSeconds();
d = s2-s1;
console.log(x)

function returnComb() {

    function comb(n, lst) {
        if (!n) return [[]];
        if (!lst.length) return [];

        var x = lst[0],
            xs = lst.slice(1);

        return comb(n - 1, xs).map(function (t) {
            return [x].concat(t);
        }).concat(comb(n, xs));
    }


    // [m..n]
    function range(m, n) {
        return Array.apply(null, Array(n - m + 1)).map(function (x, i) {
            return m + i;
        });
    }

    return comb(3, range(0, 5))

        .map(function (x) {
            return x.join(' ');
        }).join('\n');

};
