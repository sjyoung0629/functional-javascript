"use strict";

var state = Object.create(null);
var view = Object.create(null);
var controls = Object.create(null);

window.onload = function() {
    readFile("./patterns.json", function(jsonObj, error) {
        if (error) {
            // 파일을 읽을 수 없으면 패턴 메뉴를 생성하지 않는다
            delete controls.pattern;
        } else {
            // 파일 읽기에 성공하면 가져온 패턴을 state.patterns에 저장한다
            state.patterns = jsonObj;
        }
        // body 요소 안에 생명 게임의 각 부품(controls, view)을 생성해서 배치한다
        createLifeGame(document.body, 78, 60, 780, 600);
    })
}

// patterns.json 을 읽어 들이는 함수
function readFile(filename, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(req.readyState == 4) {
            if(req.status == 200) {
                callback(req.response, false/* no error */);
            } else {
                callback(null, true/* error */);
            }
        }
    };
    req.open("GET", filename, true);
    req.responseType = "json";
    req.send(null);
}

// 주어진 이름(name)과 속성(attributes), 자식 노드를 포함하는 엘리먼트를 만들어서 반환하는 함수
function elt(name, attributes) {
    let node = document.createElement(name);
    if (attributes) {
        for(var attr in attributes) {
            if(attributes.hasOwnProperty(attr)) {
                node.setAttribute(attr, attributes[attr]);
            }
        }
    }

    const arg_len = arguments.length;
    if (arg_len > 2) {
        let fragment = document.createDocumentFragment();
        let child;
        for(let i=2; i<arg_len; i++) {
            child = arguments[i];
            if (typeof child === "string") {
                child = document.createTextNode(child);
            }
            fragment.appendChild(child);
        }
        node.appendChild(fragment);
    }
    
    return node;
}

function createLifeGame(parent, nx, ny, width, height) {
    var title = elt("h1", {class: "title"}, "Life Game");
    // view 객체 생성 (뷰 패널을 반환)
    var viewpanel = view.create(nx, ny, width, height);
    state.create(nx, ny);   // state 객체 초기화
    // controls 객체에서 toolbar 요소를 생성한다
    var toolbar = elt("div", {class: "toolbar"});
    for(let name in controls) {
        toolbar.appendChild(controls[name](state));
    }
    // toolbar 요소와 viewpanel 요소를 지정한 요소(parent)의 자식 요소로 삽입한다
    parent.appendChild(elt("div", null, title, toolbar, viewpanel));
}

// state 객체의 정의
state.create = function(nx, ny) {
    // 격자의 크기
    state.nx = nx;
    state.ny = ny;
    // 셀의 상태를 저장하는 2차원 배열을 생성하고 초기화한다
    state.cells = new Array(ny);
    for(var ix=0; ix<nx; ix++) {
        state.cells[ix] = new Array(ny);
        for(var iy=0; iy<ny; iy++) {
            state.cells[ix][iy] = 0;
        }
    }
    // clickview 이벤트 리스너 등록: view가 발행한 이벤트에 반응하여 셀의 상태를 바꾼다
    document.addEventListener("clickview", function(e) {
        state.setLife(e.detail.ix, e.detail.iy, e.detail.life);
    }, false);
    // changeCell 이벤트 객체와 changeGeneration 이벤트 객체를 생성한다
    state.changeCellEvent = document.createEvent("HTMLEvents");
    state.changeGenerationEvent = document.createEvent("HTMLEvents");
    // generation(세대)을 추가하고 0으로 설정한다
    state.generation = 0;
    state.tellGenerationChange(0);
    // 애니메이션의 상태를 저장하는 변수
    state.playing = false;
    state.timer = null;
}

// 셀 값이 바뀌었을 때, 이를 알리기 위한 changeCell 이라는 커스텀 이벤트 발행
state.tellCellChange = function(ix, iy, life) {
    state.changeCellEvent.initEvent("changecell", false, false);
    state.changeCellEvent.detail = {ix: ix, iy: iy, life: life};
    document.dispatchEvent(state.changeCellEvent);
}

// 세대가 바뀌었을 때, 이를 알리기 위한 changeGeneration 이라는 커스텀 이벤트 발행
state.tellGenerationChange = function(generation) {
    state.changeGenerationEvent.initEvent("changegeneration", false, false);
    state.changeGenerationEvent.detail = {generation: generation};
    document.dispatchEvent(state.changeGenerationEvent);
}

// 셀 주변 생물의 마리 수를 구한다
state.getSumAround = function(ix, iy) {
    var dx = [0, 1, 1, 1, 0, -1, -1, -1];
    var dy = [1, 1, 0, -1, -1, -1, 0, 1];
    // 주기적 경계 조건
    for(var k=0, sum=0, len=dx.length; k<len; k++) {
        if(state.cells[(ix+dx[k]+state.nx)%state.nx][(iy+dx[iy]+state.ny)%state.ny]) {
            sum++;
        }
    }
    return sum;
}

state.update = function() {
    // 상태를 바꾸지 않고 전체 셀을 검사한다. 그리고 변경할 셀을 changedCell 배열에 담는다
    var changedCell = [];
    for(var ix=0, nx=state.nx; ix<nx; ix++) {
        for(var iy=0, ny=state.ny; iy<ny; iy++) {
            var sum = state.getSumAround(ix, iy);
            if(sum <= 1 || sum >= 4) {
                // 주위 마리 수가 한 마리 이하거나, 네 마리 이상이면 죽는다
                if(state.cells[ix][iy]) {
                    changedCell.push({x:ix, y:iy});
                    // 셀 변경 요청
                    state.tellCellChange(ix, iy, 0);
                } else if (sum === 3) {
                    // 주위 마리 수가 세 마리면 생성한다
                    if(!state.cells[ix][iy]) {
                        changedCell.push({x:ix, y:iy});
                        //  셀 변경 요청
                        state.tellCellChange(ix, iy, 1);
                    }
                }
            }
        }
    }

    // 전체 셀의 상태를 확인하고 셀의 상태를 변경한다 (배타적 논리합의 결과 0->1, 1->0 이 된다)
    for(var i=0, cell_len=changedCell.length; i<cell_len; i++) {
        let cell = changedCell[i];
        state.cells[cell.x][cell.y] ^= 1;
    }
    // 다음 세대로 교체하고 세대 표시의 변경을 요청한다
    state.tellGenerationChange(state.generation++);
}

// 셀의 상태를 설정하는 메서드
// life가 0이면 생물을 죽이고, 1이면 생물을 탄생시키며, 2면 생사를 반전시킨다
state.setLife = function(ix, iy, life) {
    if (life == 2) {
        // 생물의 삶과 죽음을 반대로 설정한다 (0->1, 1->0)
        state.cells[ix][iy] ^= 1;
        state.tellCellChange(ix, iy, state.cells[ix][iy]);
    } else {
        if (state.cells[ix][iy] != life) {
            state.cells[ix][iy] = life;
            state.tellCellChange(ix, iy, life);
        }
    }
}

// 모든 셀을 지운다
state.clearAllCell = function() {
    for(var ix=0, nx=state.nx; ix<nx; ix++) {
        for(var iy=0, ny=state.ny; iy<ny; iy++) {
            state.setLife(ix, iy, 0);
        }
    }
    // 세대를 0으로 설정하고 세대 표시의 변경을 요청한다
    state.tellGenerationChange(state.generation = 0);
}

// view 객체의 프로퍼티를 정의하고 렌더링하기 위한 viewpanel 요소 객체와,
// 세대를 표시하는 statuspanel 요소 객체를 생성한다
view.create = function(nx, ny, width, height) {
    // canvas 요소 생성
    view.layer = [];
    // 생물 표시하는 레이어
    view.layer[0] = elt("canvas", {id: "rayer0", width: width, height: height});
    // 격자 선 표시하는 레이어
    view.layer[1] = elt("canvas", {id: "rayer1", width: width, height: height});
    view.nx = nx;
    view.ny = ny;
    view.cellWidth = view.layer[0].width/nx;    // 셀 너비
    view.cellHeight = view.layer[0].height/ny;  // 셀 높이
    // 생물을 표시하는 원의 반지름
    view.markRadius = (Math.min(view.cellWidth, view.cellHeight)/2.5+0.5) | 0;
    // canvas의 렌더링 컨텍스트 가져오기
    if(view.ctx) delete view.ctx;
    view.ctx = [];
    for(var i=0; i<view.layer.length; i++) {
        view.ctx.push(view.layer[i].getContext("2d"));
    }
    // 렌더링 매개변수의 초기 설정
    view.backColor = "forestgreen";     // 배경 색상
    view.markColor = "white";           // 생물 색상
    view.strokeStyle = "black";         // 격자 선의 색상
    view.lineWidth = 0.2;               // 격자 선의 너비
    // 격자를 그린다
    view.drawLattice();
    // 세대를 표시하는 요소를 생성한다
    view.generation = elt("span", {id: "generation"});
    view.statuspanel = elt("div", {class: "status"}, "세대: ", view.generation);

    // clickview 이벤트를 발생시킬 때 사용할 이벤트 객체를 생성한다
    view.clickEvent = document.createEvent("HTMLEvents");
    // layer[1]을 클릭했을 때 동작하는 이벤트 리스너를 등록한다
    view.layer[1].addEventListener("click", function(e) {
        var ix = Math.floor(e.offsetX/view.cellWidth);  // 셀의 x 방향 번호
        var iy = Math.floor(e.offsetY/view.cellHeight); // 셀의 y 방향 번호
        // view의 (ix, iy) 지점을 클릭했음을 clickview 이벤트로 알린다
        view.clickEvent.initEvent("clickview", false, false);
        view.clickEvent.detail = {ix: ix, iy: iy, life: 2};
        document.dispatchEvent(view.clickEvent);
    }, false);
    // changeCell 이벤트 리스너 등록: state에서 받은 이벤트로 셀을 다시 그린다
    document.addEventListener("changecell", function(e) {
        view.drawCell(e.detail.ix, e.detail.iy, e.detail.life);
    }, false);
    // changeGeneration 이벤트 리스너 등록: state에서 받은 이벤트로 세대 표시를 갱신한다
    document.addEventListener("changegeneration", function(e) {
        view.showGeneration(e.detail.generation);
    }, false);

    // viewpanel 요소의 객체를 반환한다
    return elt("div", {class: "viewpanel"}, view.layer[0], view.layer[1], view.statuspanel);
}

// 격자 선을 그리는데, nx 값이 150 이상이면 그리지 않는다
view.drawLattice = function() {
    for(var i=0, len=view.layer.length; i<len; i++) {
        view.layer[i].width = view.layer[i].width;
    }
    // 레이어 -1에 격자를 그린다. 격자는 nx가 150 미만일 때 그린다
    if(view.nx < 150) {
        var c = view.ctx[1];
        c.lineWidth = view.lineWidth;
        c.strokeStyle = view.strokeStyle;
        for(var ix=0, nx=view.nx; ix<nx; ix++) {
            c.beginPath();
            c.moveTo(ix*view.cellWidth, 0);
            c.lineTo(ix*view.cellWidth, view.nx*view.cellHeight);
            c.stroke();
        }
        for(var iy=0, ny=view.ny; iy<ny; iy++) {
            c.beginPath();
            c.moveTo(0, iy*view.cellHeight);
            c.lineTo(view.nx*view.cellWidth, iy*view.cellHeight);
            c.stroke();
        }
    }
    // 레이어 0에 배경색을 칠한다
    c = view.ctx[0];
    c.fillStyle = view.backColor;
    c.fillRect(0, 0, view.layer[0].width, view.layer[0].height);
};

view.drawCell = function (ix, iy, life) {
    var c = view.ctx[0];    // 생물은 layer[0]에 그린다
    c.beginPath();
    if (life) {
        // 표식(원)을 그린다
        var x = (ix+0.5)*view.cellWidth;
        var y = (iy+0.5)*view.cellHeight;
        var r = view.markRadius;
        c.fillStyle = view.markColor;
        c.arc(x, y, r, 0, Math.PI*2, true);
        c.fill();
    } else {
        // 셀에 배경색을 칠한다
        var x = ix*view.cellWidth;
        var y = iy*view.cellHeight;
        c.fillStyle = view.backColor;
        c.fillRect(x, y, view.cellWidth, view.cellHeight);
    }
}

// 현재 세대를 표시한다
view.showGeneration = function(generation) {
    view.generation.innerHTML = generation;
}

// controls 객체 정의

// 연속 재생. 일정 시간마다 state.update 메서드를 실행해서 세대를 교체한다
controls.play = function(state) {
    if(!state.timeInterval) state.timeInterval = 300;
    var input = elt("input", {type: "button", value: "연속 재생"});
    input.addEventListener("click", function(e) {
        if(!state.playing) {
            state.timer = setInterval(state.update, state.timeInterval);
            state.playing = true;
        }
    });
    return input;
}

// 재생 속도 설정
controls.changeTimeInterval = function(state) {
    var select = elt("select");
    var options = [
        {name: "초고속(20ms)", value: 20},
        {name: "고속(100ms)", value: 100},
        {name: "표준(300ms)", value: 300},
        {name: "저속(600ms)", value: 600}
    ];
    for(var i=0, len=options.length; i<len; i++) {
        var option = elt("option", null, options[i].name);
        select.appendChild(option);
    }
    select.selectedIndex = 2;
    select.addEventListener("change", function(e) {
        state.timeInterval = options[select.selectedIndex].value;
        if(state.playing) {
            clearInterval(state.timer);
            state.timer = setInterval(state.update, state.timeInterval);
        }
    });
    return select;
}

// 정지 버튼 클릭했을 때
controls.stop = function(state) {
    var input = elt("input", {type: "button", value: "정지"});
    input.addEventListener("click", function(e) {
        if(state.playing) {
            clearInterval(state.timer);
            state.playing = false;
        }
    });
    return input;
}

// 다음 버튼 클릭했을 때
controls.step = function(state) {
    var input = elt("input", {type: "button", value: "다음"});
    input.addEventListener("click", function(e) {
        clearInterval(state.timer);
        state.playing = false;
        state.update();
    });
    return input;
}

// 패턴 선택을 클릭했을 때
controls.pattern = function(state) {
    var select = elt("select");
    select.appendChild(elt("option", null, "패턴 선택"));
    for(var i=0, len=state.patterns.length; i<len; i++) {
        select.appendChild(elt("option", null, state.patterns[i].name));
    }
    select.selectedIndex = 0;
    select.addEventListener("change", function(e) {
        clearInterval(state.timer);
        state.playing = false;
        if(select.selectedIndex != 0) {
            placePattern(state.patterns[select.selectedIndex-1]);
        }
        select.selectedIndex = 0;
    });
    return select;

    function placePattern(pattern) {
        var array = pattern.points;
        // x, y의 최솟값과 최댓값을 구한다
        var max = [0, 0];
        var min = [state.nx-1, state.ny-1];
        for(var i=0, len=array.len; i<len; i++) {
            for(var d=0; d<2; d++) {
                if(array[i][d] > max[d]) max[d] = array[i][d];
                if(array[i][d] < min[d]) min[d] = array[i][d];
            }
        }
        // 모든 셀을 지운다
        state.clearAllCell();
        // canvas 중심에 패턴을 배치한다
        for(var i=0, len=array.length; i<len; i++) {
            var ix = array[i][0]+Math.floor((state.nx-min[0]-max[0])/2);
            var iy = array[i][1]+Math.floor((state.ny-min[1]-max[1])/2);
            state.setLife(ix, iy, 1);
        }
        state.tellGenerationChange(state.generation = 0);
    }
}

// 모두 삭제
controls.clear = function(state) {
	var input = elt("input",{ type: "button", value: "모두 삭제" });
	input.addEventListener("click", function(e) {
		clearInterval(state.timer); state.playing = false;
		state.clearAllCell();
	});
	return input;
};