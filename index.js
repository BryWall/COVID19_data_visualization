
/**const confirmed_url = 'data/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
const deaths_url = 'data/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
const recovered_url = 'data/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';
 **/
const confirmed_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
const deaths_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
const recovered_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';
const debut_date = new Date("1/22/2020");
const date_now = new Date();



function getDataJsonFromCSV(url) {
    $.get(url, (data) => {
        return CSVToJSON(data);
    })
}

function CSVToArray(csvData, delimiter) {
    delimiter = (delimiter || ",");
    var pattern = new RegExp((
        "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        "([^\"\\" + delimiter + "\\r\\n]*))"), "gi");
    var data = [[]];
    var matches = null;
    while (matches = pattern.exec(csvData)) {
        var matchedDelimiter = matches[1];
        if (matchedDelimiter.length && (matchedDelimiter != delimiter)) {
            data.push([]);
        }
        if (matches[2]) {
            var matchedDelimiter = matches[2].replace(
                new RegExp("\"\"", "g"), "\"");
        } else {
            var matchedDelimiter = matches[3];
        }
        data[data.length - 1].push(matchedDelimiter);
    }
    return (data);
}

function CSVToJSON(csvData) {
    var data = CSVToArray(csvData);
    var objData = [];
    for (var i = 1; i < data.length; i++) {
        objData[i - 1] = {};
        for (var k = 0; k < data[0].length && k < data[i].length; k++) {
            var key = data[0][k];
            objData[i - 1][key] = data[i][k]
        }
    }
    var jsonData = JSON.stringify(objData);
    jsonData = jsonData.replace(/},/g, "},\r\n");
    return jsonData;
}

function updateMap(url, map) {
    echarts.dispose(map);
    var chart = echarts.init(map);
    chart.showLoading();
    $.get(url, (data) => {
        let date = debut_date;
        let dataJson = CSVToJSON(data);
        chart.hideLoading();
        var lines = data.split('\n');
        var res = [];
        JSON.parse(dataJson).forEach( local => {
            let i = 0 ;
            while(date <= date_now) {
                let value = [local.Long, local.Lat, local[moment(date).format("M/D/YY")], local["Province/State"] + ' ' + local["Country/Region"]];
                if(res[i])
                    res[i].push(value);
                else
                    res[i] = [value];
                date.setDate(date.getDate() + 1);
                i++;
            }
            date = new Date("1/22/2020");
        });
        var options = res.map( (day) => {
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
                playInterval: 600,
                symbolSize: 5,
                tooltip: {
                    formatter: (params) => {
                        return params.name;
                    }
                },
                itemStyle: {
                    color: '#ccc'
                },
                lineStyle: {
                    color: '#eee',
                    width: 4,
                },
                label: {
                    color: '#999'
                },
                checkpointStyle: {
                    color: 'black',
                    borderColor: '#999'
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
            title: {
                text: "Propagation du Covid-19",
                left: 'center',
                top: 20,
                textStyle: {
                    color: '#000',
                    fontSize: 25
                }
            },
            tooltip: {
                show: true,
                formatter:  (params) => {
                    if(url == confirmed_url)
                        var mode = "confirmés";
                    if(url == deaths_url)
                        var mode = "morts";
                    if(url == recovered_url)
                        var mode = "guéris";
                    return `${params.value[3]} : ${numeral(params.value[2]).format('0,0')} ${mode}`;
                }
            },
            series: [{
                type: 'scatter',
                animation: false,
                coordinateSystem: 'leaflet',
                data: [],
                symbolSize: (value) => {
                    return value[2] > 0 ? Math.log(value[2]) * 3 : 0;
                },
                itemStyle: {
                    color: 'red',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                }
            }],
            visualMap: {
                type: 'continuous',
                min: 0,
                max: 300,
                inRange: {
                    color: ['orange','red'],
                    opacity: [0.3, 0.7]
                },
                dimension: 2
            },
            leaflet: {
                center: [0, 40],
                roam: false
            }
        }
    });
}



function getDataNow() {
    //appel ajax
    var headers = new Headers();
    var dataUrl = $.ajax({
        url: "https://coronavirus-tracker-api.herokuapp.com/v2/locations",
        dataType: "json",
        async: false
    }).responseText;
    //transformation en json
    var jsonData = JSON.parse(dataUrl);
    //initialisation variables
    var data = {};
    data.latest = jsonData.latest;
    data.locations = [];
    var lastCountry = "";
    jsonData.locations.forEach(location => {
        //initialisation des variables de location
        let confirmed = location.latest.confirmed;
        let deaths= location.latest.deaths;
        let recovered = location.latest.recovered;
        let country  = location.country;
        let population = location.country_population;
        //si nouveau pays
        if(country != lastCountry) {
            data.locations.push({
                "country": country,
                "population" : population,
                "confirmed" : confirmed,
                "recovered" : recovered,
                "deaths" : deaths
            });
            //changement dernier pays
            lastCountry = country;
        }
        else{
            //récupération country déjà présent et je l'enlève de la list
            let countryData = data.locations.pop();
            //je la remplace par la nouvelle valeur
            data.locations.push({
                "country": country,
                "population" : population,
                "confirmed" : countryData.confirmed + confirmed,
                "deaths" : countryData.deaths + deaths,
                "recovered" : countryData.recovered = recovered
            });
        }
    });
    return data;
}


function drawPieChart(pie) {
    var chart = echarts.init(pie);
    var data = getDataNow();
    var option = {
        backgroundColor: '#2c343c',

        title: {
            text: 'Proportion des cas dans le monde',
            left: 'center',
            top: 20,
            textStyle: {
                color: '#ccc',
                fontSize: 25
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                return `${params.name} : ${numeral(params.value).format('0,0')} (${params.percent}%)`;
            }
        },
        series: [
            {
                name: 'Proportion des cas',
                type: 'pie',
                radius: '55%',
                center: ['50%', '50%'],
                data: [
                    {value: data.latest.confirmed, name: 'Confirmés'},
                    {value: data.latest.deaths, name: 'Morts'},
                    {value: data.latest.recovered, name: 'Guéris'}
                ].sort((a, b) => { return a.value - b.value; }),
                label: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    formatter : '{b} : {d}%'
                },
                labelLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    },
                    smooth: 0.2,
                    length: 10,
                    length2: 20
                },
                itemStyle: {
                    color: '#c23531',
                    shadowBlur: 200,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },

                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: function (idx) {
                    return Math.random() * 200;
                }
            }
        ]
    };
    chart.setOption(option);
}

function selectCountries() {
    var select = document.getElementById('countries');
    var data = getDataNow();
    data.locations.forEach((location) => {
        var option = document.createElement('option');
        option.value = location.country;
        option.innerText = location.country;
        select.appendChild(option);
    })
    select.value="France";
}

function getCountryFromData(country) {
    return getDataNow().locations.find((data) => data.country == country);
}

function drawPieChartCountries(pie, country) {
    var chart = echarts.init(pie);
    var dataCountry = getCountryFromData(country);
    var option = {
        backgroundColor: '#2c343c',

        title: {
            text: 'Proportion des cas dans le pays : ' + dataCountry.country,
            left: 'center',
            top: 20,
            textStyle: {
                color: '#ccc',
                fontSize : 25
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                return `${params.name} : ${numeral(params.value).format('0,0')} (${params.percent}%)`;
            }
        },
        series: [
            {
                name: 'Proportion des cas',
                type: 'pie',
                radius: '55%',
                center: ['50%', '50%'],
                data: [
                    {value: dataCountry.confirmed, name: 'Confirmés'},
                    {value: dataCountry.deaths, name: 'Morts'},
                    {value: dataCountry.recovered, name: 'Guéris'}
                ].sort((a, b) => { return a.value - b.value; }),
                label: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    formatter : '{b} : {d}%'
                },
                labelLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    },
                    smooth: 0.2,
                    length: 10,
                    length2: 20
                },
                itemStyle: {
                    color: '#c23531',
                    shadowBlur: 200,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },

                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: function (idx) {
                    return Math.random() * 200;
                }
            }
        ]
    };
    chart.setOption(option);
}

function getDataGlobal(confirmed,deaths,recovered,pourcentage){
    var data = getDataNow();
    var population = 0;
    data.locations.forEach(location => {
        population+=location.population;
    })
    confirmed.innerHTML = numeral(data.latest.confirmed).format('0,0');
    deaths.innerHTML = numeral(data.latest.deaths).format('0,0');
    recovered.innerHTML = numeral(data.latest.recovered).format('0,0');
    pourcentage.innerHTML = `${100 * ((data.latest.confirmed+data.latest.deaths+data.latest.recovered) / population).toPrecision(2)} %`


}



window.addEventListener('load', () => {
    //init var
    var confirmed_button = document.getElementById("btn_confirmed");
    var deaths_button = document.getElementById("btn_deaths");
    var recovered_button = document.getElementById("btn_recovered");
    var map = document.getElementById('map');
    var pie = document.getElementById('globalPieChart');
    var confirmed = document.getElementById('confirmed');
    var deaths = document.getElementById('deaths');
    var recovered = document.getElementById('recovered');
    var pourcentage = document.getElementById('pourcentage');
    var pieCountries = document.getElementById('piechartCountries');
    var selectPieCountries = document.getElementById('countries');
    var selectMapEvolution = document.getElementById('selectMapEvolution');
    //init charts
    updateMap(confirmed_url,map);
    drawPieChart(pie);
    selectCountries();
    drawPieChartCountries(pieCountries, selectPieCountries.value);
    getDataGlobal(confirmed,deaths,recovered,pourcentage);
    //events
    selectPieCountries.onchange = () => { drawPieChartCountries(pieCountries, selectPieCountries.value)};
    confirmed_button.onclick = () => { updateMap(confirmed_url,map) }
    deaths_button.onclick = () => { updateMap(deaths_url,map) }
    recovered_button.onclick = () => { updateMap(recovered_url,map) }
})