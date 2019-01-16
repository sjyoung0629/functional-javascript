/* 순수 함수 */

function add(a, b) {
    return a + b;
}

// 어디서든 같은 결과
console.log( add(10, 5) );
console.log( add(10, 5) );
console.log( add(10, 5) );


/* 순수함수가 아닌 함수 */

var c = 10;
function add2(a, b) {
    return a + b + c;
}

console.log( add2(10, 2) );
console.log( add2(10, 3) );
console.log( add2(10, 4) );
// c 값을 중간에 변경하게 되면 다른 결과
c = 20;
console.log( add2(10, 2) );
console.log( add2(10, 3) );
console.log( add2(10, 4) );


/* 
순수함수가 아닌 함수2 - 부수효과가 있는 함수
리턴값으로 소통하는 것 이외에 외부 상태에 영향을 미치는 다른 출력이 있을 때
*/

var c = 20;
function add3(a, b) {
    c = b;      // 부수효과
    return a + b;
}

console.log(c);     // 20
console.log( add3(20, 30) );
console.log(c);     // 30 다른 값이 출력됨


/* 
순수함수가 아닌 함수3
인자로 들어온 값의 상태를 직접 변경하는 함수
*/

var obj1 = { val: 10 };
function add4(obj, b) {
    obj.val += b;
}

console.log( obj1.val );    // 10
add4(obj1, 20);
console.log( obj1.val );    // 30 함수에 의해 값이 변경됨


/* 위와 같이 객체 값을 변경하는 함수를 순수함수로 만들어 사용하려면? */

var obj1 = { val: 10 };
function add5(obj, b) {
    // obj에 있는 val 값을 참조만 할뿐 값을 직접 변경하지는 않고
    // 새로운 객체를 리턴
    return { val: obj.val + b }
}

console.log( obj1.val );    // 10
var obj2 = add5(obj1, 20);
console.log( obj1.val );    // 10 동일한 결과
console.log( obj2.val );    // 30


/* 일급 함수 */

// 함수를 변수에 담을 수 있다
var f1 = function(a) { return a * a; };
console.log(f1);

var f2 = add;
console.log(f2);


// 함수를 인자로 받을 수 있다
function f3(f) {
    return f();
}

console.log(f3(function () {return 10;}))   // 10


/* add_maker */

// 함수를 리턴하는 함수이며, 리턴하는 함수에서 또 인자를 받아 더한 값을 리턴하는..
function add_maker(a) {
    return function(b) {
        return a + b;
    }
}

// add10 변수에 add_maker 안의 익명함수가 들어간다
var add10 = add_maker(10);

console.log( add10(20) );   // 30


// add_maker를 통해 또다른 add 함수들을 만들 수 있다
var add5 = add_maker(5);
var add15 = add_maker(15);

console.log( add5(10) );    // 15
console.log( add15(10) );   // 25


// filter()는 응용형 함수
// 함수가 함수를 인자로 받아서 원하는 시점에 해당 함수가 알고 있는 인자를 적용하는 식으로 프로그래밍
// 고차 함수: 함수를 인자로 받거나, 함수를 리턴하거나, 함수 안에서 함수를 실행하는 함수
function _filter(list, predi) {
    var new_list = [];
    for (var i; i < list.length; i++) {
        if (predi(list[i])) {
            new_list.push(list[i]);
        }
    }

    return new_list;
}

console.log(_filter(users, function(user) {return user.age >= 30;}));


// 다형성이 높다 - 즉, 데이터가 어떻게 생겼는지 전혀 보이지 않는다.
function _map(list, mapper) {
    var new_list = [];
    for(var i; i < list.length; i++) {
        new_list.push(mapper(list[i]));
    }

    return new_list;
}

var over_30 = _filter(users, function(user) {return user.age >= 30;});
var names = _map(over_30, function(users) {
    return users.name;
});

_map(
    _filter(users, function(user) {return user.age >= 30;}),
    function (users) { return users.name; });


// 해당 i번째 값들을 순회하는 함수
function _each(list, iter) {
    for(var i = 0; i < list.length; i++) {
        iter(list[i]);
    }

    return list;
}

_each(null, console.log);


// _each() 함수 사용해서 _map 간소화
function _map(list, mapper) {
    var new_list = [];
    _each(list, function (val) {
        new_list.push(mapper(val));
    })

    return new_list;
}

function _filter(list, predi) {
    var new_list = [];
    _each(list, function(val) {
        if (predi(val)) { new_list.push(val); }
    })

    return new_list;
}


// map, filter는 함수가 아니라 "메서드"
// 즉, 순수 함수가 아니고, 객체의 상태에 따라 결과가 달라지는 특징
// map 은 array가 아니면 사용할 수 없다

[1, 2, 3, 4].map(function (val) {
    return val * 2;
});

[1, 2, 3, 4].filter(function (val) {
    return val % 2;
});

// 자바스크립트에는 array 가 아닌데 array처럼 여겨지는 객체(array-like object)들이 있다
// ex) document.querySelectorAll()
// array-like 객체에는 map, filter 함수를 사용할 수 없다..
// 이때, _map, _filter와 같이 직접 함수를 정의하면 map, filter 기능을 사용할 수 있다 !

_map(document.querySelectorAll('*'), function (node) {
    return node.nodeName;
})


// 커링 curry
// 미리 받아두었던 함수의 본체를 내부에서 평가하는 함수
function _curry(fn) {
    return function (a) {
        return function(b) {
            return fn(a, b);
        }
    }
}



function _curry2(fn) {
    return function (a, b) {
        // 인자가 2개인 경우 fn 즉시실행
        return arguments.length === 2 ? fn(a, b) : function(b) { return fn(a, b); };
    }
}


var add = _curry(function (a, b) {
    return a + b;
});

var add10 = add(10);        // 함수 function(b) {return fn(a, b);}
console.log( add10(5) );    // 15
console.log( add(5)(3) );   // 8


var sub = _curry(function(a, b) {
    return a - b;
})

// curry right
// 인자를 오른쪽부터 적용해나감
function _curryr(fn) {
    return function(a, b) {
        return arguments.length === 2 ? fn(a, b) : function(b) {return fn(b, a);}
    }
}

// object 값을 안전하게 참조하는 함수
function _get(obj, key) {
    return obj === null ? undefined : obj[key];
}

var user1 = users[0];
console.log(user1.name);
console.log(_get(user1, 'name'));

// 없는 값을 참조하는 경우
var user2 = users[10];
console.log(user2.name);            // error
console.log(_get(user2, 'name'));   // undefined


var _get = _curryr(function (obj, key) {
    return obj === null ? undefined : obj[key];
});

console.log(_get('name')(user1));

// 이름을 가져오는 함수
var get_name = _get('name');

_map(
    _filter(users, function(user) {return user.age >= 30;}),
    _get('name'));


// array-like 객체는 slice() 메서드를 사용할 수 없으므로
// call을 활용하여 메서드를 연결시켜줘야 한다.
var slice = Array.prototype.slice;
function _rest(list, num) {
    return slice.call(list, num || 1);
}

/**
 * 연속적으로 iter 함수를 호출하여 실행한 결과를 만들어주는 함수
 * (memo값부터 시작하여) 모든 데이터들을 이 함수를 통해 축약시켜서 원하는 새로운 결과(자료)를 만들 때 사용
 * @param {*} list 객체
 * @param {*} iter 함수
 * @param {*} memo 시작값
 */
function _reduce(list, iter, memo) {
    // memo 파라미터가 없는 경우 list 맨앞을 memo로 설정하고,
    // list에서 memo로 설정한 값을 제거해야 함
    // slice 메소드는 array-like 객체에서 동작하지 않으므로, 따로 _rest 함수 만들어서 사용
    if (arguments.length == 2) {
        memo = list[0];
        list = _rest(list);
    }
    // 모든 데이터를 순회하면서 iter 함수를 실행하고, 그 결과를 memo에 계속 덮어씀
    _each(list, function(val) {
        memo = iter(memo, val);
    });
    return memo;
}

console.log(_reduce([1, 2, 3, 4], add));        // 10
console.log(_reduce([1, 2, 3, 4], add, 10));    // 20


// 함수들을 인자로 받아서,
// 이 함수들을 연속적으로 실행해주는 함수를 리턴하는 함수
function _pipe() {
    var fns = arguments;
    return function (arg) {
        return _reduce(fns, function(arg, fn) {
            return fn(arg);
        }, arg);
    }
}

var f1 = _pipe(
    function(a) { return a + 1; },
    function(a) { return a * 2; },
    function(a) { return a * a }
);

console.log( f1(1) );   // 16


// _go: _pipe 함수의 즉시 실행 버전
function _go(arg) {
    var fns = _rest(arguments);
    return _pipe.apply(null, fns)(arg);
}

_go(1,
    function(a) { return a + 1; },
    function(a) { return a + 2; },
    function(a) { return a * a; },
    console.log);


console.log(
    _map(
        _filter(users, function(user) {return user.age >= 30;}),
        _get('name')));

_go(users,
    function(users) {
        return _filter(users, function(user) {
            return user.age >= 30;
        });
    },
    function(users) {
        return _map(users, _get('name'));
    },
    console.log);

// curryr 적용
var _map = _curryr(_map),
_filter = _curryr(_filter);

_go(users,
    _filter(function(user) { return user.age >= 30; }),
    _map(_get('name')),
    console.log);

_go(users,
    _filter(user => user.age < 30),
    _map(_get('age')),
    console.log);


var a = function(user) { return user.age >= 30; };
var a = user => user.age >= 30;

var add = function(a, b) { return a + b; };
var add = (a, b) => a + b;

// _each의 외부 다형성 높이기
// 1) _each에 null 넣어도 에러 안나게

// null 체크를 해주는 _get 함수
var _get = _curryr(function (obj, key) {
    return obj === null ? undefined : obj[key];
});

// length 속성 참조에 _get 활용
var _length = _get('length');

function _each(list, iter) {
    for(var i = 0, len = _length(list); i < len; i++) {
        iter(list[i]);
    }

    return list;
}

// _each, _map, _filter, _go의 null값 처리 확인
_each(null, console.log);
_map(null, function(v) {return v;});       // [] (빈 배열 리턴)
_filter(null, function(v) {return v;});    // [] (빈 배열 리턴)

_go(null,
    _filter(null, function(v) {return v % 2;}),
    _map(null, function(v) {return v * v;}),
    console.log);       // [] (빈 배열 리턴)

Object.keys({name: 'ID', age: 33});     // ["name", "age"]
Object.keys([1,2,3,4]);     // ["0", "1", "2", "3"]
Object.keys(10);        // [] (key 없음)
Object.keys(null);      // error

// object 여부 체크
function _is_object(obj) {
    return typeof obj == "object" && !!obj;
}

// _keys에서도 _is_object인지 검사하여 null 에러 안나게 함
function _keys(obj) {
    return _is_object(obj) ? Object.keys(obj) : [];
}

_keys({name: 'ID', age: 33});     // ["name", "age"]
_keys([1,2,3,4]);       // ["0", "1", "2", "3"]
_keys(10);              // [] (key 없음)
_keys(null);            // []

// _each 외부 다형성 높이기

// array 및 key-value 쌍의 객체에서도 잘 동작하도록 변경
function _each(list, iter) {
    var keys = _keys(list);
    for (var i = 0, len = keys.length; i < len; i++) {
        iter(list[keys[i]])
    }
    return list;
}

_each({
    13: 'ID',
    19: 'HD',
    29: 'YD'
}, function(name) {
    console.log(name);
});

// _each 함수를 사용하는 _map, _filter, _go에서도 동작
_map({
    13: 'ID',
    19: 'HD',
    29: 'YD'
}, function(name) {
    console.log(name.toLowerCase());
});

_go({
        13: 'ID',
        19: 'HD',
        29: 'YD'
    },
    _map(function(name) {
        return name.toLowerCase();
    }),
    console.log);



