




function drawGlob(chart) {
    $.getJSON("https://coronavirus-tracker-api.herokuapp.com/v2/locations", (data) => {
        chart.showLoading();

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
                    autoRotate: true
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
    })
}

window.addEventListener('load', () => {
    var main = document.getElementById('main');
    var chart = echarts.init(main);
    drawGlob(chart);
})