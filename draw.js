//updatingBarChart.js

// const value

const redrawDuration = 500;
const step = 0.03;

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
    x.domain([0, barmax]);

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

let initData = function() {
    d3.json("gamedata.json", function(err, data) {
        if(err) return console.warn(err);

        gameData = data;
        for(let i=0 ; i<gameData.length ; i++)
        {
            currData.push({
                key: teamList[i],
                value: 0
            });
            for(let j=0; j<7; j++ ) d3.select('#stage-' + j).attr('src', './imgs/flag0.png');
        }
    })
}

//Pulls data
//Since our data is fake, adds some random changes to simulate a data stream.
//Uses a callback because d3.json loading is asynchronous
var pullData = function(settings, callback) {
    let modified = new Array(currData.length);
    modified = modified.fill(0);

    for(let i = 0 ; i < currData.length ; i++) {
        if(gameData[i].value == currData[i].value) continue;

        let ratio = (currData[i].value / gameData[i].value) + Math.random() * step;
        currData[i].value = Math.round(gameData[i].value * Math.min(ratio, 1));

        modified[i] = 1;
    }

    var newData = formatData(currData.slice());

    // if(modified.some(v => v))
    // {
        callback(settings, newData);
        return true;
    // }
    // else // finish
    // {
    //     return false;
    // }
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
    if(pullData(settings, redrawChart))
        setTimeout(() => {
            redraw(settings);
        }, redrawDuration);
}

window.onload = function() {
    //setup (includes first draw)
    var settings = setup('#chart');
    initData();
    // redraw(settings);

    // //Repeat 
    // let keep = true;
    // let redrawId = setInterval(function() {
    //     keep = redraw(settings);
    // }, redrawDuration);

    // // Stop redraw
    // while(keep) {}
    // clearInterval(redrawId);

    // // check
    // for(let i = 0 ; i < currData.length ; i++)
    // {
    //     console.log(`c: ${currData[i].value}, t: ${gameData[i].value}`);
    // }
};