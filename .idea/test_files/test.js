
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



