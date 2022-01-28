#!/usr/bin/node
const vg = require('vega');
const vegalite = require('vega-lite');
const fs = require('fs');
const make = (questions, name, logger) => {
    var chart = {
        "width": 320,
        "height": 640,
        "data": {
            "values": questions
        },
        "title": {
            "text": "histogram of the repartition of the questions of " + name + ".",
            "align": "center",
            "color": "orangered"
        },
        "mark": "bar",
        "encoding": {
            "x": {
                "field": "type", "type": "nominal",
                "axis": {"title": "Question type."}
            },
            "y": {
                "aggregate": "count", "type": "quantitative",
                "axis": {"title": "Number of questions"}
            }
        }
    }

    const myChart = vegalite.compile(chart).spec;

    /* SVG version */
    var runtime = vg.parse(myChart);
    var view = new vg.View(runtime).renderer('svg').run();
    var mySvg = view.toSVG();
    mySvg.then(function (res) {
        fs.writeFileSync("./profiles/" + name + ".svg", res)
        view.finalize();
        //logger.info("%s", JSON.stringify(myChart, null, 2));
        logger.info("Your visualization is at : ./profiles/" + name + ".svg");

    })

}
const compareProfile = (exmQTypes, exmName, banksQTypes, loadedBanksNames, logger) => {

    var chart = {
        "hconcat": [
            {
                "vconcat": [{
                    "width": 240,
                    "height": 240,
                    "data": {
                        "values": Object.entries(exmQTypes).reduce((acc, curr) => {
                            acc.push({"type": curr[0], "count": curr[1]})
                            return acc
                        }, [])
                    },
                    "transform": [
                        {
                            "filter": "datum.count >0"
                        }
                    ],

                    "title": {
                        "text": "Pie chart : '" + exmName + "'",
                        "align": "center",
                        "color": "orangered"
                    },
                    "encoding": {
                        "theta": {"field": "count", "type": "quantitative"},
                        "radius": {"field": "count", "scale": {"type": "sqrt", "zero": true}},
                        "color": {"field": "type", "type": "nominal"}
                    },
                    "layer": [{
                        "mark": {"type": "arc", "innerRadius": 150, "stroke": "#fff"}
                    }]
                }, {
                    "width": 320,
                    "height": 320,
                    "data": {
                        "values": Object.entries(exmQTypes).reduce((acc, curr) => {
                            acc.push({"type": curr[0], "count": curr[1]})
                            return acc
                        }, [])
                    },
                    "title": {
                        "text": "Histogram : '" + exmName + "'",
                        "align": "center",
                        "color": "orangered"
                    },
                    "mark": "bar",
                    "encoding": {
                        "x": {
                            "field": "type", "type": "nominal",
                            "axis": {"title": "Question type."}
                        },
                        "y": {
                            "field": "count", "type": "quantitative",
                            "axis": {"title": "Number of questions"}
                        }
                    }
                }
                ]
            }
            ,
            {
                "vconcat": [{
                    "width": 240,
                    "height": 240,
                    "data": {
                        "values": Object.entries(banksQTypes).reduce((acc, curr) => {
                            acc.push({type: curr[0], count: curr[1]})
                            return acc
                        }, [])
                    },
                    "transform": [
                        {
                            "filter": "datum.count >0"
                        }
                    ],

                    "title": {
                        "text": "Pie chart : " + loadedBanksNames.join(', '),
                        "align": "center",
                        "color": "orangered"
                    },
                    "encoding": {
                        "theta": {"field": "count", "type": "quantitative"},
                        "radius": {"field": "count", "scale": {"type": "sqrt", "zero": true}},
                        "color": {"field": "type", "type": "nominal"}
                    },
                    "layer": [{
                        "mark": {"type": "arc", "innerRadius": 150, "stroke": "#fff"}
                    }]
                },
                    {
                        "width": 320,
                        "height": 320,
                        "data": {
                            "values": Object.entries(banksQTypes).reduce((acc, curr) => {
                                acc.push({type: curr[0], count: curr[1]})
                                return acc
                            }, [])
                        },
                        "title": {
                            "text": "Histogram : " + loadedBanksNames.join(', '),
                            "align": "center",
                            "color": "orangered"
                        },
                        "mark": "bar",
                        "encoding": {
                            "x": {
                                "field": "type", "type": "nominal",
                                "axis": {"title": "Question type."}
                            },
                            "y": {
                                "field": "count", "type": "quantitative",
                                "axis": {"title": "Number of questions"}
                            }
                        }
                    }]
            }]

    }

    const myChart = vegalite.compile(chart).spec;

    /* SVG version */
    var runtime = vg.parse(myChart);
    var view = new vg.View(runtime).renderer('svg').run();
    var mySvg = view.toSVG();
    mySvg.then(function (res) {
        fs.writeFileSync("./profiles/comparison-" + exmName + ".svg", res)
        view.finalize();
        logger.info("Your visualization is at : ./profiles/comparison-" + exmName + ".svg");

    })

}

module.exports = {
    make: make,
    compareProfile: compareProfile
}