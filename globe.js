




function drawGlob(chart) {
    chart.showLoading();
    $.getJSON("https://coronavirus-tracker-api.herokuapp.com/v2/locations", (data) => {
        data = data.locations.map((dataItem) => {
            return [dataItem.coordinates.longitude,dataItem.coordinates.latitude, dataItem.latest.confirmed];
        });

        option = {
            backgroundColor: '#000',
            globe: {
                baseTexture: "asset/world.topo.bathy.200401.jpg",
                heightTexture: "asset/world.topo.bathy.200401.jpg",
                shading: 'lambert',
                environment: "asset/starfield.jpg",
                light: {
                    main: {
                        intensity: 2
                    }
                },
                viewControl: {
                    autoRotate: true,
                    distance: 200,
                    targetCoord: [2.2137, 20.2276]
                }
            },
            visualMap: {
                max: 40,
                calculable: true,
                realtime: false,
                inRange: {
                    colorLightness: [0.2, 0.9]
                },
                textStyle: {
                    color: '#fff'
                },
                controller: {
                    inRange: {
                        color: 'orange'
                    }
                },
                outOfRange: {
                    colorAlpha: 0
                }
            },
            series: [{
                type: 'bar3D',
                coordinateSystem: 'globe',
                data: data,
                barSize: 0.6,
                minHeight: 0.2,
                silent: true,
                itemStyle: {
                    color: 'orange'
                }
            }]
        };

        chart.setOption(option);
        chart.hideLoading();
    }).fail(() => {
        chart.hideLoading();
        var main = document.getElementById('main');
        main.innerText = "There is an error with de Coronavirus Tracker API ..."
    })
}

window.addEventListener('load', () => {
    var main = document.getElementById('main');
    var chart = echarts.init(main);
    drawGlob(chart);
})