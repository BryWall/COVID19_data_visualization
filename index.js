var dom = document.getElementById('main');
var chart = echarts.init(dom);
var confirmed_button = document.getElementById("confirmed");
var deaths_button = document.getElementById("deaths");
var recovered_button = document.getElementById("recovered");
const confirmed_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
const deaths_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
const recovered_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';






function updateMap(url) {
    echarts.dispose(dom);
    var chart = echarts.init(dom);
    chart.showLoading();
    $.get(url, function (data) {
        chart.hideLoading();
        var lines = data.split('\n');
        var result = [];
        for (var i = 1; i < lines.length; ++i) {
            var columns = lines[i].split(',');

            for (var j = 4; j < columns.length; ++j) {
                var value = [
                    //latitude
                    columns[3],
                    //longitude
                    columns[2],
                    //number
                    columns[j],
                    //province pays
                    columns[0] + ' ' + columns[1]
                ];
                var id = j - 4;
                if (result[id]) {
                    result[id].push(value);
                }
                else {
                    result[id] = [value];
                }
            }
        }
        console.log(result);

        var options = result.map(function (day) {
            return {
                series: {
                    data: day
                }
            };
        })

        chart.setOption({
            timeline: {
                axisType: 'category',
                data: lines[0].split(',').slice(4),
                autoPlay: true,
                playInterval: 500,
                symbolSize: 4,
                tooltip: {
                    formatter: function (params) {
                        return params.name;
                    }
                },
                itemStyle: {
                    color: '#ccc'
                },
                lineStyle: {
                    color: '#eee'
                },
                label: {
                    color: '#999'
                },
                checkpointStyle: {
                    color: 'red'
                },
                controlStyle: {
                    borderColor: '#bbb'
                }
            },
            options: options
        })
    });

    chart.setOption({
        baseOption: {
            tooltip: {
                show: true,
                formatter: function (params) {
                    return params.value[3] + ':' + params.value[2];
                }
            },
            series: [{
                type: 'scatter',
                animation: false,
                coordinateSystem: 'leaflet',
                data: [],
                symbolSize: function (value) {
                    return value[2] > 0 ? Math.log(value[2]) * 3 : 0;
                },
                itemStyle: {
                    color: 'red',
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                }
            }],
            visualMap: {
                type: 'continuous',
                min: 0,
                max: 300,
                inRange: {
                    color: ['orange', 'red'],
                    opacity: [0.5, 0.8]
                },
                dimension: 2
            },
            leaflet: {
                center: [0, 40],
                roam: true,
                tiles: [{
                    urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
                }]
            }
        }
    });
}

window.addEventListener('load', function () {
    updateMap(confirmed_url);
    confirmed_button.onclick = () => { updateMap(confirmed_url) }
    deaths_button.onclick = () => { updateMap(deaths_url) }
    recovered_button.onclick = () => { updateMap(deaths_url) }
})