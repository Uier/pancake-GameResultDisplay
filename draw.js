//updatingBarChart.js

// const value

const redrawDuration = 600;
const step = 0.03;

var rnd = 0;
var basicRnd = 0;
var advRnd = 0;
var totalRnd = 0;

var setup = function(targetID) {
    //Set size of svg element and chart
    var margin = {
            top: 20,
            right: 0,
            bottom: 50,
            left: 0
        },
        width = document.body.clientWidth * 0.7 - margin.left - margin.right,
        height = document.body.clientHeight * 0.6 - margin.top - margin.bottom,
        categoryIndent = 4 * 15 + 5,
        defaultBarWidth = 2000;

    //Set up scales
    var x = d3.scale.linear()
        .domain([0, defaultBarWidth])
        .range([0, width]);
    var y = d3.scale.ordinal()
        .rangeRoundBands([0, height], 0.3, 0);

    //Create SVG element
    d3.select(targetID).selectAll("svg").remove();
    var svg = d3.select(targetID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Adjust chart height
    d3.select("#chart").attr("height", height + margin.top + margin.bottom);

    //Package and export settings
    var settings = {
        margin: margin,
        width: width,
        height: height,
        categoryIndent: categoryIndent,
        svg: svg,
        x: x,
        y: y
    }

    return settings;
}

var redrawChart = function(settings, newdata) {
    // console.log('redraw...');

    //Import settings
    var margin = settings.margin,
        width = settings.width,
        height = settings.height,
        categoryIndent = settings.categoryIndent,
        svg = settings.svg,
        x = settings.x,
        y = settings.y;

    //Reset domains
    y.domain(newdata.sort(function(a, b) {
        return b.value - a.value;
    })
    .map(function(d) { return d.key; }));

    var barmax = d3.max(newdata, function(e) {
        return e.value;
    });
    x.domain([0, barmax*1.03]);

    /////////
    //ENTER//
    /////////

    //Bind new data to chart rows 

    //Create chart row and move to below the bottom of the chart
    var chartRow = svg.selectAll("g.chartRow")
        .data(newdata, function(d) { return d.key });

    var newRow = chartRow
        .enter()
        .append("g")
        .attr("class", "chartRow")
        .attr("transform", "translate(0," + height + margin.top + margin.bottom + ")");

    var teamMapping = {
        "得意的１天": 1,
        "２螺絲": 2,
        "３瑚礁": 3,
        "你４在叫我嗎": 4
    };

    //Add padding(at least containing team name)
    newRow.insert("rect")
        .attr("class", function(d) { return `bar team${teamMapping[d.key]}`; })
        .attr("x", 0)
        .attr("opacity", 0)
        .attr("height", y.rangeBand())
        .attr("width", function(d) { return 200; }); 

    //Add rectangles
    newRow.insert("rect")
        .attr("class", function(d) { return `bar team${teamMapping[d.key]}`; })
        // .attr("x", 0)
        .attr("x", function(d) { return 200; })
        .attr("opacity", 0)
        .attr("height", y.rangeBand())
        // .attr("width", function(d) { return x(d.value); });
        .attr("width", function(d) { return x(d.value); });

    //Add value labels
    newRow.append("text")
        .attr("class", "label")
        .attr("y", y.rangeBand() / 2)
        .attr("x", 0)
        .attr("opacity", 0)
        .attr("dy", ".35em")
        .attr("dx", "0.5em")
        .text(function(d) { return d.value; });
    
    //Add Headlines
    newRow.append("text")
        .attr("class", "category")
        .attr("text-overflow", "ellipsis")
        .attr("y", y.rangeBand() / 2)
        .attr("x", categoryIndent)
        .attr("opacity", 0)
        .attr("dy", ".35em")
        .attr("dx", "0.5em")
        .text(function(d) { return d.key });

    //////////
    //UPDATE//
    //////////
    
    //Update progress bar width
    d3.select("#prog-bar")
        // .transition()
        .style("width", (rnd + 1) / totalRnd * 100 + '%');

    //Update bar widths
    chartRow.select(".bar").transition()
        .duration(redrawDuration)
        .attr("width", function(d) { return Math.max(x(d.value)-60,200); })
        .attr("opacity", 1);

    //Update data labels
    chartRow.select(".label").transition()
        .duration(redrawDuration)
        .attr("opacity", 1)
        .attr("x", function(d) { return Math.max(x(d.value)-60,200); })
        .tween("text", function(d) { 
            let i = d3.interpolate(+this.textContent.replace(/\,/g,''), +d.value);
            return function(t) {
                this.textContent = Math.round(i(t));
            };
        });

    //Fade in categories
    chartRow.select(".category").transition()
      .duration(redrawDuration)
      .attr("opacity",1)
      .attr("x", function(d) { return Math.max(x(d.value)-d.key.length*28-85,175-d.key.length*28); })

    ////////
    //EXIT//
    ////////

    //Fade out and remove exit elements
    chartRow.exit().transition()
      .style("opacity", "0")
      .attr("transform", "translate(0," + (height + margin.top + margin.bottom) + ")")
      .remove();

    ////////////////
    //REORDER ROWS//
    ////////////////

    var delay = function(d, i) { return 100 + i * 30; };

    chartRow.transition()
        .delay(delay)
        .duration(redrawDuration)
        .attr("transform", function(d){ return "translate(0," + y(d.key) + ")"; });
};

var currData = []; // current data
var gameData = []; // target data
var teamList = ['得意的１天', '２螺絲', '３瑚礁', '你４在叫我嗎'];

var cleanFalgs = function() {
    for(let i=0 ; i<7 ; i++ )   d3.select('#stage-' + i).attr('src', './imgs/flag0.png');
    [].forEach.call(document.getElementsByClassName('stage'), function(el) {
        el.setAttribute('style', 'display: inline;');
    });
};

var initData = function(callback) {
    cleanFalgs();
    for(let i=0 ; i<teamList.length ; i++)
    {
        currData.push({
            key: teamList[i],
            value: 0,
            uid: i+1
        });           
    }

    d3.json("gamedata.json", function(err, data) {
        if(err) return console.warn(err);

        gameData = data;
        basicRnd = data[0].length;

        initData2(callback);
    });
};

var initData2 = function(callback) {
    d3.json("gamedata2.json", function(err, data) {
        if(err) return console.warn(err);

        advRnd = data[0].length;
        totalRnd = basicRnd + advRnd;
        for(let i=0 ; i<data.length ; i++) {
            gameData[i].push(...data[i]);
        }

        // add adv mark
        d3.select("#prog-container")
            .append("div")
            .style({
                position: "absolute",
                width: "1%",
                height: "20px",
                left: (basicRnd / totalRnd * 100) + "%",
                top: 0,
                background: "red"
            });

        callback();
    });
}

//Pulls data
//Uses a callback because d3.json loading is asynchronous
var pullData = function(settings, callback) {
    for(let i=0 ; i<gameData.length ; i++) {
        var idx = find(gameData[i][rnd]);
        if ( idx != -1 ) currData[idx].value += 60;
        if ( gameData[i][rnd] != 0 ) {
            d3.select('#stage-' + i).attr('src', './imgs/flag' + gameData[i][rnd] + '.png');
        }
    }
    var newData = formatData(currData.slice());
    callback(settings, newData);
}

var find = function(idx) {
    if ( idx == 0 ) return -1;
    for(let i=0 ; i<4 ; i++)    if ( currData[i].uid == idx )   return i;
}

//Sort data in descending order and take the top 4 values
var formatData = function(data) {
    return data.sort(function (a, b) {
        return b.value - a.value;
    })
    .slice(0, 4);
}

//I like to call it what it does
var redraw = function(settings) {
    pullData(settings, redrawChart);
}

var btn;

window.onload = function() {

    btn = document.getElementById('btn');

    btn.onclick = function() {
        //setup (includes first draw)
        var settings = setup('#chart');
        var redraw2 = function() {
            redraw(settings);
            rnd++;

            if(rnd != basicRnd) 
                setTimeout(redraw2, redrawDuration);
            else
            {
                cleanFalgs();
                redraw3();
            }
        };

        var redraw3 = function() {
            redraw(settings);
            rnd++;

            if(rnd != totalRnd)
                setTimeout(redraw3, redrawDuration);
        }

        initData(redraw2);
    };
}
