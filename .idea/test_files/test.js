
n = 3;
k = 4;

t1 = Date.now();
x = returnComb(n,k)
t2 = Date.now()-t1;
str =t2.toLocaleString('en-us')
console.log('simple elapsed time = '+str+' ms')

t1 = Date.now();
x = memoComb(n, k)
t2 = Date.now()-t1;
str =t2.toLocaleString('en-us')
console.log('memo elapsed time = '+str+' ms')

console.log(x);

// circumcenter of a triangle (just saving this as it might be useful later)
xc = 1/(2*( x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2) ) ) *
    ( (x1*x1+y1*y1)*(y2-y3) + (x2*x2+y2*y2)*(y3-y1) + (x3*x3+y3*y3)*(y1-y2) );
yc = 1/(2*( x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2) ) ) *
    ( (x1*x1+y1*y1)*(x3-x2) + (x2*x2+y2*y2)*(x1-x3) + (x3*x3+y3*y3)*(x2-x1) );

function returnComb(n, k) {

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

    return comb(n, range(0, k-1))

};

function memoComb(n, k) {

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

    return fnMemoized(n, lstRange)

}



